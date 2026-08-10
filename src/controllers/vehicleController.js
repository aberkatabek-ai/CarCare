const db = require("../config/db");
const {
    normalizeLicensePlate
} = require("../utils/vehicleOwnership");
const {
    normalizeOptionalFilePayload,
    saveUploadedDocument,
    removeStoredDocument,
    resolveStoredDocumentAbsolutePath
} = require("../utils/documentUpload");
const {
    recognizeDocumentText
} = require("../utils/ocr");
const {
    evaluateOwnershipVerification
} = require("../utils/ownershipVerification");

const ACTIVE_VEHICLE_STATUS = "active";
const SOLD_VEHICLE_STATUS = "sold";

const OWNERSHIP_NOT_STARTED = "not_started";
const OWNERSHIP_UNVERIFIED = "unverified";
const OWNERSHIP_VERIFIED = "verified";
const OWNERSHIP_FAILED = "failed";

function parseVehicleId(value) {
    const vehicleId = Number(value);

    if (
        !Number.isInteger(vehicleId) ||
        vehicleId <= 0
    ) {
        return null;
    }

    return vehicleId;
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

function parseModelYear(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const modelYear = Number(value);

    if (
        !Number.isInteger(modelYear) ||
        modelYear < 1886 ||
        modelYear > 2100
    ) {
        return null;
    }

    return modelYear;
}

function getOwnershipStatusForPlate(plateKey) {
    return plateKey
        ? OWNERSHIP_UNVERIFIED
        : OWNERSHIP_NOT_STARTED;
}

function buildVerifiedPlateConflictResponse(res) {
    return res.status(409).json({
        success: false,
        message:
            "This license plate is already verified by another active vehicle."
    });
}

function getDocumentAbsolutePath(storedFileName) {
    return resolveStoredDocumentAbsolutePath(
        storedFileName
    );
}

function mapVehicleRow(vehicle) {
    return {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        model_year: vehicle.model_year,
        nickname: vehicle.nickname,
        license_plate: vehicle.license_plate,
        vehicle_status: vehicle.vehicle_status,
        ownership_status: vehicle.ownership_status,
        ownership_verified_at:
            vehicle.ownership_verified_at,
        ownership_verification_score:
            vehicle.ownership_verification_score,
        ownership_document_id:
            vehicle.ownership_document_id,
        ownership_failure_reason:
            vehicle.ownership_failure_reason,
        ownership_original_file_name:
            vehicle.ownership_original_file_name,
        ownership_file_mime_type:
            vehicle.ownership_file_mime_type,
        sold_at: vehicle.sold_at,
        current_mileage: vehicle.current_mileage,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at
    };
}

async function getVehicles(req, res, next) {
    try {
        const result = await db.query(
            `SELECT
                id,
                brand,
                model,
                model_year,
                nickname,
                license_plate,
                vehicle_status,
                ownership_status,
                ownership_verified_at,
                ownership_verification_score,
                sold_at,
                current_mileage,
                created_at,
                updated_at
             FROM vehicles
             WHERE user_id = $1
               AND vehicle_status = $2
             ORDER BY created_at DESC`,
            [
                req.session.userId,
                ACTIVE_VEHICLE_STATUS
            ]
        );

        res.json({
            success: true,
            vehicles: result.rows
        });
    } catch (error) {
        next(error);
    }
}

async function getVehicleArchive(
    req,
    res,
    next
) {
    try {
        const result = await db.query(
            `SELECT
                id,
                brand,
                model,
                model_year,
                nickname,
                license_plate,
                vehicle_status,
                ownership_status,
                ownership_verified_at,
                ownership_verification_score,
                sold_at,
                current_mileage,
                created_at,
                updated_at
             FROM vehicles
             WHERE user_id = $1
               AND vehicle_status = $2
             ORDER BY sold_at DESC NULLS LAST,
                      updated_at DESC`,
            [
                req.session.userId,
                SOLD_VEHICLE_STATUS
            ]
        );

        res.json({
            success: true,
            vehicles: result.rows
        });
    } catch (error) {
        next(error);
    }
}

async function getVehicleById(req, res, next) {
    try {
        const vehicleId = parseVehicleId(
            req.params.id
        );

        if (vehicleId === null) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID."
            });
        }

        const result = await db.query(
            `SELECT
                id,
                brand,
                model,
                model_year,
                nickname,
                license_plate,
                vehicle_status,
                ownership_status,
                ownership_verified_at,
                ownership_verification_score,
                ownership_document_id,
                ownership_failure_reason,
                ownership_stored_file_name,
                ownership_original_file_name,
                ownership_file_mime_type,
                sold_at,
                current_mileage,
                created_at,
                updated_at
             FROM vehicles
             WHERE id = $1
               AND user_id = $2`,
            [
                vehicleId,
                req.session.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vehicle was not found."
            });
        }

        res.json({
            success: true,
            vehicle: mapVehicleRow(
                result.rows[0]
            )
        });
    } catch (error) {
        next(error);
    }
}

async function exportBuyerHandoffPackage(
    req,
    res,
    next
) {
    try {
        const vehicleId = parseVehicleId(
            req.params.id
        );

        if (vehicleId === null) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID."
            });
        }

        const vehicleResult = await db.query(
            `SELECT
                id,
                brand,
                model,
                model_year,
                nickname,
                license_plate,
                vehicle_status,
                ownership_status,
                ownership_verified_at,
                ownership_verification_score,
                ownership_failure_reason,
                sold_at,
                current_mileage,
                created_at,
                updated_at
             FROM vehicles
             WHERE id = $1
               AND user_id = $2`,
            [
                vehicleId,
                req.session.userId
            ]
        );

        if (vehicleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vehicle was not found."
            });
        }

        const [
            mileageResult,
            serviceResult,
            documentResult,
            issueResult,
            fuelResult,
            expenseResult
        ] = await Promise.all([
            db.query(
                `SELECT
                    previous_mileage,
                    new_mileage,
                    COALESCE(
                        to_jsonb(mh)->>'recorded_at',
                        to_jsonb(mh)->>'created_at'
                    ) AS recorded_at
                 FROM mileage_history mh
                 WHERE vehicle_id = $1
                 ORDER BY mh.id DESC`,
                [vehicleId]
            ),
            db.query(
                `SELECT
                    service_name,
                    completed_at,
                    completed_at_mileage,
                    actual_cost,
                    service_provider,
                    notes
                 FROM service_history
                 WHERE vehicle_id = $1
                 ORDER BY completed_at DESC, id DESC`,
                [vehicleId]
            ),
            db.query(
                `SELECT
                    document_type,
                    title,
                    provider,
                    expiry_date,
                    reminder_days,
                    notes
                 FROM vehicle_documents
                 WHERE vehicle_id = $1
                 ORDER BY expiry_date ASC, id DESC`,
                [vehicleId]
            ),
            db.query(
                `SELECT
                    issue_title,
                    category,
                    status,
                    risk_level,
                    description,
                    created_at,
                    resolved_at,
                    resolution_notes
                 FROM vehicle_issues
                 WHERE vehicle_id = $1
                 ORDER BY created_at DESC`,
                [vehicleId]
            ),
            db.query(
                `SELECT
                    filled_at,
                    odometer_km,
                    liters,
                    total_cost,
                    station,
                    notes
                 FROM fuel_entries
                 WHERE vehicle_id = $1
                 ORDER BY filled_at DESC, id DESC`,
                [vehicleId]
            ),
            db.query(
                `SELECT
                    expense_type,
                    title,
                    amount,
                    expense_date,
                    odometer_km,
                    provider,
                    notes
                 FROM vehicle_expenses
                 WHERE vehicle_id = $1
                 ORDER BY expense_date DESC, id DESC`,
                [vehicleId]
            )
        ]);

        res.json({
            success: true,
            package: {
                exported_at: new Date().toISOString(),
                vehicle: mapVehicleRow(
                    vehicleResult.rows[0]
                ),
                mileage_history:
                    mileageResult.rows,
                service_history:
                    serviceResult.rows,
                documents:
                    documentResult.rows,
                issues: issueResult.rows,
                fuel_history:
                    fuelResult.rows,
                expenses:
                    expenseResult.rows
            }
        });
    } catch (error) {
        next(error);
    }
}

async function getMileageHistory(
    req,
    res,
    next
) {
    try {
        const vehicleId = parseVehicleId(
            req.params.id
        );

        if (vehicleId === null) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID."
            });
        }

        const vehicleResult = await db.query(
            `SELECT id
             FROM vehicles
             WHERE id = $1
               AND user_id = $2`,
            [
                vehicleId,
                req.session.userId
            ]
        );

        if (vehicleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vehicle was not found."
            });
        }

        const historyResult = await db.query(
            `SELECT
                mh.id,
                mh.vehicle_id,
                mh.previous_mileage,
                mh.new_mileage,
                COALESCE(
                    to_jsonb(mh)->>'recorded_at',
                    to_jsonb(mh)->>'created_at'
                ) AS recorded_at
             FROM mileage_history AS mh
             INNER JOIN vehicles AS v
                ON v.id = mh.vehicle_id
             WHERE mh.vehicle_id = $1
               AND v.user_id = $2
             ORDER BY mh.id DESC`,
            [
                vehicleId,
                req.session.userId
            ]
        );

        res.json({
            success: true,
            mileageHistory:
                historyResult.rows
        });
    } catch (error) {
        next(error);
    }
}

async function createVehicle(req, res, next) {
    try {
        const {
            brand,
            model,
            modelYear,
            nickname,
            licensePlate,
            currentMileage
        } = req.body;

        const normalizedBrand =
            typeof brand === "string"
                ? brand.trim()
                : "";

        const normalizedModel =
            typeof model === "string"
                ? model.trim()
                : "";

        if (
            !normalizedBrand ||
            !normalizedModel
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Brand and model are required."
            });
        }

        const mileage = parseMileage(
            currentMileage
        );

        if (mileage === null) {
            return res.status(400).json({
                success: false,
                message:
                    "Mileage must be a non-negative integer."
            });
        }

        const parsedYear =
            parseModelYear(modelYear);

        if (
            modelYear !== undefined &&
            modelYear !== null &&
            modelYear !== "" &&
            parsedYear === null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid model year."
            });
        }

        const normalizedNickname =
            typeof nickname === "string" &&
            nickname.trim()
                ? nickname.trim()
                : null;

        const normalizedLicensePlate =
            normalizeLicensePlate(
                licensePlate
            );

        const ownershipStatus =
            getOwnershipStatusForPlate(
                normalizedLicensePlate.key
            );

        const result = await db.query(
            `INSERT INTO vehicles (
                user_id,
                brand,
                model,
                model_year,
                nickname,
                license_plate,
                normalized_license_plate,
                vehicle_status,
                ownership_status,
                current_mileage
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
                $10
            )
            RETURNING
                id,
                brand,
                model,
                model_year,
                nickname,
                license_plate,
                vehicle_status,
                ownership_status,
                ownership_verified_at,
                ownership_verification_score,
                current_mileage,
                created_at,
                updated_at`,
            [
                req.session.userId,
                normalizedBrand,
                normalizedModel,
                parsedYear,
                normalizedNickname,
                normalizedLicensePlate.displayValue,
                normalizedLicensePlate.key,
                ACTIVE_VEHICLE_STATUS,
                ownershipStatus,
                mileage
            ]
        );

        res.status(201).json({
            success: true,
            message:
                "Vehicle added successfully.",
            vehicle: result.rows[0]
        });
    } catch (error) {
        if (error.code === "23505") {
            return buildVerifiedPlateConflictResponse(
                res
            );
        }

        next(error);
    }
}

async function updateMileage(req, res, next) {
    const vehicleId = parseVehicleId(
        req.params.id
    );

    const newMileage = parseMileage(
        req.body.newMileage
    );

    if (vehicleId === null) {
        return res.status(400).json({
            success: false,
            message: "Invalid vehicle ID."
        });
    }

    if (newMileage === null) {
        return res.status(400).json({
            success: false,
            message:
                "Mileage must be a non-negative integer."
        });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const vehicleResult =
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
                    req.session.userId
                ]
            );

        if (
            vehicleResult.rows.length === 0
        ) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message:
                    "Vehicle was not found."
            });
        }

        const previousMileage = Number(
            vehicleResult
                .rows[0]
                .current_mileage
        );

        if (newMileage <= previousMileage) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    `New mileage must be greater than ` +
                    `${previousMileage} km.`
            });
        }

        const updateResult =
            await client.query(
                `UPDATE vehicles
                 SET
                    current_mileage = $1,
                    updated_at = NOW()
                 WHERE id = $2
                 RETURNING
                    id,
                    brand,
                    model,
                    model_year,
                    nickname,
                    license_plate,
                    vehicle_status,
                    ownership_status,
                    ownership_verified_at,
                    ownership_verification_score,
                    current_mileage,
                    created_at,
                    updated_at`,
                [
                    newMileage,
                    vehicleId
                ]
            );

        await client.query(
            `INSERT INTO mileage_history (
                vehicle_id,
                previous_mileage,
                new_mileage
            )
            VALUES ($1, $2, $3)`,
            [
                vehicleId,
                previousMileage,
                newMileage
            ]
        );

        await client.query("COMMIT");

        res.json({
            success: true,
            message:
                "Mileage updated successfully.",
            vehicle: updateResult.rows[0]
        });
    } catch (error) {
        await client.query("ROLLBACK");
        next(error);
    } finally {
        client.release();
    }
}

async function updateVehicle(req, res, next) {
    try {
        const vehicleId = parseVehicleId(
            req.params.id
        );

        if (vehicleId === null) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID."
            });
        }

        const {
            brand,
            model,
            modelYear,
            nickname,
            licensePlate
        } = req.body;

        const vehicleResult = await db.query(
            `SELECT
                id,
                brand,
                model,
                model_year,
                nickname,
                license_plate,
                normalized_license_plate,
                vehicle_status,
                ownership_status,
                ownership_stored_file_name,
                ownership_original_file_name,
                ownership_file_mime_type,
                ownership_verified_at,
                ownership_verification_score,
                ownership_document_id,
                ownership_failure_reason,
                sold_at,
                current_mileage,
                created_at,
                updated_at
             FROM vehicles
             WHERE id = $1
               AND user_id = $2`,
            [
                vehicleId,
                req.session.userId
            ]
        );

        if (vehicleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vehicle was not found."
            });
        }

        const currentVehicle =
            vehicleResult.rows[0];

        const normalizedBrand =
            brand === undefined
                ? currentVehicle.brand
                : typeof brand === "string"
                    ? brand.trim()
                    : "";

        const normalizedModel =
            model === undefined
                ? currentVehicle.model
                : typeof model === "string"
                    ? model.trim()
                    : "";

        if (
            !normalizedBrand ||
            !normalizedModel
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Brand and model are required."
            });
        }

        const nextModelYear =
            modelYear === undefined
                ? currentVehicle.model_year
                : parseModelYear(modelYear);

        if (
            modelYear !== undefined &&
            modelYear !== null &&
            modelYear !== "" &&
            nextModelYear === null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid model year."
            });
        }

        const normalizedNickname =
            nickname === undefined
                ? currentVehicle.nickname
                : typeof nickname === "string" &&
                    nickname.trim()
                    ? nickname.trim()
                    : null;

        const nextLicensePlate =
            licensePlate === undefined
                ? {
                    displayValue:
                        currentVehicle.license_plate,
                    key:
                        currentVehicle.normalized_license_plate
                }
                : normalizeLicensePlate(
                    licensePlate
                );

        const plateChanged =
            nextLicensePlate.key !==
            currentVehicle.normalized_license_plate;

        const nextOwnershipStatus =
            plateChanged
                ? getOwnershipStatusForPlate(
                    nextLicensePlate.key
                )
                : currentVehicle.ownership_status;

        const result = await db.query(
            `UPDATE vehicles
             SET
                brand = $1,
                model = $2,
                model_year = $3,
                nickname = $4,
                license_plate = $5,
                normalized_license_plate = $6,
                ownership_status = $7,
                ownership_verified_at = $8,
                ownership_verification_score = $9,
                ownership_document_id = $10,
                ownership_failure_reason = $11,
                ownership_stored_file_name = $12,
                ownership_original_file_name = $13,
                ownership_file_mime_type = $14,
                updated_at = NOW()
             WHERE id = $15
             RETURNING
                id,
                brand,
                model,
                model_year,
                nickname,
                license_plate,
                vehicle_status,
                ownership_status,
                ownership_verified_at,
                ownership_verification_score,
                ownership_document_id,
                ownership_failure_reason,
                ownership_original_file_name,
                ownership_file_mime_type,
                sold_at,
                current_mileage,
                created_at,
                updated_at`,
            [
                normalizedBrand,
                normalizedModel,
                nextModelYear,
                normalizedNickname,
                nextLicensePlate.displayValue,
                nextLicensePlate.key,
                nextOwnershipStatus,
                plateChanged
                    ? null
                    : currentVehicle.ownership_verified_at,
                plateChanged
                    ? null
                    : currentVehicle.ownership_verification_score,
                plateChanged
                    ? null
                    : currentVehicle.ownership_document_id,
                plateChanged
                    ? "The plate changed. Upload the registration document again to verify ownership."
                    : currentVehicle.ownership_failure_reason,
                plateChanged
                    ? null
                    : currentVehicle.ownership_stored_file_name,
                plateChanged
                    ? null
                    : currentVehicle.ownership_original_file_name,
                plateChanged
                    ? null
                    : currentVehicle.ownership_file_mime_type,
                vehicleId
            ]
        );

        if (
            plateChanged &&
            currentVehicle.ownership_stored_file_name
        ) {
            await removeStoredDocument(
                currentVehicle.ownership_stored_file_name
            );
        }

        res.json({
            success: true,
            message:
                plateChanged &&
                nextLicensePlate.key
                    ? "Vehicle details updated. Ownership verification has been reset for the new plate."
                    : "Vehicle details updated successfully.",
            vehicle: result.rows[0]
        });
    } catch (error) {
        if (error.code === "23505") {
            return buildVerifiedPlateConflictResponse(
                res
            );
        }

        next(error);
    }
}

async function verifyVehicleOwnership(
    req,
    res,
    next
) {
    try {
        const vehicleId = parseVehicleId(
            req.params.id
        );

        if (vehicleId === null) {
            return res.status(400).json({
                success: false,
                message:
                    "A valid vehicle is required."
            });
        }

        const vehicleResult = await db.query(
            `SELECT
                v.id,
                v.user_id,
                v.license_plate,
                v.normalized_license_plate,
                v.vehicle_status,
                v.ownership_status,
                v.ownership_stored_file_name,
                v.ownership_original_file_name,
                v.ownership_file_mime_type,
                u.full_name
             FROM vehicles v
             INNER JOIN users u
                ON u.id = v.user_id
             WHERE v.id = $1
               AND v.user_id = $2`,
            [
                vehicleId,
                req.session.userId
            ]
        );

        if (vehicleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vehicle was not found."
            });
        }

        const vehicle =
            vehicleResult.rows[0];

        if (
            vehicle.vehicle_status !==
            ACTIVE_VEHICLE_STATUS
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only active vehicles can be verified."
            });
        }

        if (!vehicle.normalized_license_plate) {
            return res.status(400).json({
                success: false,
                message:
                    "Add a license plate before verifying ownership."
            });
        }

        const fileValidation =
            normalizeOptionalFilePayload(
                req.body.file
            );

        if (fileValidation.error) {
            return res.status(400).json({
                success: false,
                message: fileValidation.error
            });
        }

        let storedFile = null;
        let storedFileName =
            vehicle.ownership_stored_file_name;
        let originalFileName =
            vehicle.ownership_original_file_name;
        let fileMimeType =
            vehicle.ownership_file_mime_type;

        if (fileValidation.value) {
            storedFile =
                await saveUploadedDocument(
                    fileValidation.value
                );
            storedFileName =
                storedFile.storedName;
            originalFileName =
                storedFile.originalName;
            fileMimeType =
                storedFile.mimeType;
        }

        if (!storedFileName) {
            return res.status(400).json({
                success: false,
                message:
                    "Upload a registration image before verifying ownership."
            });
        }

        if (
            ![
                "image/jpeg",
                "image/png",
                "image/webp"
            ].includes(fileMimeType)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Ownership verification currently supports JPG, PNG and WEBP registration images."
            });
        }

        const ocrText =
            await recognizeDocumentText(
                getDocumentAbsolutePath(
                    storedFileName
                )
            );

        const evaluation =
            evaluateOwnershipVerification({
                accountName: vehicle.full_name,
                licensePlate: vehicle.license_plate,
                ocrText
            });

        const nextStatus =
            evaluation.status === "verified"
                ? OWNERSHIP_VERIFIED
                : OWNERSHIP_FAILED;

        let replacedOldFile = false;
        const updateResult = await db.query(
            `UPDATE vehicles
             SET
                ownership_status = $1,
                ownership_verified_at = $2,
                ownership_verification_score = $3,
                ownership_document_id = NULL,
                ownership_failure_reason = $4,
                ownership_stored_file_name = $5,
                ownership_original_file_name = $6,
                ownership_file_mime_type = $7,
                updated_at = NOW()
             WHERE id = $8
             RETURNING
                id,
                brand,
                model,
                model_year,
                nickname,
                license_plate,
                vehicle_status,
                ownership_status,
                ownership_verified_at,
                ownership_verification_score,
                ownership_document_id,
                ownership_failure_reason,
                ownership_original_file_name,
                ownership_file_mime_type,
                sold_at,
                current_mileage,
                created_at,
                updated_at`,
            [
                nextStatus,
                nextStatus ===
                    OWNERSHIP_VERIFIED
                    ? new Date()
                    : null,
                evaluation.totalScore,
                evaluation.message,
                storedFileName,
                originalFileName,
                fileMimeType,
                vehicleId
            ]
        );

        if (
            storedFile &&
            vehicle.ownership_stored_file_name &&
            vehicle.ownership_stored_file_name !==
                storedFile.storedName
        ) {
            replacedOldFile = true;
            await removeStoredDocument(
                vehicle.ownership_stored_file_name
            );
        }

        res.json({
            success: true,
            message: evaluation.message,
            verification: {
                status: evaluation.status,
                score: evaluation.totalScore,
                plateMatch:
                    evaluation.plateMatch,
                matchedNameTokens:
                    evaluation.matchedNameTokens
            },
            vehicle: mapVehicleRow(
                updateResult.rows[0]
            )
        });
    } catch (error) {
        if (error.code === "23505") {
            return buildVerifiedPlateConflictResponse(
                res
            );
        }

        next(error);
    }
}

async function markVehicleAsSold(
    req,
    res,
    next
) {
    try {
        const vehicleId = parseVehicleId(
            req.params.id
        );

        if (vehicleId === null) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID."
            });
        }

        const result = await db.query(
            `UPDATE vehicles
             SET
                vehicle_status = $1,
                sold_at = NOW(),
                updated_at = NOW()
             WHERE id = $2
               AND user_id = $3
               AND vehicle_status = $4
             RETURNING
                id,
                brand,
                model,
                model_year,
                nickname,
                license_plate,
                vehicle_status,
                ownership_status,
                ownership_verified_at,
                ownership_verification_score,
                sold_at,
                current_mileage,
                created_at,
                updated_at`,
            [
                SOLD_VEHICLE_STATUS,
                vehicleId,
                req.session.userId,
                ACTIVE_VEHICLE_STATUS
            ]
        );

        if (result.rows.length === 0) {
            const existingVehicle =
                await db.query(
                    `SELECT id, vehicle_status
                     FROM vehicles
                     WHERE id = $1
                       AND user_id = $2`,
                    [
                        vehicleId,
                        req.session.userId
                    ]
                );

            if (
                existingVehicle.rows.length ===
                0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Vehicle was not found."
                });
            }

            return res.status(400).json({
                success: false,
                message:
                    "This vehicle has already been marked as sold."
            });
        }

        res.json({
            success: true,
            message:
                "Vehicle marked as sold successfully.",
            vehicle: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
}

async function deleteVehicle(req, res, next) {
    try {
        const vehicleId = parseVehicleId(
            req.params.id
        );

        if (vehicleId === null) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID."
            });
        }

        const activeVehicle = await db.query(
            `SELECT id
             FROM vehicles
             WHERE id = $1
               AND user_id = $2
               AND vehicle_status = $3`,
            [
                vehicleId,
                req.session.userId,
                ACTIVE_VEHICLE_STATUS
            ]
        );

        if (activeVehicle.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Active vehicles cannot be deleted. Mark the vehicle as sold first."
            });
        }

        const fileResult = await db.query(
            `SELECT stored_file_name
             FROM vehicle_documents
             WHERE vehicle_id = $1
               AND stored_file_name IS NOT NULL

             UNION ALL

             SELECT media.stored_file_name
             FROM vehicle_issue_media media
             INNER JOIN vehicle_issues issue
                ON issue.id = media.issue_id
             WHERE issue.vehicle_id = $1

             UNION ALL

             SELECT ownership_stored_file_name
             FROM vehicles
             WHERE id = $1
               AND user_id = $2
               AND ownership_stored_file_name IS NOT NULL`,
            [
                vehicleId,
                req.session.userId
            ]
        );

        const result = await db.query(
            `DELETE FROM vehicles
             WHERE id = $1
               AND user_id = $2
             RETURNING id`,
            [
                vehicleId,
                req.session.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Vehicle was not found."
            });
        }

        for (const row of fileResult.rows) {
            await removeStoredDocument(
                row.stored_file_name
            );
        }

        res.json({
            success: true,
            message:
                "Vehicle deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getVehicles,
    getVehicleArchive,
    getVehicleById,
    exportBuyerHandoffPackage,
    getMileageHistory,
    createVehicle,
    updateVehicle,
    updateMileage,
    verifyVehicleOwnership,
    markVehicleAsSold,
    deleteVehicle
};
