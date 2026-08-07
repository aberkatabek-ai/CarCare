const test = require("node:test");
const assert = require("node:assert/strict");

const {
    validateProfileUpdate,
    validatePasswordUpdate
} = require("../src/utils/profileValidation");

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
        currentPassword: "password123",
        newPassword: "password123"
    });

    assert.equal(
        result.error,
        "New password must be different from the current password."
    );
});
