const path = require("path");
const crypto = require("crypto");
const fs = require("fs/promises");

const uploadDirectory = path.join(
    __dirname,
    "..",
    "..",
    "uploads",
    "documents"
);

const allowedMimeTypes = new Map([
    ["application/pdf", ".pdf"],
    ["image/jpeg", ".jpg"],
    ["image/png", ".png"],
    ["image/webp", ".webp"]
]);

const maximumFileSize = 5 * 1024 * 1024;

function normalizeOptionalFilePayload(file) {
    if (
        file === undefined ||
        file === null ||
        file === ""
    ) {
        return {
            value: null
        };
    }

    if (
        typeof file !== "object" ||
        Array.isArray(file)
    ) {
        return {
            error: "Uploaded file payload is invalid."
        };
    }

    const originalName =
        typeof file.name === "string"
            ? file.name.trim()
            : "";

    const mimeType =
        typeof file.type === "string"
            ? file.type.trim().toLowerCase()
            : "";

    const base64Content =
        typeof file.contentBase64 === "string"
            ? file.contentBase64.trim()
            : "";

    if (
        !originalName ||
        !mimeType ||
        !base64Content
    ) {
        return {
            error:
                "Uploaded file is missing its name, type or content."
        };
    }

    if (!allowedMimeTypes.has(mimeType)) {
        return {
            error:
                "Only PDF, JPEG, PNG and WEBP files are supported."
        };
    }

    if (!/^[A-Za-z0-9+/=]+$/.test(base64Content)) {
        return {
            error: "Uploaded file content is not valid base64."
        };
    }

    let buffer;

    try {
        buffer = Buffer.from(
            base64Content,
            "base64"
        );
    } catch (error) {
        return {
            error: "Uploaded file content could not be decoded."
        };
    }

    if (!buffer.length) {
        return {
            error: "Uploaded file is empty."
        };
    }

    if (buffer.length > maximumFileSize) {
        return {
            error:
                "Uploaded file must be 5 MB or smaller."
        };
    }

    return {
        value: {
            originalName,
            mimeType,
            buffer,
            size: buffer.length
        }
    };
}

function sanitizeFileName(fileName) {
    const trimmedName =
        typeof fileName === "string"
            ? fileName.trim()
            : "";

    if (!trimmedName) {
        return "document";
    }

    return trimmedName
        .replace(/[^\w.-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80) || "document";
}

async function ensureUploadDirectory() {
    await fs.mkdir(uploadDirectory, {
        recursive: true
    });
}

async function saveUploadedDocument(file) {
    if (!file) {
        return null;
    }

    await ensureUploadDirectory();

    const extension =
        allowedMimeTypes.get(file.mimeType) ||
        path.extname(file.originalName) ||
        "";

    const generatedName = `${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(
        path.basename(
            file.originalName,
            path.extname(file.originalName)
        )
    )}${extension}`;

    const absolutePath = path.join(
        uploadDirectory,
        generatedName
    );

    await fs.writeFile(absolutePath, file.buffer);

    return {
        storedName: generatedName,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        absolutePath
    };
}

async function removeStoredDocument(storedName) {
    if (!storedName) {
        return;
    }

    const absolutePath = path.join(
        uploadDirectory,
        storedName
    );

    await fs.unlink(absolutePath).catch(() => {});
}

module.exports = {
    allowedMimeTypes,
    maximumFileSize,
    normalizeOptionalFilePayload,
    sanitizeFileName,
    saveUploadedDocument,
    removeStoredDocument,
    uploadDirectory
};
