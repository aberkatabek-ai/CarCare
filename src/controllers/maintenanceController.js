const db = require("../config/db");
const {
    normalizeIsoDate
} = require("../utils/dateValidation");

function parseOptionalInteger(value, minimum) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    if (!Number.isInteger(number) || number < minimum) {
        return Number.NaN;
    }

    return number;
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
    return normalizeIsoDate(value);
}

function calculatePlanStatus(plan) {
    const currentMileage = Number(plan.current_mileage);

    const intervalKm =
        plan.interval_km === null
            ? null
            : Number(plan.interval_km);

    const lastServiceKm =
        plan.last_service_km === null
            ? null
            : Number(plan.last_service_km);

    let nextDueMileage = null;
    let nextDueDate = null;

    if (intervalKm !== null && lastServiceKm !== null) {
        nextDueMileage = lastServiceKm + intervalKm;
    }

    if (
        plan.interval_months !== null &&
        plan.last_service_date
    ) {
        const lastServiceDate = new Date(
            plan.last_service_date
        );

        const calculatedDate = new Date(lastServiceDate);

        calculatedDate.setUTCMonth(
            calculatedDate.getUTCMonth() +
            Number(plan.interval_months)
        );

        nextDueDate = calculatedDate
            .toISOString()
            .slice(0, 10);
    }

    let status = "not_scheduled";

    const todayText = new Date()
        .toISOString()
        .slice(0, 10);

    const overdueByMileage =
        nextDueMileage !== null &&
        currentMileage >= nextDueMileage;

    const overdueByDate =
        nextDueDate !== null &&
        todayText >= nextDueDate;

    const dueSoonByMileage =
        nextDueMileage !== null &&
        currentMileage >= nextDueMileage - 1000;

    let dueSoonByDate = false;

    if (nextDueDate !== null) {
        const today = new Date(`${todayText}T00:00:00Z`);
        const dueDate = new Date(
            `${nextDueDate}T00:00:00Z`
        );

        const millisecondsPerDay =
            24 * 60 * 60 * 1000;

        const remainingDays = Math.ceil(
            (dueDate - today) / millisecondsPerDay
        );

        dueSoonByDate =
            remainingDays >= 0 &&
            remainingDays <= 30;
    }

    if (overdueByMileage || overdueByDate) {
        status = "overdue";
    } else if (dueSoonByMileage || dueSoonByDate) {
        status = "due_soon";
    } else if (
        nextDueMileage !== null ||
        nextDueDate !== null
    ) {
        status = "ok";
    }

    return {
        ...plan,
        next_due_mileage: nextDueMileage,
        next_due_date: nextDueDate,
        status
    };
}

async function getMaintenancePlans(req, res, next) {
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
                AND mp.vehicle_id = $2
            `;
        }

        const result = await db.query(
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
                mp.is_active,
                mp.created_at,
                mp.updated_at,

                v.brand,
                v.model,
                v.nickname,
                v.current_mileage

             FROM maintenance_plans mp

             INNER JOIN vehicles v
                 ON v.id = mp.vehicle_id

             WHERE v.user_id = $1
               AND v.vehicle_status = 'active'
             ${vehicleCondition}

             ORDER BY
                 mp.is_critical DESC,
                 mp.created_at DESC`,
            values
        );

        const plans = result.rows.map(
            calculatePlanStatus
        );

        res.json({
            success: true,
            maintenancePlans: plans
        });
    } catch (error) {
        next(error);
    }
}

async function createMaintenancePlan(req, res, next) {
    try {
        const {
            vehicleId,
            name,
            category,
            intervalKm,
            intervalMonths,
            lastServiceKm,
            lastServiceDate,
            estimatedCost,
            isCritical
        } = req.body;

        const parsedVehicleId = Number(vehicleId);

        if (!Number.isInteger(parsedVehicleId)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid vehicle."
            });
        }

        const normalizedName =
            typeof name === "string"
                ? name.trim()
                : "";

        const normalizedCategory =
            typeof category === "string"
                ? category.trim()
                : "";

        if (!normalizedName || !normalizedCategory) {
            return res.status(400).json({
                success: false,
                message:
                    "Maintenance name and category are required."
            });
        }

        const parsedIntervalKm =
            parseOptionalInteger(intervalKm, 1);

        const parsedIntervalMonths =
            parseOptionalInteger(intervalMonths, 1);

        if (
            Number.isNaN(parsedIntervalKm) ||
            Number.isNaN(parsedIntervalMonths)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Maintenance intervals must be positive integers."
            });
        }

        if (
            parsedIntervalKm === null &&
            parsedIntervalMonths === null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Enter a mileage interval, a month interval, or both."
            });
        }

        const parsedLastServiceKm =
            parseOptionalInteger(lastServiceKm, 0);

        if (Number.isNaN(parsedLastServiceKm)) {
            return res.status(400).json({
                success: false,
                message:
                    "Last service mileage must be zero or greater."
            });
        }

        const parsedEstimatedCost =
            parseOptionalCost(estimatedCost);

        if (Number.isNaN(parsedEstimatedCost)) {
            return res.status(400).json({
                success: false,
                message:
                    "Estimated cost must be zero or greater."
            });
        }

        const normalizedLastServiceDate =
            lastServiceDate
                ? normalizeDate(lastServiceDate)
                : null;

        if (
            lastServiceDate &&
            normalizedLastServiceDate === null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid last service date."
            });
        }

        const today = new Date()
            .toISOString()
            .slice(0, 10);

        if (
            normalizedLastServiceDate !== null &&
            normalizedLastServiceDate > today
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Last service date cannot be in the future."
            });
        }

        const vehicleResult = await db.query(
            `SELECT
                id,
                brand,
                model,
                nickname,
                vehicle_status,
                current_mileage
             FROM vehicles
             WHERE id = $1
               AND user_id = $2`,
            [
                parsedVehicleId,
                req.auth.userId
            ]
        );

        if (vehicleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vehicle was not found."
            });
        }

        const vehicle = vehicleResult.rows[0];

        if (vehicle.vehicle_status !== "active") {
            return res.status(400).json({
                success: false,
                message:
                    "Maintenance plans can only be added to active vehicles."
            });
        }

        if (
            parsedLastServiceKm !== null &&
            parsedLastServiceKm >
                Number(vehicle.current_mileage)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Last service mileage cannot exceed current mileage."
            });
        }

        const result = await db.query(
            `INSERT INTO maintenance_plans (
                vehicle_id,
                name,
                category,
                interval_km,
                interval_months,
                last_service_km,
                last_service_date,
                estimated_cost,
                is_critical
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9
            )
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
                parsedVehicleId,
                normalizedName,
                normalizedCategory,
                parsedIntervalKm,
                parsedIntervalMonths,
                parsedLastServiceKm,
                normalizedLastServiceDate,
                parsedEstimatedCost,
                isCritical === true
            ]
        );

        const plan = calculatePlanStatus({
            ...result.rows[0],
            brand: vehicle.brand,
            model: vehicle.model,
            nickname: vehicle.nickname,
            current_mileage: vehicle.current_mileage
        });

        res.status(201).json({
            success: true,
            message:
                "Maintenance plan created successfully.",
            maintenancePlan: plan
        });
    } catch (error) {
        next(error);
    }
}

async function deleteMaintenancePlan(req, res, next) {
    try {
        const planId = Number(req.params.id);

        if (!Number.isInteger(planId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid maintenance plan ID."
            });
        }

        const result = await db.query(
            `DELETE FROM maintenance_plans mp
             USING vehicles v

             WHERE mp.id = $1
               AND mp.vehicle_id = v.id
               AND v.user_id = $2

             RETURNING mp.id`,
            [
                planId,
                req.auth.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Maintenance plan was not found."
            });
        }

        res.json({
            success: true,
            message:
                "Maintenance plan deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMaintenancePlans,
    createMaintenancePlan,
    deleteMaintenancePlan
};

