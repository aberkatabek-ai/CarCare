const db = require("../config/db");
const {
    isMileageJumpSuspicious
} = require("../utils/suspiciousData");

function parseMileage(value) {
    const mileage = Number(value);

    if (!Number.isInteger(mileage) || mileage < 0) {
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

    if (!Number.isFinite(cost) || cost < 0) {
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

    const date = new Date(`${value}T00:00:00Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        return null;
    }

    return value;
}

async function getServiceHistory(req, res, next) {
    try {
        const requestedVehicleId =
            req.query.vehicleId === undefined
                ? null
                : Number(req.query.vehicleId);

        if (
            requestedVehicleId !== null &&
            !Number.isInteger(requestedVehicleId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID."
            });
        }

        const values = [req.auth.userId];

        let vehicleCondition = "";

        if (requestedVehicleId !== null) {
            values.push(requestedVehicleId);

            vehicleCondition = `
                AND sh.vehicle_id = $2
            `;
        }

        const result = await db.query(
            `SELECT
                sh.id,
                sh.vehicle_id,
                sh.maintenance_plan_id,
                sh.service_name,
                sh.completed_at,
                sh.completed_at_mileage,
                sh.estimated_cost,
                sh.actual_cost,
                sh.service_provider,
                sh.notes,
                sh.created_at,

                v.brand,
                v.model,
                v.nickname,
                v.license_plate,

                mp.category

             FROM service_history sh

             INNER JOIN vehicles v
                 ON v.id = sh.vehicle_id

             LEFT JOIN maintenance_plans mp
                 ON mp.id = sh.maintenance_plan_id

             WHERE v.user_id = $1
             ${vehicleCondition}

             ORDER BY
                 sh.completed_at DESC,
                 sh.created_at DESC`,
            values
        );

        res.json({
            success: true,
            serviceHistory: result.rows
        });
    } catch (error) {
        next(error);
    }
}

async function completeMaintenance(
    req,
    res,
    next
) {
    const planId = Number(req.params.planId);

    if (!Number.isInteger(planId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid maintenance plan ID."
        });
    }

    const {
        completedAt,
        completedAtMileage,
        actualCost,
        serviceProvider,
        notes
    } = req.body;

    const normalizedCompletedAt =
        normalizeDate(completedAt);

    if (normalizedCompletedAt === null) {
        return res.status(400).json({
            success: false,
            message:
                "Please enter a valid completion date."
        });
    }

    const today = new Date()
        .toISOString()
        .slice(0, 10);

    if (normalizedCompletedAt > today) {
        return res.status(400).json({
            success: false,
            message:
                "Completion date cannot be in the future."
        });
    }

    const parsedMileage = parseMileage(
        completedAtMileage
    );

    if (parsedMileage === null) {
        return res.status(400).json({
            success: false,
            message:
                "Completion mileage must be a non-negative integer."
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
        typeof serviceProvider === "string" &&
        serviceProvider.trim()
            ? serviceProvider.trim()
            : null;

    const normalizedNotes =
        typeof notes === "string" &&
        notes.trim()
            ? notes.trim()
            : null;

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const planResult = await client.query(
            `SELECT
                mp.id,
                mp.vehicle_id,
                mp.name,
                mp.category,
                mp.estimated_cost,
                mp.last_service_km,
                mp.last_service_date,

                v.brand,
                v.model,
                v.nickname,
                v.current_mileage

             FROM maintenance_plans mp

             INNER JOIN vehicles v
                 ON v.id = mp.vehicle_id

             WHERE mp.id = $1
               AND v.user_id = $2
               AND v.vehicle_status = 'active'

             FOR UPDATE OF mp, v`,
            [
                planId,
                req.auth.userId
            ]
        );

        if (planResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message:
                    "Maintenance plan was not found."
            });
        }

        const plan = planResult.rows[0];

        if (
            isMileageJumpSuspicious({
                previousMileage:
                    plan.last_service_km ??
                    plan.current_mileage,
                nextMileage:
                    parsedMileage,
                maxJump: 50000
            })
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    "This maintenance completion mileage looks suspicious. Please verify it before saving."
            });
        }

        if (
            parsedMileage >
            Number(plan.current_mileage)
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    "Completion mileage cannot exceed the vehicle's current mileage."
            });
        }

        if (
            plan.last_service_km !== null &&
            parsedMileage <
            Number(plan.last_service_km)
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    "Completion mileage cannot be lower than the previous service mileage."
            });
        }

        if (plan.last_service_date !== null) {
            const previousServiceDate =
                new Date(plan.last_service_date)
                    .toISOString()
                    .slice(0, 10);

            if (
                normalizedCompletedAt <
                previousServiceDate
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Completion date cannot be earlier than the previous service date."
                });
            }
        }

        const historyResult =
            await client.query(
                `SELECT id
                 FROM service_history
                 WHERE vehicle_id = $1
                   AND maintenance_plan_id = $2
                   AND completed_at = $3
                   AND completed_at_mileage = $4
                 LIMIT 1`,
                [
                    plan.vehicle_id,
                    plan.id,
                    normalizedCompletedAt,
                    parsedMileage
                ]
            );

        if (historyResult.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message:
                    "A matching maintenance completion already exists for this plan."
            });
        }

        const insertedHistoryResult =
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
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9
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
                    plan.vehicle_id,
                    plan.id,
                    plan.name,
                    normalizedCompletedAt,
                    parsedMileage,
                    plan.estimated_cost,
                    parsedActualCost,
                    normalizedProvider,
                    normalizedNotes
                ]
            );

        const planUpdateResult =
            await client.query(
                `UPDATE maintenance_plans

                 SET last_service_km = $1,
                     last_service_date = $2,
                     updated_at = NOW()

                 WHERE id = $3

                 RETURNING
                    id,
                    vehicle_id,
                    name,
                    category,
                    interval_km,
                    interval_months,
                    last_service_km,
                    last_service_date,
                    estimated_cost,
                    is_critical,
                    is_active,
                    created_at,
                    updated_at`,
                [
                    parsedMileage,
                    normalizedCompletedAt,
                    plan.id
                ]
            );

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message:
                "Maintenance completed and added to service history.",

            serviceRecord: {
                ...insertedHistoryResult.rows[0],
                brand: plan.brand,
                model: plan.model,
                nickname: plan.nickname,
                category: plan.category
            },

            maintenancePlan:
                planUpdateResult.rows[0]
        });
    } catch (error) {
        await client.query("ROLLBACK");
        next(error);
    } finally {
        client.release();
    }
}

module.exports = {
    getServiceHistory,
    completeMaintenance
};

