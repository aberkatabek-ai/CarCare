const test = require("node:test");
const assert = require("node:assert/strict");

const {
    normalizeOptionalFilePayload,
    sanitizeFileName
} = require("../src/utils/documentUpload");

test("normalizeOptionalFilePayload accepts supported base64 file", () => {
    const result = normalizeOptionalFilePayload({
        name: "insurance.pdf",
        type: "application/pdf",
        contentBase64: Buffer.from("hello").toString("base64")
    });

    assert.equal(result.error, undefined);
    assert.equal(result.value.originalName, "insurance.pdf");
    assert.equal(result.value.mimeType, "application/pdf");
    assert.equal(result.value.size, 5);
});

test("normalizeOptionalFilePayload rejects unsupported mime types", () => {
    const result = normalizeOptionalFilePayload({
        name: "script.exe",
        type: "application/octet-stream",
        contentBase64: Buffer.from("hello").toString("base64")
    });

    assert.equal(
        result.error,
        "Only PDF, JPEG, PNG and WEBP files are supported."
    );
});

test("sanitizeFileName strips unsafe characters", () => {
    assert.equal(
        sanitizeFileName("  poliçe / 2026  "),
        "2026"
    );
});
