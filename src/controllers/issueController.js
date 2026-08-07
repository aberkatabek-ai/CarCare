const db = require("../config/db");
const path = require("path");
const {
    normalizeOptionalFilePayload,
    saveUploadedDocument,
    removeStoredDocument
} = require("../utils/documentUpload");
const {
    normalizeComparableText
} = require("../utils/suspiciousData");

const allowedCategories = new Set([
    "engine",
    "brakes",
    "steering",
    "suspension",
    "transmission",
    "electrical",
    "cooling",
    "tires",
    "exhaust",
    "body",
    "other"
]);

const allowedSeverities = new Set([
    "mild",
    "moderate",
    "severe"
]);

const allowedWarningLights = new Set([
    "none",
    "yellow",
    "red"
]);

const criticalCategories = new Set([
    "brakes",
    "steering",
    "tires"
]);

function parsePositiveInteger(value) {
    const number = Number(value);

    if (
        !Number.isInteger(number) ||
        number <= 0
    ) {
        return null;
    }

    return number;
}

function parseMileage(value) {
    const mileage = Number(value);

    if (
        !Number.isInteger(mileage) ||
        mileage < 0
    ) {
        return null;
    }

    return mileage;
}

function parseOptionalCost(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const cost = Number(value);

    if (
        !Number.isFinite(cost) ||
        cost < 0
    ) {
        return Number.NaN;
    }

    return cost;
}

function normalizeDate(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return null;
    }

    const date = new Date(
        `${value}T00:00:00Z`
    );

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        return null;
    }

    return value;
}

function normalizeRequiredText(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function normalizeOptionalText(value) {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        return null;
    }

    return value.trim();
}

function parseBoolean(value, defaultValue) {
    if (typeof value === "boolean") {
        return value;
    }

    if (value === "true") {
        return true;
    }

    if (value === "false") {
        return false;
    }

    return defaultValue;
}

function calculateRiskLevel({
    category,
    severity,
    warningLight,
    canDriveNormally,
    isWorsening
}) {
    const isCriticalCategory =
        criticalCategories.has(category);

    if (
        warningLight === "red" ||
        canDriveNormally === false ||
        (
            isCriticalCategory &&
            severity === "severe"
        )
    ) {
        return "red";
    }

    if (
        severity === "severe" ||
        warningLight === "yellow" ||
        isWorsening === true ||
        (
            isCriticalCategory &&
            severity === "moderate"
        )
    ) {
        return "orange";
    }

    return "green";
}

function getIssueMediaAbsolutePath(
    storedFileName
) {
    return path.join(
        __dirname,
        "..",
        "..",
        "uploads",
        "documents",
        storedFileName
    );
}

function normalizeIssuePhotoPayloads(files) {
    if (
        files === undefined ||
        files === null ||
        files === ""
    ) {
        return {
            value: []
        };
    }

    if (!Array.isArray(files)) {
        return {
            error:
                "Issue photos must be uploaded as a list."
        };
    }

    if (files.length > 5) {
        return {
            error:
                "You can upload up to 5 issue photos at once."
        };
    }

    const normalizedFiles = [];

    for (const file of files) {
        const validation =
            normalizeOptionalFilePayload(file);

        if (validation.error) {
            return {
                error: validation.error
            };
        }

        if (!validation.value) {
            continue;
        }

        if (
            ![
                "image/jpeg",
                "image/png",
                "image/webp"
            ].includes(validation.value.mimeType)
        ) {
            return {
                error:
                    "Issue photos must be JPG, PNG or WEBP images."
            };
        }

        normalizedFiles.push(
            validation.value
        );
    }

    return {
        value: normalizedFiles
    };
}

async function attachIssueMedia(rows) {
    if (!rows.length) {
        return rows;
    }

    const issueIds = rows.map(
        (row) => row.id
    );

    const mediaResult = await db.query(
        `SELECT
            id,
            issue_id,
            original_file_name,
            file_mime_type,
            file_size,
            created_at
         FROM vehicle_issue_media
         WHERE issue_id = ANY($1::BIGINT[])
         ORDER BY created_at ASC, id ASC`,
        [issueIds]
    );

    const mediaMap = new Map();

    mediaResult.rows.forEach((media) => {
        const mediaList =
            mediaMap.get(media.issue_id) || [];

        mediaList.push({
            ...media,
            file_url:
                `/api/issues/media/${media.id}/file`
        });

        mediaMap.set(
            media.issue_id,
            mediaList
        );
    });

    return rows.map((row) => ({
        ...row,
        photos:
            mediaMap.get(row.id) || []
    }));
}

async function findOwnedIssue(
    issueId,
    userId
) {
    const result = await db.query(
        `SELECT
            vi.id,
            vi.user_id,
            vi.vehicle_id,
            vi.issue_title,
            vi.category,
            vi.description,
            vi.occurs_when,
            vi.severity,
            vi.warning_light,
            vi.can_drive_normally,
            vi.is_worsening,
            vi.risk_level,
            vi.status,
            vi.mechanic_diagnosis,
            vi.resolution_notes,
            vi.service_history_id,
            vi.resolved_at,
            vi.created_at,
            vi.updated_at,
            v.brand,
            v.model,
            v.model_year,
            v.nickname,
            v.license_plate,
            v.current_mileage
         FROM vehicle_issues AS vi
         INNER JOIN vehicles AS v
            ON v.id = vi.vehicle_id
         WHERE vi.id = $1
           AND vi.user_id = $2
           AND v.user_id = $2`,
        [
            issueId,
            userId
        ]
    );

    const issues = await attachIssueMedia(
        result.rows
    );

    return issues[0] || null;
}

async function getIssues(
    req,
    res,
    next
) {
    try {
        const result = await db.query(
            `SELECT
                vi.id,
                vi.user_id,
                vi.vehicle_id,
                vi.issue_title,
                vi.category,
                vi.description,
                vi.occurs_when,
                vi.severity,
                vi.warning_light,
                vi.can_drive_normally,
                vi.is_worsening,
                vi.risk_level,
                vi.status,
                vi.mechanic_diagnosis,
                vi.resolution_notes,
                vi.service_history_id,
                vi.resolved_at,
                vi.created_at,
                vi.updated_at,
                v.brand,
                v.model,
                v.model_year,
                v.nickname,
                v.license_plate,
                v.current_mileage
             FROM vehicle_issues AS vi
             INNER JOIN vehicles AS v
                ON v.id = vi.vehicle_id
             WHERE vi.user_id = $1
               AND v.user_id = $1
             ORDER BY
                CASE vi.status
                    WHEN 'open' THEN 1
                    WHEN 'diagnosed' THEN 2
                    WHEN 'repaired' THEN 3
                    ELSE 4
                END,
                CASE vi.risk_level
                    WHEN 'red' THEN 1
                    WHEN 'orange' THEN 2
                    WHEN 'green' THEN 3
                    ELSE 4
                END,
                vi.created_at DESC`,
            [req.session.userId]
        );

        res.json({
            success: true,
            issues: await attachIssueMedia(
                result.rows
            )
        });
    } catch (error) {
        next(error);
    }
}

async function getIssueById(
    req,
    res,
    next
) {
    try {
        const issueId =
            parsePositiveInteger(
                req.params.id
            );

        if (issueId === null) {
            return res.status(400).json({
                success: false,
                message: "Invalid issue ID."
            });
        }

        const issue = await findOwnedIssue(
            issueId,
            req.session.userId
        );

        if (!issue) {
            return res.status(404).json({
                success: false,
                message:
                    "Vehicle issue was not found."
            });
        }

        res.json({
            success: true,
            issue
        });
    } catch (error) {
        next(error);
    }
}

async function createIssue(
    req,
    res,
    next
) {
    const savedPhotos = [];

    try {
        const {
            vehicleId,
            issueTitle,
            category,
            description,
            occursWhen,
            severity,
            warningLight,
            canDriveNormally,
            isWorsening
        } = req.body;

        const parsedVehicleId =
            parsePositiveInteger(vehicleId);

        if (parsedVehicleId === null) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select a valid vehicle."
            });
        }

        const normalizedTitle =
            normalizeRequiredText(
                issueTitle
            );

        const normalizedDescription =
            normalizeRequiredText(
                description
            );

        const normalizedOccursWhen =
            normalizeOptionalText(
                occursWhen
            );

        const photoValidation =
            normalizeIssuePhotoPayloads(
                req.body.photos
            );

        if (photoValidation.error) {
            return res.status(400).json({
                success: false,
                message: photoValidation.error
            });
        }

        if (
            !normalizedTitle ||
            normalizedTitle.length > 150
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Issue title is required and must be shorter than 150 characters."
            });
        }

        if (!normalizedDescription) {
            return res.status(400).json({
                success: false,
                message:
                    "Please describe the problem."
            });
        }

        if (
            !allowedCategories.has(
                category
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select a valid issue category."
            });
        }

        if (
            !allowedSeverities.has(
                severity
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select a valid severity."
            });
        }

        const normalizedWarningLight =
            warningLight || "none";

        if (
            !allowedWarningLights.has(
                normalizedWarningLight
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select a valid warning light."
            });
        }

        const parsedCanDriveNormally =
            parseBoolean(
                canDriveNormally,
                true
            );

        const parsedIsWorsening =
            parseBoolean(
                isWorsening,
                false
            );

        const vehicleResult =
            await db.query(
                `SELECT id, vehicle_status
                 FROM vehicles
                 WHERE id = $1
                   AND user_id = $2`,
                [
                    parsedVehicleId,
                    req.session.userId
                ]
            );

        if (
            vehicleResult.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Vehicle was not found."
            });
        }

        if (
            vehicleResult.rows[0]
                .vehicle_status !==
            "active"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Issues can only be reported for active vehicles."
            });
        }

        const duplicateIssueResult =
            await db.query(
                `SELECT id
                 FROM vehicle_issues
                 WHERE user_id = $1
                   AND vehicle_id = $2
                   AND status <> 'repaired'
                   AND category = $3
                   AND LOWER(TRIM(issue_title)) = $4
                   AND created_at >= NOW() - INTERVAL '14 days'
                 LIMIT 1`,
                [
                    req.session.userId,
                    parsedVehicleId,
                    category,
                    normalizeComparableText(
                        normalizedTitle
                    )
                ]
            );

        if (
            duplicateIssueResult.rows
                .length > 0
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "A very similar open issue already exists for this vehicle."
            });
        }

        const riskLevel =
            calculateRiskLevel({
                category,
                severity,

                warningLight:
                    normalizedWarningLight,

                canDriveNormally:
                    parsedCanDriveNormally,

                isWorsening:
                    parsedIsWorsening
            });

        const insertResult =
            await db.query(
                `INSERT INTO vehicle_issues (
                    user_id,
                    vehicle_id,
                    issue_title,
                    category,
                    description,
                    occurs_when,
                    severity,
                    warning_light,
                    can_drive_normally,
                    is_worsening,
                    risk_level
                 )
                 VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9,
                    $10,
                    $11
                 )
                 RETURNING id`,
                [
                    req.session.userId,
                    parsedVehicleId,
                    normalizedTitle,
                    category,
                    normalizedDescription,
                    normalizedOccursWhen,
                    severity,
                    normalizedWarningLight,
                    parsedCanDriveNormally,
                    parsedIsWorsening,
                    riskLevel
                ]
            );

        for (const photo of photoValidation.value) {
            const savedPhoto =
                await saveUploadedDocument(photo);

            savedPhotos.push(savedPhoto);

            await db.query(
                `INSERT INTO vehicle_issue_media (
                    issue_id,
                    stored_file_name,
                    original_file_name,
                    file_mime_type,
                    file_size
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    insertResult.rows[0].id,
                    savedPhoto.storedName,
                    savedPhoto.originalName,
                    savedPhoto.mimeType,
                    savedPhoto.size
                ]
            );
        }

        const issue = await findOwnedIssue(
            insertResult.rows[0].id,
            req.session.userId
        );

        res.status(201).json({
            success: true,

            message:
                "Vehicle issue reported successfully.",

            issue
        });
    } catch (error) {
        for (const savedPhoto of savedPhotos) {
            await removeStoredDocument(
                savedPhoto.storedName
            );
        }
        next(error);
    }
}

async function addDiagnosis(
    req,
    res,
    next
) {
    try {
        const issueId =
            parsePositiveInteger(
                req.params.id
            );

        if (issueId === null) {
            return res.status(400).json({
                success: false,
                message: "Invalid issue ID."
            });
        }

        const mechanicDiagnosis =
            normalizeRequiredText(
                req.body.mechanicDiagnosis
            );

        if (!mechanicDiagnosis) {
            return res.status(400).json({
                success: false,
                message:
                    "Mechanic diagnosis is required."
            });
        }

        const result = await db.query(
            `UPDATE vehicle_issues
             SET
                mechanic_diagnosis = $1,
                status = 'diagnosed',
                updated_at = NOW()
             WHERE id = $2
               AND user_id = $3
               AND status <> 'repaired'
             RETURNING id`,
            [
                mechanicDiagnosis,
                issueId,
                req.session.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Issue was not found or has already been repaired."
            });
        }

        const issue = await findOwnedIssue(
            issueId,
            req.session.userId
        );

        res.json({
            success: true,
            message:
                "Mechanic diagnosis saved successfully.",
            issue
        });
    } catch (error) {
        next(error);
    }
}

async function markIssueRepaired(
    req,
    res,
    next
) {
    const issueId =
        parsePositiveInteger(
            req.params.id
        );

    if (issueId === null) {
        return res.status(400).json({
            success: false,
            message: "Invalid issue ID."
        });
    }

    const {
        completedAt,
        completedAtMileage,
        actualCost,
        serviceProvider,
        resolutionNotes
    } = req.body;

    const normalizedCompletedAt =
        normalizeDate(completedAt);

    if (normalizedCompletedAt === null) {
        return res.status(400).json({
            success: false,
            message:
                "Please enter a valid repair date."
        });
    }

    const today = new Date()
        .toISOString()
        .slice(0, 10);

    if (normalizedCompletedAt > today) {
        return res.status(400).json({
            success: false,
            message:
                "Repair date cannot be in the future."
        });
    }

    const parsedMileage =
        parseMileage(
            completedAtMileage
        );

    if (parsedMileage === null) {
        return res.status(400).json({
            success: false,
            message:
                "Repair mileage must be a non-negative integer."
        });
    }

    const parsedActualCost =
        parseOptionalCost(actualCost);

    if (Number.isNaN(parsedActualCost)) {
        return res.status(400).json({
            success: false,
            message:
                "Actual cost must be zero or greater."
        });
    }

    const normalizedProvider =
        normalizeOptionalText(
            serviceProvider
        );

    const normalizedResolutionNotes =
        normalizeRequiredText(
            resolutionNotes
        );

    if (!normalizedResolutionNotes) {
        return res.status(400).json({
            success: false,
            message:
                "Please describe how the issue was repaired."
        });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const issueResult =
            await client.query(
                `SELECT
                    vi.id,
                    vi.vehicle_id,
                    vi.issue_title,
                    vi.category,
                    vi.status,
                    vi.mechanic_diagnosis,
                    v.brand,
                    v.model,
                    v.nickname,
                    v.current_mileage
                 FROM vehicle_issues AS vi
                 INNER JOIN vehicles AS v
                    ON v.id = vi.vehicle_id
                 WHERE vi.id = $1
                   AND vi.user_id = $2
                   AND v.user_id = $2
                 FOR UPDATE OF vi, v`,
                [
                    issueId,
                    req.session.userId
                ]
            );

        if (
            issueResult.rows.length === 0
        ) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message:
                    "Vehicle issue was not found."
            });
        }

        const issue =
            issueResult.rows[0];

        if (
            issue.status === "repaired"
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    "This issue has already been repaired."
            });
        }

        const duplicateRepairResult =
            await client.query(
                `SELECT id
                 FROM service_history
                 WHERE vehicle_id = $1
                   AND maintenance_plan_id IS NULL
                   AND service_name = $2
                   AND completed_at = $3
                   AND completed_at_mileage = $4
                 LIMIT 1`,
                [
                    issue.vehicle_id,
                    issue.issue_title,
                    normalizedCompletedAt,
                    parsedMileage
                ]
            );

        if (
            duplicateRepairResult.rows
                .length > 0
        ) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message:
                    "A matching repair record already exists for this issue."
            });
        }

        if (
            parsedMileage >
            Number(issue.current_mileage)
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    "Repair mileage cannot exceed the vehicle's current mileage."
            });
        }

        const serviceNotes = [
            issue.mechanic_diagnosis
                ? `Diagnosis: ${issue.mechanic_diagnosis}`
                : null,

            `Repair: ${normalizedResolutionNotes}`
        ]
            .filter(Boolean)
            .join("\n\n");

        const historyResult =
            await client.query(
                `INSERT INTO service_history (
                    vehicle_id,
                    maintenance_plan_id,
                    service_name,
                    completed_at,
                    completed_at_mileage,
                    estimated_cost,
                    actual_cost,
                    service_provider,
                    notes
                 )
                 VALUES (
                    $1,
                    NULL,
                    $2,
                    $3,
                    $4,
                    NULL,
                    $5,
                    $6,
                    $7
                 )
                 RETURNING
                    id,
                    vehicle_id,
                    maintenance_plan_id,
                    service_name,
                    completed_at,
                    completed_at_mileage,
                    estimated_cost,
                    actual_cost,
                    service_provider,
                    notes,
                    created_at`,
                [
                    issue.vehicle_id,
                    issue.issue_title,
                    normalizedCompletedAt,
                    parsedMileage,
                    parsedActualCost,
                    normalizedProvider,
                    serviceNotes
                ]
            );

        const serviceRecord =
            historyResult.rows[0];

        await client.query(
            `UPDATE vehicle_issues
             SET
                resolution_notes = $1,
                service_history_id = $2,
                status = 'repaired',
                resolved_at = NOW(),
                updated_at = NOW()
             WHERE id = $3
               AND user_id = $4`,
            [
                normalizedResolutionNotes,
                serviceRecord.id,
                issueId,
                req.session.userId
            ]
        );

        await client.query("COMMIT");

        const updatedIssue =
            await findOwnedIssue(
                issueId,
                req.session.userId
            );

        res.status(201).json({
            success: true,

            message:
                "Issue repaired and added to service history.",

            issue: updatedIssue,

            serviceRecord: {
                ...serviceRecord,
                brand: issue.brand,
                model: issue.model,
                nickname: issue.nickname,
                category: issue.category
            }
        });
    } catch (error) {
        await client.query("ROLLBACK");
        next(error);
    } finally {
        client.release();
    }
}

async function deleteIssue(
    req,
    res,
    next
) {
    try {
        const issueId =
            parsePositiveInteger(
                req.params.id
            );

        if (issueId === null) {
            return res.status(400).json({
                success: false,
                message: "Invalid issue ID."
            });
        }

        const result = await db.query(
            `DELETE FROM vehicle_issues
             WHERE id = $1
               AND user_id = $2
             RETURNING id`,
            [
                issueId,
                req.session.userId
            ]
        );

        if (
            result.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Vehicle issue was not found."
            });
        }

        res.json({
            success: true,
            message:
                "Vehicle issue deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}

async function downloadIssueMedia(
    req,
    res,
    next
) {
    try {
        const mediaId =
            parsePositiveInteger(
                req.params.mediaId
            );

        if (mediaId === null) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid issue media ID."
            });
        }

        const result = await db.query(
            `SELECT
                media.id,
                media.stored_file_name,
                media.original_file_name,
                media.file_mime_type
             FROM vehicle_issue_media media
             INNER JOIN vehicle_issues issue
                ON issue.id = media.issue_id
             WHERE media.id = $1
               AND issue.user_id = $2`,
            [
                mediaId,
                req.session.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Issue media was not found."
            });
        }

        const media = result.rows[0];

        res.setHeader(
            "Content-Type",
            media.file_mime_type ||
                "application/octet-stream"
        );

        res.sendFile(
            getIssueMediaAbsolutePath(
                media.stored_file_name
            )
        );
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getIssues,
    getIssueById,
    createIssue,
    addDiagnosis,
    markIssueRepaired,
    deleteIssue,
    downloadIssueMedia
};
