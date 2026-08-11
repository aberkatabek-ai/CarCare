const db = require("../config/db");
const {
    normalizeComparableText,
    isMileageJumpSuspicious
} = require("../utils/suspiciousData");
const {
    calculateVehicleCurrentMileage,
    shouldRejectBackdatedMileageEntry
} = require("../utils/mileageState");

const allowedExpenseTypes = new Set([
    "insurance",
    "casco",
    "tax",
    "inspection",
    "emission",
    "parking",
    "toll",
    "wash",
    "accessory",
    "fine",
    "other"
]);

function parseId(value) {
    const id = Number(value);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return null;
    }

    return id;
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

function parsePositiveNumber(value) {
    const number = Number(value);

    if (
        !Number.isFinite(number) ||
        number <= 0
    ) {
        return null;
    }

    return number;
}

function normalizeOptionalText(
    value,
    maximumLength
) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue =
        value.trim();

    if (!normalizedValue) {
        return null;
    }

    if (
        normalizedValue.length >
        maximumLength
    ) {
        return null;
    }

    return normalizedValue;
}

function normalizeRequiredText(
    value,
    maximumLength
) {
    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue =
        value.trim();

    if (
        !normalizedValue ||
        normalizedValue.length >
            maximumLength
    ) {
        return null;
    }

    return normalizedValue;
}

function isValidDate(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {
        return false;
    }

    const date = new Date(
        `${value}T00:00:00.000Z`
    );

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) ===
            value
    );
}

function getToday() {
    return new Date()
        .toISOString()
        .slice(0, 10);
}

function parseBoolean(
    value,
    defaultValue = false
) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    return (
        value === true ||
        value === "true" ||
        value === 1 ||
        value === "1"
    );
}

function validateFuelData(body) {
    const vehicleId = parseId(
        body.vehicleId
    );

    if (vehicleId === null) {
        return {
            error:
                "Please select a valid vehicle."
        };
    }

    const filledAt =
        body.filledAt || getToday();

    if (!isValidDate(filledAt)) {
        return {
            error:
                "Please enter a valid fill-up date."
        };
    }

    if (filledAt > getToday()) {
        return {
            error:
                "Fill-up date cannot be in the future."
        };
    }

    const odometerKm = parseMileage(
        body.odometerKm
    );

    if (odometerKm === null) {
        return {
            error:
                "Odometer must be a non-negative integer."
        };
    }

    const liters = parsePositiveNumber(
        body.liters
    );

    if (liters === null) {
        return {
            error:
                "Litres must be greater than zero."
        };
    }

    const totalCost =
        parsePositiveNumber(
            body.totalCost
        );

    if (totalCost === null) {
        return {
            error:
                "Total cost must be greater than zero."
        };
    }

    const station =
        normalizeOptionalText(
            body.station,
            120
        );

    if (
        body.station &&
        station === null
    ) {
        return {
            error:
                "Station name must be shorter than 120 characters."
        };
    }

    const notes =
        normalizeOptionalText(
            body.notes,
            2000
        );

    if (
        body.notes &&
        notes === null
    ) {
        return {
            error:
                "Notes must be shorter than 2000 characters."
        };
    }

    return {
        value: {
            vehicleId,
            filledAt,
            odometerKm,
            liters,
            totalCost,
            isFullTank:
                parseBoolean(
                    body.isFullTank,
                    true
                ),
            station,
            notes
        }
    };
}

function validateExpenseData(body) {
    const vehicleId = parseId(
        body.vehicleId
    );

    if (vehicleId === null) {
        return {
            error:
                "Please select a valid vehicle."
        };
    }

    const expenseType =
        typeof body.expenseType ===
        "string"
            ? body.expenseType
                .trim()
                .toLowerCase()
            : "";

    if (
        !allowedExpenseTypes.has(
            expenseType
        )
    ) {
        return {
            error:
                "Please select a valid expense type."
        };
    }

    const title =
        normalizeRequiredText(
            body.title,
            120
        );

    if (!title) {
        return {
            error:
                "Expense title is required."
        };
    }

    const amount =
        parsePositiveNumber(
            body.amount
        );

    if (amount === null) {
        return {
            error:
                "Expense amount must be greater than zero."
        };
    }

    const expenseDate =
        body.expenseDate ||
        getToday();

    if (!isValidDate(expenseDate)) {
        return {
            error:
                "Please enter a valid expense date."
        };
    }

    if (expenseDate > getToday()) {
        return {
            error:
                "Expense date cannot be in the future."
        };
    }

    let odometerKm = null;

    if (
        body.odometerKm !== undefined &&
        body.odometerKm !== null &&
        body.odometerKm !== ""
    ) {
        odometerKm =
            parseMileage(
                body.odometerKm
            );

        if (odometerKm === null) {
            return {
                error:
                    "Odometer must be a non-negative integer."
            };
        }
    }

    const provider =
        normalizeOptionalText(
            body.provider,
            120
        );

    if (
        body.provider &&
        provider === null
    ) {
        return {
            error:
                "Provider must be shorter than 120 characters."
        };
    }

    const notes =
        normalizeOptionalText(
            body.notes,
            2000
        );

    if (
        body.notes &&
        notes === null
    ) {
        return {
            error:
                "Notes must be shorter than 2000 characters."
        };
    }

    return {
        value: {
            vehicleId,
            expenseType,
            title,
            amount,
            expenseDate,
            odometerKm,
            provider,
            notes
        }
    };
}

async function findOwnedVehicle(
    client,
    vehicleId,
    userId
) {
    const result =
        await client.query(
            `SELECT
                id,
                current_mileage
             FROM vehicles
             WHERE id = $1
               AND user_id = $2
             FOR UPDATE`,
            [
                vehicleId,
                userId
            ]
        );

    return result.rows[0] || null;
}

async function increaseVehicleMileage(
    client,
    vehicle,
    newMileage
) {
    if (
        newMileage === null ||
        newMileage === undefined
    ) {
        return;
    }

    const currentMileage =
        Number(
            vehicle.current_mileage
        );

    if (newMileage <= currentMileage) {
        return;
    }

    await client.query(
        `UPDATE vehicles
         SET current_mileage = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [
            newMileage,
            vehicle.id
        ]
    );
}

async function ensureMileageBaseline(
    client,
    vehicle
) {
    const currentMileage = Number(
        vehicle.current_mileage
    );

    if (currentMileage <= 0) {
        return;
    }

    const existingHistoryResult =
        await client.query(
            `SELECT id
             FROM mileage_history
             WHERE vehicle_id = $1
             LIMIT 1`,
            [vehicle.id]
        );

    if (existingHistoryResult.rows.length > 0) {
        return;
    }

    await client.query(
        `INSERT INTO mileage_history (
            vehicle_id,
            previous_mileage,
            new_mileage
        )
        VALUES ($1, $2, $3)`,
        [
            vehicle.id,
            currentMileage,
            currentMileage
        ]
    );
}

async function getLatestMileageEventDate(
    client,
    vehicleId
) {
    const result = await client.query(
        `SELECT MAX(event_date)::TEXT AS latest_event_date
         FROM (
            SELECT filled_at AS event_date
            FROM fuel_entries
            WHERE vehicle_id = $1

            UNION ALL

            SELECT expense_date AS event_date
            FROM vehicle_expenses
            WHERE vehicle_id = $1

            UNION ALL

            SELECT completed_at AS event_date
            FROM service_history
            WHERE vehicle_id = $1

         ) AS mileage_events`,
        [vehicleId]
    );

    return (
        result.rows[0]?.latest_event_date ||
        null
    );
}

async function syncVehicleMileageFromRecords(
    client,
    vehicleId,
    userId
) {
    const result = await client.query(
        `SELECT
            COALESCE(
                (
                    SELECT ARRAY_AGG(mh.new_mileage)
                    FROM mileage_history mh
                    WHERE mh.vehicle_id = v.id
                ),
                ARRAY[]::INTEGER[]
            ) AS mileage_history_readings,
            COALESCE(
                (
                    SELECT ARRAY_AGG(f.odometer_km)
                    FROM fuel_entries f
                    WHERE f.vehicle_id = v.id
                ),
                ARRAY[]::INTEGER[]
            ) AS fuel_readings,
            COALESCE(
                (
                    SELECT ARRAY_AGG(e.odometer_km)
                    FROM vehicle_expenses e
                    WHERE e.vehicle_id = v.id
                      AND e.odometer_km IS NOT NULL
                ),
                ARRAY[]::INTEGER[]
            ) AS expense_readings,
            COALESCE(
                (
                    SELECT ARRAY_AGG(sh.completed_at_mileage)
                    FROM service_history sh
                    WHERE sh.vehicle_id = v.id
                ),
                ARRAY[]::INTEGER[]
            ) AS service_readings,
            COALESCE(
                (
                    SELECT ARRAY_AGG(mp.last_service_km)
                    FROM maintenance_plans mp
                    WHERE mp.vehicle_id = v.id
                      AND mp.last_service_km IS NOT NULL
                ),
                ARRAY[]::INTEGER[]
            ) AS maintenance_readings
         FROM vehicles v
         WHERE v.id = $1
           AND v.user_id = $2
         FOR UPDATE`,
        [
            vehicleId,
            userId
        ]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    const nextMileage =
        calculateVehicleCurrentMileage({
            mileageHistoryReadings:
                row.mileage_history_readings,
            fuelReadings: row.fuel_readings,
            expenseReadings: row.expense_readings,
            serviceReadings: row.service_readings,
            maintenanceReadings:
                row.maintenance_readings
        });

    await client.query(
        `UPDATE vehicles
         SET current_mileage = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [
            nextMileage,
            vehicleId
        ]
    );

    return nextMileage;
}

async function getFuelRows(
    userId,
    vehicleId = null
) {
    const result = await db.query(
        `SELECT
            f.id,
            f.vehicle_id,

            TO_CHAR(
                f.filled_at,
                'YYYY-MM-DD'
            ) AS filled_at,

            f.odometer_km,
            f.liters,
            f.total_cost,
            f.is_full_tank,
            f.station,
            f.notes,
            f.created_at,
            f.updated_at,

            v.brand,
            v.model,
            v.nickname,
            v.license_plate

         FROM fuel_entries f

         INNER JOIN vehicles v
            ON v.id = f.vehicle_id

         WHERE v.user_id = $1

           AND (
                $2::BIGINT IS NULL
                OR f.vehicle_id = $2
           )

         ORDER BY
            f.vehicle_id ASC,
            f.odometer_km ASC,
            f.filled_at ASC,
            f.id ASC`,
        [
            userId,
            vehicleId
        ]
    );

    return calculateFuelMetrics(
        result.rows
    );
}

function calculateFuelMetrics(rows) {
    const vehicleStates =
        new Map();

    return rows.map((row) => {
        const vehicleId =
            String(row.vehicle_id);

        if (
            !vehicleStates.has(
                vehicleId
            )
        ) {
            vehicleStates.set(
                vehicleId,
                {
                    previousFullMileage:
                        null,

                    litersSinceFull:
                        0
                }
            );
        }

        const state =
            vehicleStates.get(
                vehicleId
            );

        const liters =
            Number(row.liters);

        const totalCost =
            Number(row.total_cost);

        const odometer =
            Number(row.odometer_km);

        state.litersSinceFull +=
            liters;

        let distanceSinceFull = null;
        let consumption = null;

        if (row.is_full_tank) {
            if (
                state.previousFullMileage !==
                    null &&
                odometer >
                    state.previousFullMileage
            ) {
                distanceSinceFull =
                    odometer -
                    state.previousFullMileage;

                consumption =
                    (
                        state.litersSinceFull /
                        distanceSinceFull
                    ) * 100;
            }

            state.previousFullMileage =
                odometer;

            state.litersSinceFull = 0;
        }

        return {
            ...row,

            liters,

            total_cost: totalCost,

            price_per_liter:
                Number(
                    (
                        totalCost /
                        liters
                    ).toFixed(2)
                ),

            distance_since_full_tank:
                distanceSinceFull,

            consumption_l_per_100km:
                consumption === null
                    ? null
                    : Number(
                        consumption.toFixed(
                            2
                        )
                    )
        };
    });
}

async function getFuelEntries(
    req,
    res,
    next
) {
    try {
        let vehicleId = null;

        if (
            req.query.vehicleId !==
            undefined
        ) {
            vehicleId = parseId(
                req.query.vehicleId
            );

            if (vehicleId === null) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Invalid vehicle ID."
                    });
            }
        }

        const fuelEntries =
            await getFuelRows(
                req.session.userId,
                vehicleId
            );

        fuelEntries.sort(
            (
                firstEntry,
                secondEntry
            ) =>
                new Date(
                    secondEntry.filled_at
                ).getTime() -
                new Date(
                    firstEntry.filled_at
                ).getTime() ||
                secondEntry.id -
                    firstEntry.id
        );

        res.json({
            success: true,
            fuelEntries
        });
    } catch (error) {
        next(error);
    }
}

async function createFuelEntry(
    req,
    res,
    next
) {
    const validation =
        validateFuelData(
            req.body
        );

    if (validation.error) {
        return res
            .status(400)
            .json({
                success: false,

                message:
                    validation.error
            });
    }

    const fuelData =
        validation.value;

    const client =
        await db.connect();

    let transactionActive =
        false;

    try {
        await client.query("BEGIN");

        transactionActive = true;

        const vehicle =
            await findOwnedVehicle(
                client,
                fuelData.vehicleId,
                req.session.userId
            );

        if (!vehicle) {
            await client.query(
                "ROLLBACK"
            );

            transactionActive =
                false;

            return res
                .status(404)
                .json({
                    success: false,

                    message:
                        "Vehicle was not found."
                });
        }

        await ensureMileageBaseline(
            client,
            vehicle
        );

        const latestMileageEventDate =
            await getLatestMileageEventDate(
                client,
                fuelData.vehicleId
            );

        if (
            isMileageJumpSuspicious({
                previousMileage:
                    vehicle.current_mileage,
                nextMileage:
                    fuelData.odometerKm
            })
        ) {
            await client.query(
                "ROLLBACK"
            );

            transactionActive =
                false;

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "This fuel entry increases mileage too sharply. Please verify the odometer value."
                });
        }

        if (
            shouldRejectBackdatedMileageEntry({
                entryDate: fuelData.filledAt,
                latestEventDate:
                    latestMileageEventDate,
                currentMileage:
                    vehicle.current_mileage,
                nextMileage:
                    fuelData.odometerKm
            })
        ) {
            await client.query(
                "ROLLBACK"
            );

            transactionActive =
                false;

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Backdated fuel entries cannot exceed the vehicle's current mileage."
                });
        }

        const latestFuelResult =
            await client.query(
                `SELECT
                    odometer_km,

                    TO_CHAR(
                        filled_at,
                        'YYYY-MM-DD'
                    ) AS filled_at

                 FROM fuel_entries

                 WHERE vehicle_id = $1

                 ORDER BY
                    filled_at DESC,
                    id DESC

                 LIMIT 1`,
                [
                    fuelData.vehicleId
                ]
            );

        const duplicateFuelResult =
            await client.query(
                `SELECT id
                 FROM fuel_entries
                 WHERE vehicle_id = $1
                   AND filled_at = $2
                   AND odometer_km = $3
                   AND liters = $4
                   AND total_cost = $5
                 LIMIT 1`,
                [
                    fuelData.vehicleId,
                    fuelData.filledAt,
                    fuelData.odometerKm,
                    fuelData.liters,
                    fuelData.totalCost
                ]
            );

        if (
            duplicateFuelResult.rows
                .length > 0
        ) {
            await client.query(
                "ROLLBACK"
            );

            transactionActive =
                false;

            return res
                .status(409)
                .json({
                    success: false,
                    message:
                        "A matching fuel entry already exists for this vehicle."
                });
        }

        if (
            latestFuelResult.rows
                .length > 0
        ) {
            const latestEntry =
                latestFuelResult.rows[0];

            if (
                fuelData.filledAt >=
                    latestEntry.filled_at &&
                fuelData.odometerKm <
                    Number(
                        latestEntry
                            .odometer_km
                    )
            ) {
                await client.query(
                    "ROLLBACK"
                );

                transactionActive =
                    false;

                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            `Odometer cannot be lower than the latest fuel entry (${latestEntry.odometer_km} km).`
                    });
            }
        }

        await increaseVehicleMileage(
            client,
            vehicle,
            fuelData.odometerKm
        );

        const insertResult =
            await client.query(
                `INSERT INTO fuel_entries (
                    vehicle_id,
                    filled_at,
                    odometer_km,
                    liters,
                    total_cost,
                    is_full_tank,
                    station,
                    notes
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8
                )
                RETURNING id`,
                [
                    fuelData.vehicleId,
                    fuelData.filledAt,
                    fuelData.odometerKm,
                    fuelData.liters,
                    fuelData.totalCost,
                    fuelData.isFullTank,
                    fuelData.station,
                    fuelData.notes
                ]
            );

        await client.query("COMMIT");

        transactionActive = false;

        const fuelEntries =
            await getFuelRows(
                req.session.userId,
                fuelData.vehicleId
            );

        const createdEntry =
            fuelEntries.find(
                (entry) =>
                    entry.id ===
                    insertResult.rows[0].id
            );

        res.status(201).json({
            success: true,

            message:
                "Fuel entry added successfully.",

            fuelEntry:
                createdEntry
        });
    } catch (error) {
        if (transactionActive) {
            await client.query(
                "ROLLBACK"
            );
        }

        next(error);
    } finally {
        client.release();
    }
}

async function deleteFuelEntry(
    req,
    res,
    next
) {
    try {
        const fuelEntryId = parseId(
            req.params.id
        );

        if (fuelEntryId === null) {
            return res
                .status(400)
                .json({
                    success: false,

                    message:
                        "Invalid fuel entry ID."
                });
        }

        const result = await db.query(
            `SELECT
                f.id,
                f.vehicle_id
             FROM fuel_entries f
             INNER JOIN vehicles v
                ON v.id = f.vehicle_id
             WHERE f.id = $1
               AND v.user_id = $2`,
            [
                fuelEntryId,
                req.session.userId
            ]
        );

        if (
            result.rows.length === 0
        ) {
            return res
                .status(404)
                .json({
                    success: false,

                    message:
                        "Fuel entry was not found."
                });
        }

        const client = await db.connect();

        try {
            await client.query("BEGIN");

            await client.query(
                `DELETE FROM fuel_entries
                 WHERE id = $1`,
                [fuelEntryId]
            );

            await syncVehicleMileageFromRecords(
                client,
                result.rows[0].vehicle_id,
                req.session.userId
            );

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }

        res.json({
            success: true,

            message:
                "Fuel entry deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}

async function getExpenses(
    req,
    res,
    next
) {
    try {
        let vehicleId = null;

        if (
            req.query.vehicleId !==
            undefined
        ) {
            vehicleId = parseId(
                req.query.vehicleId
            );

            if (vehicleId === null) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Invalid vehicle ID."
                    });
            }
        }

        const result = await db.query(
            `SELECT
                e.id,
                e.vehicle_id,
                e.expense_type,
                e.title,
                e.amount,

                TO_CHAR(
                    e.expense_date,
                    'YYYY-MM-DD'
                ) AS expense_date,

                e.odometer_km,
                e.provider,
                e.notes,
                e.created_at,
                e.updated_at,

                v.brand,
                v.model,
                v.nickname,
                v.license_plate

             FROM vehicle_expenses e

             INNER JOIN vehicles v
                ON v.id = e.vehicle_id

             WHERE v.user_id = $1

               AND (
                    $2::BIGINT IS NULL
                    OR e.vehicle_id = $2
               )

             ORDER BY
                e.expense_date DESC,
                e.id DESC`,
            [
                req.session.userId,
                vehicleId
            ]
        );

        res.json({
            success: true,

            expenses:
                result.rows.map(
                    (expense) => ({
                        ...expense,

                        amount:
                            Number(
                                expense.amount
                            )
                    })
                )
        });
    } catch (error) {
        next(error);
    }
}

async function createExpense(
    req,
    res,
    next
) {
    const validation =
        validateExpenseData(
            req.body
        );

    if (validation.error) {
        return res
            .status(400)
            .json({
                success: false,

                message:
                    validation.error
            });
    }

    const expenseData =
        validation.value;

    const client =
        await db.connect();

    let transactionActive =
        false;

    try {
        await client.query("BEGIN");

        transactionActive = true;

        const vehicle =
            await findOwnedVehicle(
                client,
                expenseData.vehicleId,
                req.session.userId
            );

        if (!vehicle) {
            await client.query(
                "ROLLBACK"
            );

            transactionActive =
                false;

            return res
                .status(404)
                .json({
                    success: false,

                    message:
                        "Vehicle was not found."
                });
        }

        await ensureMileageBaseline(
            client,
            vehicle
        );

        const latestMileageEventDate =
            await getLatestMileageEventDate(
                client,
                expenseData.vehicleId
            );

        if (
            expenseData.odometerKm !== null &&
            isMileageJumpSuspicious({
                previousMileage:
                    vehicle.current_mileage,
                nextMileage:
                    expenseData.odometerKm
            })
        ) {
            await client.query(
                "ROLLBACK"
            );

            transactionActive =
                false;

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "This expense record increases mileage too sharply. Please verify the odometer value."
                });
        }

        if (
            expenseData.odometerKm !== null &&
            shouldRejectBackdatedMileageEntry({
                entryDate:
                    expenseData.expenseDate,
                latestEventDate:
                    latestMileageEventDate,
                currentMileage:
                    vehicle.current_mileage,
                nextMileage:
                    expenseData.odometerKm
            })
        ) {
            await client.query(
                "ROLLBACK"
            );

            transactionActive =
                false;

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Backdated expense entries cannot exceed the vehicle's current mileage."
                });
        }

        const duplicateExpenseResult =
            await client.query(
                `SELECT id
                 FROM vehicle_expenses
                 WHERE vehicle_id = $1
                   AND expense_date = $2
                   AND amount = $3
                   AND LOWER(TRIM(title)) = $4
                 LIMIT 1`,
                [
                    expenseData.vehicleId,
                    expenseData.expenseDate,
                    expenseData.amount,
                    normalizeComparableText(
                        expenseData.title
                    )
                ]
            );

        if (
            duplicateExpenseResult.rows
                .length > 0
        ) {
            await client.query(
                "ROLLBACK"
            );

            transactionActive =
                false;

            return res
                .status(409)
                .json({
                    success: false,
                    message:
                        "A matching expense already exists for this vehicle and date."
                });
        }

        await increaseVehicleMileage(
            client,
            vehicle,
            expenseData.odometerKm
        );

        const result =
            await client.query(
                `INSERT INTO vehicle_expenses (
                    vehicle_id,
                    expense_type,
                    title,
                    amount,
                    expense_date,
                    odometer_km,
                    provider,
                    notes
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8
                )
                RETURNING id`,
                [
                    expenseData.vehicleId,
                    expenseData.expenseType,
                    expenseData.title,
                    expenseData.amount,
                    expenseData.expenseDate,
                    expenseData.odometerKm,
                    expenseData.provider,
                    expenseData.notes
                ]
            );

        await client.query("COMMIT");

        transactionActive = false;

        const createdExpense =
            await db.query(
                `SELECT
                    e.id,
                    e.vehicle_id,
                    e.expense_type,
                    e.title,
                    e.amount,

                    TO_CHAR(
                        e.expense_date,
                        'YYYY-MM-DD'
                    ) AS expense_date,

                    e.odometer_km,
                    e.provider,
                    e.notes,
                    e.created_at,
                    e.updated_at,

                    v.brand,
                    v.model,
                    v.nickname,
                    v.license_plate

                 FROM vehicle_expenses e

                 INNER JOIN vehicles v
                    ON v.id =
                        e.vehicle_id

                 WHERE e.id = $1
                   AND v.user_id = $2`,
                [
                    result.rows[0].id,
                    req.session.userId
                ]
            );

        res.status(201).json({
            success: true,

            message:
                "Expense added successfully.",

            expense: {
                ...createdExpense.rows[0],

                amount:
                    Number(
                        createdExpense
                            .rows[0]
                            .amount
                    )
            }
        });
    } catch (error) {
        if (transactionActive) {
            await client.query(
                "ROLLBACK"
            );
        }

        next(error);
    } finally {
        client.release();
    }
}

async function deleteExpense(
    req,
    res,
    next
) {
    try {
        const expenseId = parseId(
            req.params.id
        );

        if (expenseId === null) {
            return res
                .status(400)
                .json({
                    success: false,

                    message:
                        "Invalid expense ID."
                });
        }

        const result = await db.query(
            `SELECT
                e.id,
                e.vehicle_id
             FROM vehicle_expenses e
             INNER JOIN vehicles v
                ON v.id = e.vehicle_id
             WHERE e.id = $1
               AND v.user_id = $2`,
            [
                expenseId,
                req.session.userId
            ]
        );

        if (
            result.rows.length === 0
        ) {
            return res
                .status(404)
                .json({
                    success: false,

                    message:
                        "Expense was not found."
                });
        }

        const client = await db.connect();

        try {
            await client.query("BEGIN");

            await client.query(
                `DELETE FROM vehicle_expenses
                 WHERE id = $1`,
                [expenseId]
            );

            await syncVehicleMileageFromRecords(
                client,
                result.rows[0].vehicle_id,
                req.session.userId
            );

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }

        res.json({
            success: true,

            message:
                "Expense deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}

async function getCostSummary(
    req,
    res,
    next
) {
    try {
        const [
            fuelResult,
            expenseResult,
            serviceResult
        ] = await Promise.all([
            db.query(
                `SELECT
                    COALESCE(
                        SUM(f.total_cost),
                        0
                    ) AS total_fuel_cost,

                    COALESCE(
                        SUM(f.liters),
                        0
                    ) AS total_liters,

                    COUNT(f.id) AS fill_up_count

                 FROM fuel_entries f

                 INNER JOIN vehicles v
                    ON v.id = f.vehicle_id

                 WHERE v.user_id = $1`,
                [
                    req.session.userId
                ]
            ),

            db.query(
                `SELECT
                    COALESCE(
                        SUM(e.amount),
                        0
                    ) AS total_expense_cost,

                    COUNT(e.id) AS expense_count

                 FROM vehicle_expenses e

                 INNER JOIN vehicles v
                    ON v.id = e.vehicle_id

                 WHERE v.user_id = $1`,
                [
                    req.session.userId
                ]
            ),

            db.query(
                `SELECT
                    COALESCE(
                        SUM(
                            sh.actual_cost
                        ),
                        0
                    ) AS total_service_cost,

                    COUNT(sh.id)
                        AS service_count

                 FROM service_history sh

                 INNER JOIN vehicles v
                    ON v.id = sh.vehicle_id

                 WHERE v.user_id = $1`,
                [
                    req.session.userId
                ]
            )
        ]);

        const fuelSummary =
            fuelResult.rows[0];

        const expenseSummary =
            expenseResult.rows[0];

        const serviceSummary =
            serviceResult.rows[0];

        const totalFuelCost =
            Number(
                fuelSummary
                    .total_fuel_cost
            );

        const totalExpenseCost =
            Number(
                expenseSummary
                    .total_expense_cost
            );

        const totalServiceCost =
            Number(
                serviceSummary
                    .total_service_cost
            );

        res.json({
            success: true,

            summary: {
                totalFuelCost,

                totalExpenseCost,

                totalServiceCost,

                totalOwnershipCost:
                    totalFuelCost +
                    totalExpenseCost +
                    totalServiceCost,

                totalLiters:
                    Number(
                        fuelSummary
                            .total_liters
                    ),

                fillUpCount:
                    Number(
                        fuelSummary
                            .fill_up_count
                    ),

                expenseCount:
                    Number(
                        expenseSummary
                            .expense_count
                    ),

                serviceCount:
                    Number(
                        serviceSummary
                            .service_count
                    )
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getFuelEntries,
    createFuelEntry,
    deleteFuelEntry,
    getExpenses,
    createExpense,
    deleteExpense,
    getCostSummary
};
