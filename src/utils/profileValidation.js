function normalizeName(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function normalizeEmail(value) {
    return typeof value === "string"
        ? value.trim().toLowerCase()
        : "";
}

function validateRegistration(data) {
    const fullName = normalizeName(
        data.fullName
    );
    const email = normalizeEmail(data.email);
    const password =
        typeof data.password === "string"
            ? data.password
            : "";

    if (!fullName || !email || !password) {
        return {
            error: "Name, email and password are required."
        };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
            error: "Please enter a valid email address."
        };
    }

    if (password.length < 8) {
        return {
            error:
                "Password must contain at least 8 characters."
        };
    }

    return {
        value: {
            fullName,
            email,
            password
        }
    };
}

function validateProfileUpdate(data) {
    const fullName = normalizeName(
        data.fullName
    );

    const preferredName =
        data.preferredName === undefined ||
        data.preferredName === null ||
        data.preferredName === ""
            ? null
            : normalizeName(data.preferredName);

    const email = normalizeEmail(
        data.email
    );

    if (!fullName) {
        return {
            error: "Full name is required."
        };
    }

    if (!email) {
        return {
            error: "Email is required."
        };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
            error: "Please enter a valid email address."
        };
    }

    if (
        preferredName !== null &&
        preferredName.length > 60
    ) {
        return {
            error:
                "Preferred name must be shorter than 60 characters."
        };
    }

    return {
        value: {
            fullName,
            preferredName,
            email
        }
    };
}

function validatePasswordUpdate(data) {
    const currentPassword =
        typeof data.currentPassword ===
        "string"
            ? data.currentPassword
            : "";

    const newPassword =
        typeof data.newPassword === "string"
            ? data.newPassword
            : "";

    if (!currentPassword || !newPassword) {
        return {
            error:
                "Current password and new password are required."
        };
    }

    if (newPassword.length < 8) {
        return {
            error:
                "New password must contain at least 8 characters."
        };
    }

    if (newPassword === currentPassword) {
        return {
            error:
                "New password must be different from the current password."
        };
    }

    return {
        value: {
            currentPassword,
            newPassword
        }
    };
}

function validateForgotPasswordRequest(data) {
    const email = normalizeEmail(data.email);

    if (!email) {
        return {
            error: "Email is required."
        };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
            error: "Please enter a valid email address."
        };
    }

    return {
        value: {
            email
        }
    };
}

function validatePasswordReset(data) {
    const email = normalizeEmail(data.email);
    const code =
        typeof data.code === "string"
            ? data.code.trim()
            : "";
    const newPassword =
        typeof data.newPassword === "string"
            ? data.newPassword
            : "";

    if (!email || !code || !newPassword) {
        return {
            error:
                "Email, verification code and new password are required."
        };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
            error: "Please enter a valid email address."
        };
    }

    if (!/^\d{6}$/.test(code)) {
        return {
            error:
                "Verification code must contain 6 digits."
        };
    }

    if (newPassword.length < 8) {
        return {
            error:
                "New password must contain at least 8 characters."
        };
    }

    return {
        value: {
            email,
            code,
            newPassword
        }
    };
}

module.exports = {
    normalizeEmail,
    normalizeName,
    validateRegistration,
    validateProfileUpdate,
    validatePasswordUpdate,
    validateForgotPasswordRequest,
    validatePasswordReset
};
