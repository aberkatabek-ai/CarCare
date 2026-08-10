const test = require("node:test");
const assert = require("node:assert/strict");

const {
    validateRegistration,
    validateProfileUpdate,
    validatePasswordReset,
    validatePasswordUpdate
} = require("../src/utils/profileValidation");

test("validateRegistration rejects passwords without uppercase letters", () => {
    const result = validateRegistration({
        fullName: "Berk Acar",
        email: "test@example.com",
        password: "berkacar1!"
    });

    assert.equal(
        result.error,
        "Password must contain at least one uppercase letter."
    );
});

test("validateRegistration accepts strong passwords", () => {
    const result = validateRegistration({
        fullName: "Berk Acar",
        email: "test@example.com",
        password: "StrongPass1!"
    });

    assert.equal(result.error, undefined);
});

test("validateProfileUpdate normalizes and accepts valid data", () => {
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
});

test("validateProfileUpdate rejects invalid email", () => {
    const result = validateProfileUpdate({
        fullName: "Berk",
        email: "invalid"
    });

    assert.equal(
        result.error,
        "Please enter a valid email address."
    );
});

test("validatePasswordUpdate rejects reused password", () => {
    const result = validatePasswordUpdate({
        currentPassword: "CurrentPass1!",
        newPassword: "CurrentPass1!"
    });

    assert.equal(
        result.error,
        "New password must be different from the current password."
    );
});

test("validatePasswordReset rejects passwords without special characters", () => {
    const result = validatePasswordReset({
        email: "test@example.com",
        code: "123456",
        newPassword: "StrongPass12"
    });

    assert.equal(
        result.error,
        "New password must contain at least one special character."
    );
});
