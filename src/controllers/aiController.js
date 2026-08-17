const db = require("../config/db");
const {
    createRateLimiter
} = require("../middleware/rateLimitMiddleware");
const {
    buildGarageAiContext,
    hasAiConfiguration,
    requestGarageAiReply
} = require("../services/garageAiService");
const {
    recordAiConversation,
    updateAiConversationFeedback,
    getAiConversationHistory,
    getHelpfulAiExamples,
    formatConversationDatasetRow,
    getAiConversationExportRows
} = require("../services/aiTrainingService");

const aiChatLimiter = createRateLimiter({
    keyPrefix: "ai-chat",
    windowMs: 60 * 1000,
    maxRequests: 12,
    message:
        "Too many AI requests. Please wait a moment before asking again."
});

function normalizeQuestion(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

async function loadGarageData(userId) {
    const [
        vehiclesResult,
        maintenanceResult,
        serviceResult,
        issueResult,
        documentResult,
        expenseResult,
        fuelResult,
        costSummaryResult
    ] = await Promise.all([
        db.query(
            `SELECT
                id,
                brand,
                model,
                model_year,
                nickname,
                license_plate,
                current_mileage,
                ownership_status
             FROM vehicles
             WHERE user_id = $1
               AND vehicle_status = 'active'
             ORDER BY created_at DESC`,
            [userId]
        ),
        db.query(
            `SELECT
                mp.id,
                mp.vehicle_id,
                mp.name,
                mp.category,
                mp.interval_km,
                mp.interval_months,
                mp.last_service_km,
                mp.last_service_date,
                mp.estimated_cost,
                mp.is_critical,
                v.current_mileage,
                CASE
                    WHEN mp.interval_km IS NOT NULL
                        AND mp.last_service_km IS NOT NULL
                        AND v.current_mileage >=
                            mp.last_service_km + mp.interval_km
                        THEN 'overdue'
                    WHEN mp.interval_months IS NOT NULL
                        AND mp.last_service_date IS NOT NULL
                        AND CURRENT_DATE >= (
                            mp.last_service_date +
                            (
                                mp.interval_months *
                                INTERVAL '1 month'
                            )
                        )::DATE
                        THEN 'overdue'
                    WHEN mp.interval_km IS NOT NULL
                        AND mp.last_service_km IS NOT NULL
                        AND v.current_mileage >=
                            (mp.last_service_km + mp.interval_km - 1000)
                        THEN 'due_soon'
                    WHEN mp.interval_months IS NOT NULL
                        AND mp.last_service_date IS NOT NULL
                        AND CURRENT_DATE >= (
                            (
                                mp.last_service_date +
                                (
                                    mp.interval_months *
                                    INTERVAL '1 month'
                                )
                            )::DATE - INTERVAL '30 days'
                        )::DATE
                        THEN 'due_soon'
                    ELSE 'ok'
                END AS status
             FROM maintenance_plans mp
             INNER JOIN vehicles v
                ON v.id = mp.vehicle_id
             WHERE v.user_id = $1
               AND v.vehicle_status = 'active'`,
            [userId]
        ),
        db.query(
            `SELECT
                sh.id,
                sh.vehicle_id,
                sh.maintenance_plan_id,
                sh.service_name,
                TO_CHAR(sh.completed_at, 'YYYY-MM-DD') AS completed_at,
                sh.actual_cost
             FROM service_history sh
             INNER JOIN vehicles v
                ON v.id = sh.vehicle_id
             WHERE v.user_id = $1
               AND v.vehicle_status = 'active'
             ORDER BY sh.completed_at DESC, sh.id DESC
             LIMIT 120`,
            [userId]
        ),
        db.query(
            `SELECT
                vi.id,
                vi.vehicle_id,
                vi.issue_title,
                vi.risk_level,
                vi.status
             FROM vehicle_issues vi
             INNER JOIN vehicles v
                ON v.id = vi.vehicle_id
             WHERE vi.user_id = $1
               AND v.vehicle_status = 'active'
             ORDER BY vi.created_at DESC`,
            [userId]
        ),
        db.query(
            `SELECT
                d.id,
                d.vehicle_id,
                d.title,
                d.document_type,
                TO_CHAR(d.expiry_date, 'YYYY-MM-DD') AS expiry_date,
                (
                    d.expiry_date -
                    CURRENT_DATE
                )::INTEGER AS days_remaining,
                CASE
                    WHEN d.expiry_date < CURRENT_DATE
                        THEN 'expired'
                    WHEN d.expiry_date <=
                        CURRENT_DATE + d.reminder_days
                        THEN 'due_soon'
                    ELSE 'valid'
                END AS renewal_status
             FROM vehicle_documents d
             INNER JOIN vehicles v
                ON v.id = d.vehicle_id
             WHERE v.user_id = $1
               AND v.vehicle_status = 'active'
             ORDER BY d.expiry_date ASC`,
            [userId]
        ),
        db.query(
            `SELECT
                e.id,
                e.vehicle_id,
                e.amount,
                TO_CHAR(e.expense_date, 'YYYY-MM-DD') AS expense_date
             FROM vehicle_expenses e
             INNER JOIN vehicles v
                ON v.id = e.vehicle_id
             WHERE v.user_id = $1
               AND v.vehicle_status = 'active'
             ORDER BY e.expense_date DESC, e.id DESC
             LIMIT 120`,
            [userId]
        ),
        db.query(
            `SELECT
                f.id,
                f.vehicle_id,
                f.total_cost,
                TO_CHAR(f.filled_at, 'YYYY-MM-DD') AS filled_at
             FROM fuel_entries f
             INNER JOIN vehicles v
                ON v.id = f.vehicle_id
             WHERE v.user_id = $1
               AND v.vehicle_status = 'active'
             ORDER BY f.filled_at DESC, f.id DESC
             LIMIT 120`,
            [userId]
        ),
        db.query(
            `SELECT
                COALESCE(
                    (
                        SELECT SUM(f.total_cost)
                        FROM fuel_entries f
                        INNER JOIN vehicles v
                            ON v.id = f.vehicle_id
                        WHERE v.user_id = $1
                          AND v.vehicle_status = 'active'
                    ),
                    0
                ) AS total_fuel_cost,
                COALESCE(
                    (
                        SELECT SUM(e.amount)
                        FROM vehicle_expenses e
                        INNER JOIN vehicles v
                            ON v.id = e.vehicle_id
                        WHERE v.user_id = $1
                          AND v.vehicle_status = 'active'
                    ),
                    0
                ) AS total_expense_cost,
                COALESCE(
                    (
                        SELECT SUM(sh.actual_cost)
                        FROM service_history sh
                        INNER JOIN vehicles v
                            ON v.id = sh.vehicle_id
                        WHERE v.user_id = $1
                          AND v.vehicle_status = 'active'
                    ),
                    0
                ) AS total_service_cost`,
            [userId]
        )
    ]);

    const summaryRow =
        costSummaryResult.rows[0] || {};

    return {
        vehicles: vehiclesResult.rows,
        maintenancePlans:
            maintenanceResult.rows,
        serviceHistory: serviceResult.rows,
        issues: issueResult.rows,
        documents: documentResult.rows,
        expenses: expenseResult.rows,
        fuelEntries: fuelResult.rows,
        costSummary: {
            totalFuelCost:
                Number(summaryRow.total_fuel_cost) ||
                0,
            totalExpenseCost:
                Number(
                    summaryRow.total_expense_cost
                ) || 0,
            totalServiceCost:
                Number(
                    summaryRow.total_service_cost
                ) || 0,
            totalOwnershipCost:
                (Number(
                    summaryRow.total_fuel_cost
                ) || 0) +
                (Number(
                    summaryRow.total_expense_cost
                ) || 0) +
                (Number(
                    summaryRow.total_service_cost
                ) || 0)
        }
    };
}

async function chatWithGarageAi(
    req,
    res,
    next
) {
    try {
        const question = normalizeQuestion(
            req.body.message
        );

        if (!question) {
            return res.status(400).json({
                success: false,
                message:
                    "Ask a question before sending it to CarCare AI."
            });
        }

        if (question.length > 1000) {
            return res.status(400).json({
                success: false,
                message:
                    "Keep the AI question under 1000 characters."
            });
        }

        const garageData = await loadGarageData(
            req.session.userId
        );
        const garageContext =
            buildGarageAiContext(garageData);
        const helpfulExamples =
            await getHelpfulAiExamples(
                req.session.userId
            );

        if (garageContext.overview.activeVehicleCount === 0) {
            return res.json({
                success: true,
                configured: true,
                aiMode:
                    hasAiConfiguration()
                        ? "openai"
                        : "local",
                garageContext,
                conversation: null,
                reply:
                    "Add an active vehicle first. Then I can comment on maintenance risk, upcoming spend and document readiness."
            });
        }

        const result =
            await requestGarageAiReply({
                message: question,
                garageContext,
                helpfulExamples
            });

        const conversation =
            await recordAiConversation({
                userId: req.session.userId,
                question,
                reply: result.reply,
                garageContext,
                model: result.model
            });

        res.json({
            success: true,
            configured: true,
            aiMode:
                result.model ===
                "carcare-local-rules"
                    ? "local"
                    : "openai",
            model: result.model,
            garageContext,
            reply: result.reply,
            conversation
        });
    } catch (error) {
        next(error);
    }
}

function normalizeFeedbackStatus(value) {
    if (value === "helpful") {
        return "helpful";
    }

    if (value === "not_helpful") {
        return "not_helpful";
    }

    return "";
}

function normalizeOptionalFeedbackNote(value) {
    if (typeof value !== "string") {
        return null;
    }

    const note = value.trim();

    if (!note) {
        return null;
    }

    return note.slice(0, 1200);
}

async function saveGarageAiFeedback(
    req,
    res,
    next
) {
    try {
        const conversationId = Number(
            req.params.id
        );

        if (!Number.isInteger(conversationId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid AI conversation ID."
            });
        }

        const feedbackStatus =
            normalizeFeedbackStatus(
                req.body.feedbackStatus
            );

        if (!feedbackStatus) {
            return res.status(400).json({
                success: false,
                message:
                    "Feedback must be helpful or not helpful."
            });
        }

        const feedback =
            await updateAiConversationFeedback({
                conversationId,
                userId: req.session.userId,
                feedbackStatus,
                feedbackNote:
                    normalizeOptionalFeedbackNote(
                        req.body.feedbackNote
                    )
            });

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message:
                    "AI conversation was not found."
            });
        }

        res.json({
            success: true,
            message:
                feedbackStatus === "helpful"
                    ? "Feedback saved. This reply is now a positive training example."
                    : "Feedback saved. This reply is now marked for review.",
            feedback
        });
    } catch (error) {
        next(error);
    }
}

async function getGarageAiHistory(
    req,
    res,
    next
) {
    try {
        res.json({
            success: true,
            conversations:
                await getAiConversationHistory(
                    req.session.userId
                )
        });
    } catch (error) {
        next(error);
    }
}

async function exportGarageAiDataset(
    req,
    res,
    next
) {
    try {
        const feedbackStatus =
            normalizeFeedbackStatus(
                req.query.feedbackStatus
            ) || "all";

        const rows =
            await getAiConversationExportRows({
                userId: req.session.userId,
                feedbackStatus
            });

        const jsonl = rows
            .map(formatConversationDatasetRow)
            .join("\n");

        res.setHeader(
            "Content-Type",
            "application/x-ndjson; charset=utf-8"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="carcare-ai-dataset-${feedbackStatus}.jsonl"`
        );

        res.send(jsonl);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    aiChatLimiter,
    chatWithGarageAi,
    saveGarageAiFeedback,
    getGarageAiHistory,
    exportGarageAiDataset
};
