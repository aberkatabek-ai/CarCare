const assert = require("node:assert/strict");

const {
    getNameValidationError,
    getPasswordValidationError,
    validateRegistration,
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
const {
    normalizeIsoDate
} = require("../src/utils/dateValidation");
const {
    calculateVehicleCurrentMileage,
    shouldRejectBackdatedMileageEntry
} = require("../src/utils/mileageState");

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
    "date validation rejects impossible calendar dates",
    () => {
        assert.equal(
            normalizeIsoDate("2026-02-31"),
            null
        );
    }
);

runTest(
    "date validation accepts real calendar dates",
    () => {
        assert.equal(
            normalizeIsoDate("2026-02-28"),
            "2026-02-28"
        );
    }
);

runTest(
    "registration rejects inappropriate full names",
    () => {
        const result = validateRegistration({
            fullName: "Fuck Tester",
            email: "test@example.com",
            password: "StrongPass1!"
        });

        assert.equal(
            result.error,
            "Full name contains inappropriate words."
        );
    }
);

runTest(
    "registration rejects passwords shorter than 8 characters",
    () => {
        const result = validateRegistration({
            fullName: "Berk Acar",
            email: " TEST@Example.com ",
            password: "Ab1!"
        });

        assert.equal(
            result.error,
            "Password must contain at least 8 characters."
        );
    }
);

runTest(
    "registration rejects passwords with spaces",
    () => {
        const result = validateRegistration({
            fullName: "Berk Acar",
            email: " TEST@Example.com ",
            password: "Abcd 123!"
        });

        assert.equal(
            result.error,
            "Password cannot contain spaces."
        );
    }
);

runTest(
    "registration rejects passwords without uppercase letters",
    () => {
        const result = validateRegistration({
            fullName: "Berk Acar",
            email: " TEST@Example.com ",
            password: "berkacar1!"
        });

        assert.equal(
            result.error,
            "Password must contain at least one uppercase letter."
        );
    }
);

runTest(
    "registration rejects passwords without lowercase letters",
    () => {
        const result = validateRegistration({
            fullName: "Berk Acar",
            email: " TEST@Example.com ",
            password: "BERKACAR1!"
        });

        assert.equal(
            result.error,
            "Password must contain at least one lowercase letter."
        );
    }
);

runTest(
    "registration rejects passwords without numbers",
    () => {
        const result = validateRegistration({
            fullName: "Berk Acar",
            email: " TEST@Example.com ",
            password: "BerkAcar!"
        });

        assert.equal(
            result.error,
            "Password must contain at least one number."
        );
    }
);

runTest(
    "registration rejects passwords without special characters",
    () => {
        const result = validateRegistration({
            fullName: "Berk Acar",
            email: " TEST@Example.com ",
            password: "BerkAcar1"
        });

        assert.equal(
            result.error,
            "Password must contain at least one special character."
        );
    }
);

runTest(
    "registration normalizes valid data with a strong password",
    () => {
        const result = validateRegistration({
            fullName: "  Berk Acar  ",
            email: " TEST@Example.com ",
            password: "StrongPass1!"
        });

        assert.equal(result.error, undefined);
        assert.deepEqual(result.value, {
            fullName: "Berk Acar",
            email: "test@example.com",
            password: "StrongPass1!"
        });
    }
);

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
    "profile update rejects inappropriate preferred names",
    () => {
        const result = validateProfileUpdate({
            fullName: "Berk Acar",
            preferredName: "slut mode",
            email: "test@example.com"
        });

        assert.equal(
            result.error,
            "Preferred name contains inappropriate words."
        );
    }
);

runTest(
    "profile update rejects leetspeak inappropriate preferred names",
    () => {
        const result = validateProfileUpdate({
            fullName: "Berk Acar",
            preferredName: "b1tch mode",
            email: "test@example.com"
        });

        assert.equal(
            result.error,
            "Preferred name contains inappropriate words."
        );
    }
);

runTest(
    "password update rejects reused password",
    () => {
        const result = validatePasswordUpdate({
            currentPassword: "CurrentPass1!",
            newPassword: "CurrentPass1!"
        });

        assert.equal(
            result.error,
            "New password must be different from the current password."
        );
    }
);

runTest(
    "password update rejects weak new passwords",
    () => {
        const result = validatePasswordUpdate({
            currentPassword: "CurrentPass1!",
            newPassword: "alllowercase1!"
        });

        assert.equal(
            result.error,
            "New password must contain at least one uppercase letter."
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
                newPassword: "StrongPass1!"
            });

        assert.equal(
            result.error,
            "Verification code must contain 6 digits."
        );
    }
);

runTest(
    "password reset rejects weak new passwords",
    () => {
        const result =
            validatePasswordReset({
                email: "test@example.com",
                code: "123456",
                newPassword: "NoSpecial12"
            });

        assert.equal(
            result.error,
            "New password must contain at least one special character."
        );
    }
);

runTest(
    "name validation helper catches disguised blocked terms",
    () => {
        assert.equal(
            getNameValidationError(
                "S!i.k_t-i/r",
                "Full name"
            ),
            "Full name contains inappropriate words."
        );
    }
);

runTest(
    "name validation helper catches leetspeak blocked terms",
    () => {
        assert.equal(
            getNameValidationError(
                "b1tch rider",
                "Full name"
            ),
            "Full name contains inappropriate words."
        );
    }
);

runTest(
    "mileage state recalculates current mileage from remaining records",
    () => {
        assert.equal(
            calculateVehicleCurrentMileage({
                mileageHistoryReadings: [6000, 6500],
                fuelReadings: [],
                expenseReadings: [],
                serviceReadings: [6400],
                maintenanceReadings: [6400]
            }),
            6500
        );
    }
);

runTest(
    "mileage state rejects backdated entries above current mileage",
    () => {
        assert.equal(
            shouldRejectBackdatedMileageEntry({
                entryDate: "2026-08-03",
                latestEventDate: "2026-08-10",
                currentMileage: 6500,
                nextMileage: 6600
            }),
            true
        );
    }
);

runTest(
    "password validation helper accepts strong passwords",
    () => {
        assert.equal(
            getPasswordValidationError("StrongPass1!"),
            null
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
