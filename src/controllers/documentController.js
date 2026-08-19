const db = require("../config/db");
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
    extractDocumentSuggestions
} = require("../utils/documentExtraction");

const allowedDocumentTypes = new Set([
    "registration",
    "inspection",
    "insurance",
    "casco",
    "emission",
    "tax",
    "warranty",
    "other"
]);

let documentFileColumnsState = null;

async function hasDocumentFileColumns() {
    if (documentFileColumnsState !== null) {
        return documentFileColumnsState;
    }

    const result = await db.query(
        `SELECT COUNT(*)::INTEGER AS column_count
         FROM information_schema.columns
         WHERE table_name = 'vehicle_documents'
           AND column_name = ANY($1::TEXT[])`,
        [[
            "stored_file_name",
            "original_file_name",
            "file_mime_type",
            "file_size"
        ]]
    );

    documentFileColumnsState =
        result.rows[0]?.column_count === 4;

    return documentFileColumnsState;
}

async function getDocumentFileSelectClause() {
    return (
        await hasDocumentFileColumns()
    )
        ? `d.stored_file_name,
           d.original_file_name,
           d.file_mime_type,
           d.file_size,`
        : `NULL AS stored_file_name,
           NULL AS original_file_name,
           NULL AS file_mime_type,
           NULL AS file_size,`;
}

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

function normalizeRequiredText(
    value,
    maximumLength
) {
    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue = value.trim();

    if (
        !normalizedValue ||
        normalizedValue.length >
            maximumLength
    ) {
        return null;
    }

    return normalizedValue;
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

    const normalizedValue = value.trim();

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

function normalizeDatabaseDate(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value
            .toISOString()
            .slice(0, 10);
    }

    return String(value).slice(0, 10);
}

function isValidDate(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const date = new Date(
        `${value}T00:00:00.000Z`
    );

    if (
        Number.isNaN(date.getTime())
    ) {
        return false;
    }

    return (
        date.toISOString().slice(0, 10) ===
        value
    );
}

function validateDocumentData(data) {
    const vehicleId = parseId(
        data.vehicleId
    );

    if (vehicleId === null) {
        return {
            error: "Please select a valid vehicle."
        };
    }

    const documentType =
        typeof data.documentType === "string"
            ? data.documentType
                .trim()
                .toLowerCase()
            : "";

    if (
        !allowedDocumentTypes.has(
            documentType
        )
    ) {
        return {
            error:
                "Please select a valid document type."
        };
    }

    const title = normalizeRequiredText(
        data.title,
        120
    );

    if (!title) {
        return {
            error:
                "Title is required and must be shorter than 120 characters."
        };
    }

    const provider = normalizeOptionalText(
        data.provider,
        120
    );

    if (
        data.provider &&
        provider === null
    ) {
        return {
            error:
                "Provider must be shorter than 120 characters."
        };
    }

    const documentNumber =
        normalizeOptionalText(
            data.documentNumber,
            100
        );

    if (
        data.documentNumber &&
        documentNumber === null
    ) {
        return {
            error:
                "Document number must be shorter than 100 characters."
        };
    }

    let startDate = null;

    if (
        data.startDate !== undefined &&
        data.startDate !== null &&
        data.startDate !== ""
    ) {
        if (!isValidDate(data.startDate)) {
            return {
                error:
                    "Please enter a valid start date."
            };
        }

        startDate = data.startDate;
    }

    if (!isValidDate(data.expiryDate)) {
        return {
            error:
                "Please enter a valid expiry date."
        };
    }

    const expiryDate = data.expiryDate;

    if (
        startDate &&
        startDate > expiryDate
    ) {
        return {
            error:
                "Start date cannot be later than the expiry date."
        };
    }

    const reminderDays =
        data.reminderDays === undefined ||
        data.reminderDays === null ||
        data.reminderDays === ""
            ? 30
            : Number(data.reminderDays);

    if (
        !Number.isInteger(reminderDays) ||
        reminderDays < 0 ||
        reminderDays > 365
    ) {
        return {
            error:
                "Reminder days must be between 0 and 365."
        };
    }

    const notes = normalizeOptionalText(
        data.notes,
        2000
    );

    if (
        data.notes &&
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
            documentType,
            title,
            provider,
            documentNumber,
            startDate,
            expiryDate,
            reminderDays,
            notes
        }
    };
}

async function findOwnedDocument(
    documentId,
    userId
) {
    const fileSelectClause =
        await getDocumentFileSelectClause();

    const result = await db.query(
        `SELECT
            d.id,
            d.vehicle_id,
            d.document_type,
            d.title,
            d.provider,
            d.document_number,
            TO_CHAR(
                d.start_date,
                'YYYY-MM-DD'
            ) AS start_date,
            TO_CHAR(
                d.expiry_date,
                'YYYY-MM-DD'
            ) AS expiry_date,
            d.reminder_days,
            d.notes,
            ${fileSelectClause}
            d.created_at,
            d.updated_at,

            v.brand,
            v.model,
            v.nickname,
            v.license_plate,
            v.vehicle_status,
            v.ownership_status,

            (
                d.expiry_date -
                CURRENT_DATE
            )::INTEGER AS days_remaining,

            CASE
                WHEN d.expiry_date <
                    CURRENT_DATE
                    THEN 'expired'

                WHEN d.expiry_date <=
                    CURRENT_DATE +
                    d.reminder_days
                    THEN 'due_soon'

                ELSE 'valid'
            END AS renewal_status

         FROM vehicle_documents d

         INNER JOIN vehicles v
            ON v.id = d.vehicle_id

         WHERE d.id = $1
           AND v.user_id = $2`,
        [
            documentId,
            userId
        ]
    );

    return result.rows[0] || null;
}

async function getDocuments(
    req,
    res,
    next
) {
    try {
        const fileSelectClause =
            await getDocumentFileSelectClause();

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
                d.id,
                d.vehicle_id,
                d.document_type,
                d.title,
                d.provider,
                d.document_number,

                TO_CHAR(
                    d.start_date,
                    'YYYY-MM-DD'
                ) AS start_date,

                TO_CHAR(
                    d.expiry_date,
                    'YYYY-MM-DD'
                ) AS expiry_date,

                d.reminder_days,
                d.notes,
                ${fileSelectClause}
                d.created_at,
                d.updated_at,

                v.brand,
                v.model,
                v.nickname,
                v.license_plate,
                v.vehicle_status,
                v.ownership_status,

                (
                    d.expiry_date -
                    CURRENT_DATE
                )::INTEGER AS days_remaining,

                CASE
                    WHEN d.expiry_date <
                        CURRENT_DATE
                        THEN 'expired'

                    WHEN d.expiry_date <=
                        CURRENT_DATE +
                        d.reminder_days
                        THEN 'due_soon'

                    ELSE 'valid'
                END AS renewal_status

             FROM vehicle_documents d

             INNER JOIN vehicles v
                ON v.id = d.vehicle_id

             WHERE v.user_id = $1

               AND (
                    $2::BIGINT IS NULL
                    OR d.vehicle_id = $2
               )

             ORDER BY
                d.expiry_date ASC,
                d.created_at DESC`,
            [
                req.auth.userId,
                vehicleId
            ]
        );

        res.json({
            success: true,
            documents: result.rows
        });
    } catch (error) {
        next(error);
    }
}

async function getDocumentById(
    req,
    res,
    next
) {
    try {
        const documentId = parseId(
            req.params.id
        );

        if (documentId === null) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Invalid document ID."
                });
        }

        const document =
            await findOwnedDocument(
                documentId,
                req.auth.userId
            );

        if (!document) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Document was not found."
                });
        }

        res.json({
            success: true,
            document
        });
    } catch (error) {
        next(error);
    }
}

async function createDocument(
    req,
    res,
    next
) {
    let storedFile = null;

    try {
        const validation =
            validateDocumentData(
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

        const documentData =
            validation.value;

        const fileValidation =
            normalizeOptionalFilePayload(
                req.body.file
            );

        if (fileValidation.error) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        fileValidation.error
                });
        }

        const vehicleResult =
            await db.query(
                `SELECT id
                 FROM vehicles
                 WHERE id = $1
                   AND user_id = $2`,
                [
                    documentData.vehicleId,
                    req.auth.userId
                ]
            );

        if (
            vehicleResult.rows.length === 0
        ) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Vehicle was not found."
                });
        }

        storedFile =
            await saveUploadedDocument(
                fileValidation.value
            );

        const insertResult = await db.query(
            await hasDocumentFileColumns()
                ? `INSERT INTO vehicle_documents (
                    vehicle_id,
                    document_type,
                    title,
                    provider,
                    document_number,
                    start_date,
                    expiry_date,
                    reminder_days,
                    notes,
                    stored_file_name,
                    original_file_name,
                    file_mime_type,
                    file_size
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
                    $11,
                    $12,
                    $13
                )
                RETURNING id`
                : `INSERT INTO vehicle_documents (
                    vehicle_id,
                    document_type,
                    title,
                    provider,
                    document_number,
                    start_date,
                    expiry_date,
                    reminder_days,
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
                    $8,
                    $9
                )
                RETURNING id`,
            await hasDocumentFileColumns()
                ? [
                    documentData.vehicleId,
                    documentData.documentType,
                    documentData.title,
                    documentData.provider,
                    documentData.documentNumber,
                    documentData.startDate,
                    documentData.expiryDate,
                    documentData.reminderDays,
                    documentData.notes,
                    storedFile?.storedName ||
                        null,
                    storedFile?.originalName ||
                        null,
                    storedFile?.mimeType || null,
                    storedFile?.size || null
                ]
                : [
                    documentData.vehicleId,
                    documentData.documentType,
                    documentData.title,
                    documentData.provider,
                    documentData.documentNumber,
                    documentData.startDate,
                    documentData.expiryDate,
                    documentData.reminderDays,
                    documentData.notes
                ]
        );

        const createdDocument =
            await findOwnedDocument(
                insertResult.rows[0].id,
                req.auth.userId
            );

        res.status(201).json({
            success: true,
            message:
                "Document reminder created successfully.",
            document:
                createdDocument
        });
    } catch (error) {
        if (storedFile) {
            await removeStoredDocument(
                storedFile.storedName
            );
        }

        if (error.code === "23505") {
            return res
                .status(409)
                .json({
                    success: false,
                    message:
                        "This vehicle already has a reminder for that document type. Update the existing reminder instead."
                });
        }

        next(error);
    }
}

async function updateDocument(
    req,
    res,
    next
) {
    let storedFile = null;

    try {
        const documentId = parseId(
            req.params.id
        );

        if (documentId === null) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Invalid document ID."
                });
        }

        const currentDocument =
            await findOwnedDocument(
                documentId,
                req.auth.userId
            );

        if (!currentDocument) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Document was not found."
                });
        }

        const mergedData = {
            vehicleId:
                req.body.vehicleId ===
                undefined
                    ? currentDocument
                        .vehicle_id
                    : req.body.vehicleId,

            documentType:
                req.body.documentType ===
                undefined
                    ? currentDocument
                        .document_type
                    : req.body.documentType,

            title:
                req.body.title ===
                undefined
                    ? currentDocument.title
                    : req.body.title,

            provider:
                req.body.provider ===
                undefined
                    ? currentDocument.provider
                    : req.body.provider,

            documentNumber:
                req.body.documentNumber ===
                undefined
                    ? currentDocument
                        .document_number
                    : req.body.documentNumber,

            startDate:
                req.body.startDate ===
                undefined
                    ? normalizeDatabaseDate(
                        currentDocument.start_date
                    )
                    : req.body.startDate,

            expiryDate:
                req.body.expiryDate ===
                undefined
                    ? normalizeDatabaseDate(
                        currentDocument.expiry_date
                    )
                    : req.body.expiryDate,

            reminderDays:
                req.body.reminderDays ===
                undefined
                    ? currentDocument
                        .reminder_days
                    : req.body.reminderDays,

            notes:
                req.body.notes ===
                undefined
                    ? currentDocument.notes
                    : req.body.notes
        };

        const validation =
            validateDocumentData(
                mergedData
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

        const documentData =
            validation.value;

        const fileValidation =
            normalizeOptionalFilePayload(
                req.body.file
            );

        if (fileValidation.error) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        fileValidation.error
                });
        }

        const vehicleResult =
            await db.query(
                `SELECT id
                 FROM vehicles
                 WHERE id = $1
                   AND user_id = $2`,
                [
                    documentData.vehicleId,
                    req.auth.userId
                ]
            );

        if (
            vehicleResult.rows.length === 0
        ) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Vehicle was not found."
                });
        }

        const shouldReplaceFile =
            fileValidation.value !== null;

        const shouldRemoveFile =
            req.body.removeFile === true;

        if (shouldReplaceFile) {
            storedFile =
                await saveUploadedDocument(
                    fileValidation.value
                );
        }

        await db.query(
            await hasDocumentFileColumns()
                ? `UPDATE vehicle_documents
                   SET
                      vehicle_id = $1,
                      document_type = $2,
                      title = $3,
                      provider = $4,
                      document_number = $5,
                      start_date = $6,
                      expiry_date = $7,
                      reminder_days = $8,
                      notes = $9,
                      stored_file_name = $10,
                      original_file_name = $11,
                      file_mime_type = $12,
                      file_size = $13,
                      updated_at = NOW()
                   WHERE id = $14`
                : `UPDATE vehicle_documents
                   SET
                      vehicle_id = $1,
                      document_type = $2,
                      title = $3,
                      provider = $4,
                      document_number = $5,
                      start_date = $6,
                      expiry_date = $7,
                      reminder_days = $8,
                      notes = $9,
                      updated_at = NOW()
                   WHERE id = $10`,
            await hasDocumentFileColumns()
                ? [
                    documentData.vehicleId,
                    documentData.documentType,
                    documentData.title,
                    documentData.provider,
                    documentData.documentNumber,
                    documentData.startDate,
                    documentData.expiryDate,
                    documentData.reminderDays,
                    documentData.notes,
                    shouldReplaceFile
                        ? storedFile.storedName
                        : shouldRemoveFile
                            ? null
                            : currentDocument.stored_file_name,
                    shouldReplaceFile
                        ? storedFile.originalName
                        : shouldRemoveFile
                            ? null
                            : currentDocument.original_file_name,
                    shouldReplaceFile
                        ? storedFile.mimeType
                        : shouldRemoveFile
                            ? null
                            : currentDocument.file_mime_type,
                    shouldReplaceFile
                        ? storedFile.size
                        : shouldRemoveFile
                            ? null
                            : currentDocument.file_size,
                    documentId
                ]
                : [
                    documentData.vehicleId,
                    documentData.documentType,
                    documentData.title,
                    documentData.provider,
                    documentData.documentNumber,
                    documentData.startDate,
                    documentData.expiryDate,
                    documentData.reminderDays,
                    documentData.notes,
                    documentId
                ]
        );

        if (
            await hasDocumentFileColumns() &&
            (
                shouldReplaceFile ||
                shouldRemoveFile
            )
        ) {
            await removeStoredDocument(
                currentDocument.stored_file_name
            );
        }

        const updatedDocument =
            await findOwnedDocument(
                documentId,
                req.auth.userId
            );

        res.json({
            success: true,
            message:
                "Document reminder updated successfully.",
            document:
                updatedDocument
        });
    } catch (error) {
        if (storedFile) {
            await removeStoredDocument(
                storedFile.storedName
            );
        }

        if (error.code === "23505") {
            return res
                .status(409)
                .json({
                    success: false,
                    message:
                        "This vehicle already has a reminder for that document type."
                });
        }

        next(error);
    }
}

async function deleteDocument(
    req,
    res,
    next
) {
    try {
        const documentId = parseId(
            req.params.id
        );

        if (documentId === null) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Invalid document ID."
                });
        }

        const ownedDocument =
            await findOwnedDocument(
                documentId,
                req.auth.userId
            );

        if (!ownedDocument) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Document was not found."
                });
        }

        const result = await db.query(
            `DELETE FROM vehicle_documents d
             USING vehicles v
             WHERE d.id = $1
               AND v.id = d.vehicle_id
               AND v.user_id = $2
             RETURNING d.id`,
            [
                documentId,
                req.auth.userId
            ]
        );

        await removeStoredDocument(
            ownedDocument.stored_file_name
        );

        res.json({
            success: true,
            message:
                "Document reminder deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}

async function downloadDocumentFile(
    req,
    res,
    next
) {
    try {
        const documentId = parseId(
            req.params.id
        );

        if (documentId === null) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Invalid document ID."
                });
        }

        const document =
            await findOwnedDocument(
                documentId,
                req.auth.userId
            );

        if (!document) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Document was not found."
                });
        }

        if (!document.stored_file_name) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "This document does not have an uploaded file."
                });
        }

        const absolutePath =
            resolveStoredDocumentAbsolutePath(
                document.stored_file_name
            );

        res.setHeader(
            "Content-Type",
            document.file_mime_type ||
                "application/octet-stream"
        );

        res.download(
            absolutePath,
            document.original_file_name ||
                "document"
        );
    } catch (error) {
        next(error);
    }
}

async function extractDocumentDetails(
    req,
    res,
    next
) {
    let storedFile = null;

    try {
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

        if (!fileValidation.value) {
            return res.status(400).json({
                success: false,
                message:
                    "Upload a document file before running auto-fill."
            });
        }

        storedFile =
            await saveUploadedDocument(
                fileValidation.value
            );

        const ocrText =
            await recognizeDocumentText(
                storedFile.absolutePath
            );

        const extraction =
            extractDocumentSuggestions({
                ocrText,
                fileName:
                    fileValidation.value
                        .originalName,
                documentType:
                    typeof req.body.documentType ===
                    "string"
                        ? req.body.documentType
                              .trim()
                              .toLowerCase()
                        : null
            });

        res.json({
            success: true,
            suggestions:
                extraction.suggestions,
            detectedFieldCount:
                extraction.detectedFieldCount,
            previewText:
                extraction.previewText
        });
    } catch (error) {
        next(error);
    } finally {
        if (storedFile) {
            await removeStoredDocument(
                storedFile.storedName
            );
        }
    }
}

module.exports = {
    getDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
    downloadDocumentFile,
    extractDocumentDetails
};

