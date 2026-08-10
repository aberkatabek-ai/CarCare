const test = require("node:test");
const assert = require("node:assert/strict");

const {
    getNameValidationError,
    validateRegistration,
    validateProfileUpdate,
    validatePasswordReset,
    validatePasswordUpdate
} = require("../src/utils/profileValidation");

test("validateRegistration rejects inappropriate full names", () => {
    const result = validateRegistration({
        fullName: "Fuck Tester",
        email: "test@example.com",
        password: "StrongPass1!"
    });

    assert.equal(
        result.error,
        "Full name contains inappropriate words."
    );
});

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

test("validateProfileUpdate rejects inappropriate preferred names", () => {
    const result = validateProfileUpdate({
        fullName: "Berk Acar",
        preferredName: "slut mode",
        email: "test@example.com"
    });

    assert.equal(
        result.error,
        "Preferred name contains inappropriate words."
    );
});

test("validateProfileUpdate rejects leetspeak inappropriate preferred names", () => {
    const result = validateProfileUpdate({
        fullName: "Berk Acar",
        preferredName: "b1tch mode",
        email: "test@example.com"
    });

    assert.equal(
        result.error,
        "Preferred name contains inappropriate words."
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

test("getNameValidationError catches disguised blocked terms", () => {
    assert.equal(
        getNameValidationError(
            "S!i.k_t-i/r",
            "Full name"
        ),
        "Full name contains inappropriate words."
    );
});

test("getNameValidationError catches leetspeak blocked terms", () => {
    assert.equal(
        getNameValidationError(
            "b1tch rider",
            "Full name"
        ),
        "Full name contains inappropriate words."
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
