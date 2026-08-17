const assert = require("node:assert/strict");

const {
    getNameValidationError,
    getPasswordValidationError,
    validateRegistration,
    validateProfileUpdate,
    validatePasswordUpdate,
    validateDeleteAccount,
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
const {
    createVehicleShareToken,
    verifyVehicleShareToken
} = require("../src/utils/shareTokens");
const {
    extractDocumentSuggestions
} = require("../src/utils/documentExtraction");
const {
    buildGarageAiContext
} = require("../src/utils/garageAiContext");
const {
    formatConversationDatasetRow
} = require("../src/services/aiTrainingService");
const {
    shouldExposePasswordResetCode
} = require("../src/utils/passwordResetDelivery");
const {
    getConfiguredMailProvider,
    getSmtpAuth
} = require("../src/utils/mailer");

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

function withEnv(overrides, testFn) {
    const keys = Object.keys(overrides);
    const previousValues = {};

    keys.forEach((key) => {
        previousValues[key] = process.env[key];

        if (overrides[key] === null) {
            delete process.env[key];
            return;
        }

        process.env[key] = overrides[key];
    });

    try {
        testFn();
    } finally {
        keys.forEach((key) => {
            if (
                previousValues[key] === undefined
            ) {
                delete process.env[key];
                return;
            }

            process.env[key] =
                previousValues[key];
        });
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
    "delete account requires current password",
    () => {
        const result =
            validateDeleteAccount({});

        assert.equal(
            result.error,
            "Current password is required to delete your account."
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
    "password reset code is exposed outside production",
    () => {
        assert.equal(
            shouldExposePasswordResetCode({
                nodeEnv: "development",
                fallbackEnabled: false,
                deliveryFailed: false
            }),
            true
        );
    }
);

runTest(
    "password reset code stays hidden in production when fallback is disabled",
    () => {
        assert.equal(
            shouldExposePasswordResetCode({
                nodeEnv: "production",
                fallbackEnabled: false,
                deliveryFailed: true
            }),
            false
        );
    }
);

runTest(
    "password reset code is exposed in production only when fallback is enabled and delivery fails",
    () => {
        assert.equal(
            shouldExposePasswordResetCode({
                nodeEnv: "production",
                fallbackEnabled: true,
                deliveryFailed: true
            }),
            true
        );
    }
);

runTest(
    "mail provider auto mode prefers resend when configured",
    () => {
        withEnv(
            {
                EMAIL_PROVIDER: "auto",
                EMAIL_FROM:
                    "CarCare <noreply@example.com>",
                RESEND_API_KEY: "re_test",
                SMTP_HOST: "smtp.gmail.com",
                SMTP_PORT: "587",
                SMTP_USER: "user@example.com",
                SMTP_PASS: "secret"
            },
            () => {
                assert.equal(
                    getConfiguredMailProvider(),
                    "resend"
                );
            }
        );
    }
);

runTest(
    "mail provider falls back to smtp when resend is absent",
    () => {
        withEnv(
            {
                EMAIL_PROVIDER: "auto",
                EMAIL_FROM: null,
                RESEND_API_KEY: null,
                SMTP_HOST: "smtp.gmail.com",
                SMTP_PORT: "587",
                SMTP_USER: "user@example.com",
                SMTP_PASS: "secret"
            },
            () => {
                assert.equal(
                    getConfiguredMailProvider(),
                    "smtp"
                );
            }
        );
    }
);

runTest(
    "gmail app password is normalized for smtp auth",
    () => {
        withEnv(
            {
                SMTP_HOST: "smtp.gmail.com",
                SMTP_USER: "user@example.com",
                SMTP_PASS:
                    "\"abcd efgh ijkl mnop\""
            },
            () => {
                assert.deepEqual(
                    getSmtpAuth(),
                    {
                        user: "user@example.com",
                        pass: "abcdefghijklmnop"
                    }
                );
            }
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

runTest(
    "vehicle share tokens round-trip correctly",
    () => {
        const token =
            createVehicleShareToken(42);
        const verification =
            verifyVehicleShareToken(token);

        assert.deepEqual(verification, {
            vehicleId: 42
        });
    }
);

runTest(
    "document extraction infers key document fields",
    () => {
        const result =
            extractDocumentSuggestions({
                ocrText:
                    "TRAFIK SIGORTA POLICE NO AXA-998877\nBaslangic 10.08.2026\nBitis 10.08.2027\n34 ABC 123",
                fileName: "traffic-policy.pdf",
                documentType: "insurance"
            });

        assert.equal(
            result.suggestions.documentType,
            "insurance"
        );
        assert.equal(
            result.suggestions.documentNumber,
            "AXA-998877"
        );
        assert.equal(
            result.suggestions.startDate,
            "2026-08-10"
        );
        assert.equal(
            result.suggestions.expiryDate,
            "2027-08-10"
        );
        assert.equal(
            result.suggestions.licensePlate,
            "34 ABC 123"
        );
    }
);

runTest(
    "garage AI context summarizes active garage pressure",
    () => {
        const context =
            buildGarageAiContext({
                vehicles: [{
                    id: 7,
                    brand: "BMW",
                    model: "420",
                    nickname: "Coupe",
                    current_mileage: 68000,
                    ownership_status: "verified"
                }],
                maintenancePlans: [{
                    id: 11,
                    vehicle_id: 7,
                    name: "Oil service",
                    status: "overdue"
                }],
                serviceHistory: [{
                    vehicle_id: 7,
                    service_name: "Brake service",
                    completed_at: "2026-06-10",
                    actual_cost: 4800
                }],
                issues: [{
                    vehicle_id: 7,
                    issue_title: "Brake vibration",
                    risk_level: "red",
                    status: "open"
                }],
                documents: [{
                    vehicle_id: 7,
                    title: "Insurance",
                    renewal_status: "due_soon"
                }],
                expenses: [{
                    vehicle_id: 7,
                    amount: 1500
                }],
                fuelEntries: [{
                    vehicle_id: 7,
                    total_cost: 3200
                }],
                costSummary: {
                    totalFuelCost: 3200,
                    totalExpenseCost: 1500,
                    totalServiceCost: 4800,
                    totalOwnershipCost: 9500
                }
            });

        assert.equal(
            context.overview.activeVehicleCount,
            1
        );
        assert.equal(
            context.overview.overdueMaintenanceCount,
            1
        );
        assert.equal(
            context.vehicles[0].mechanical.urgentIssueCount,
            1
        );
        assert.equal(
            context.vehicles[0].costs.ownershipTotal,
            9500
        );
    }
);

runTest(
    "AI dataset row formatter keeps question, answer and feedback metadata",
    () => {
        const row = JSON.parse(
            formatConversationDatasetRow({
                id: 9,
                user_id: 3,
                question:
                    "What should I prioritize?",
                reply:
                    "Handle the overdue oil service first.",
                garage_context: {
                    overview: {
                        overdueMaintenanceCount: 1
                    }
                },
                model_name: "gpt-5.6-terra",
                feedback_status: "helpful",
                feedback_note:
                    "Clear and actionable.",
                helpfulness_score: 1,
                created_at:
                    "2026-08-10T12:00:00.000Z"
            })
        );

        assert.equal(
            row.messages[1].content,
            "What should I prioritize?"
        );
        assert.equal(
            row.messages[2].content,
            "Handle the overdue oil service first."
        );
        assert.equal(
            row.metadata.feedbackStatus,
            "helpful"
        );
        assert.equal(
            row.metadata.helpfulnessScore,
            1
        );
    }
);

if (process.exitCode) {
    process.exit(process.exitCode);
}
