const assert = require("node:assert/strict");

const {
    validateProfileUpdate,
    validatePasswordUpdate,
    validateForgotPasswordRequest,
    validatePasswordReset
} = require("../src/utils/profileValidation");

const {
    normalizeOptionalFilePayload,
    sanitizeFileName
} = require("../src/utils/documentUpload");
const {
    normalizeLicensePlate
} = require("../src/utils/vehicleOwnership");
const {
    evaluateOwnershipVerification
} = require("../src/utils/ownershipVerification");

function runTest(name, testFn) {
    try {
        testFn();
        console.log(`PASS ${name}`);
    } catch (error) {
        console.error(`FAIL ${name}`);
        console.error(error);
        process.exitCode = 1;
    }
}

runTest(
    "profile update normalizes valid data",
    () => {
        const result = validateProfileUpdate({
            fullName: "  Berk Acar  ",
            preferredName: "  Baba  ",
            email: "  TEST@Example.com "
        });

        assert.equal(result.error, undefined);
        assert.deepEqual(result.value, {
            fullName: "Berk Acar",
            preferredName: "Baba",
            email: "test@example.com"
        });
    }
);

runTest(
    "profile update rejects invalid email",
    () => {
        const result = validateProfileUpdate({
            fullName: "Berk",
            email: "invalid"
        });

        assert.equal(
            result.error,
            "Please enter a valid email address."
        );
    }
);

runTest(
    "password update rejects reused password",
    () => {
        const result = validatePasswordUpdate({
            currentPassword: "password123",
            newPassword: "password123"
        });

        assert.equal(
            result.error,
            "New password must be different from the current password."
        );
    }
);

runTest(
    "forgot password request normalizes email",
    () => {
        const result =
            validateForgotPasswordRequest({
                email: " TEST@Example.com "
            });

        assert.equal(result.error, undefined);
        assert.equal(
            result.value.email,
            "test@example.com"
        );
    }
);

runTest(
    "password reset rejects invalid code",
    () => {
        const result =
            validatePasswordReset({
                email: "test@example.com",
                code: "12ab",
                newPassword: "password123"
            });

        assert.equal(
            result.error,
            "Verification code must contain 6 digits."
        );
    }
);

runTest(
    "file payload accepts supported base64 upload",
    () => {
        const result = normalizeOptionalFilePayload({
            name: "insurance.pdf",
            type: "application/pdf",
            contentBase64: Buffer.from("hello").toString("base64")
        });

        assert.equal(result.error, undefined);
        assert.equal(result.value.originalName, "insurance.pdf");
        assert.equal(result.value.mimeType, "application/pdf");
        assert.equal(result.value.size, 5);
    }
);

runTest(
    "file payload rejects unsupported mime type",
    () => {
        const result = normalizeOptionalFilePayload({
            name: "script.exe",
            type: "application/octet-stream",
            contentBase64: Buffer.from("hello").toString("base64")
        });

        assert.equal(
            result.error,
            "Only PDF, JPEG, PNG and WEBP files are supported."
        );
    }
);

runTest(
    "file name sanitizer strips unsafe characters",
    () => {
        assert.equal(
            sanitizeFileName("  poliçe / 2026  "),
            "poli-e-2026"
        );
    }
);

runTest(
    "license plate normalization removes separators",
    () => {
        assert.deepEqual(
            normalizeLicensePlate(" 34-abc 123 "),
            {
                displayValue: "34-ABC 123",
                key: "34ABC123"
            }
        );
    }
);

runTest(
    "ownership verification passes when plate and name match",
    () => {
        const result =
            evaluateOwnershipVerification({
                accountName: "Berk Atabek",
                licensePlate: "34 ABC 123",
                ocrText:
                    "34 ABC 123 BERK ATABEK TESCIL BELGESI"
            });

        assert.equal(result.status, "verified");
        assert.equal(result.plateMatch, true);
    }
);

runTest(
    "ownership verification fails when plate is missing",
    () => {
        const result =
            evaluateOwnershipVerification({
                accountName: "Berk Atabek",
                licensePlate: "34 ABC 123",
                ocrText:
                    "06 XYZ 999 BERK ATABEK TESCIL BELGESI"
            });

        assert.equal(result.status, "failed");
        assert.equal(result.plateMatch, false);
    }
);

if (process.exitCode) {
    process.exit(process.exitCode);
}
