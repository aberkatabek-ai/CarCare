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

const blockedNameTerms = [
    "amcik",
    "ananisikim",
    "anus",
    "bastard",
    "bitch",
    "bok",
    "dick",
    "escort",
    "fuck",
    "fucking",
    "gavat",
    "got",
    "ibnelik",
    "ibne",
    "kahpe",
    "orospucocuk",
    "orospu",
    "penis",
    "pic",
    "piç",
    "porn",
    "pussy",
    "salak",
    "sex",
    "serefsiz",
    "shit",
    "sik",
    "sikis",
    "sikik",
    "siktir",
    "slut",
    "yarak",
    "yarrak"
];

const passwordRequirementsText =
    "Use at least 8 characters, including uppercase, lowercase, a number, and a special character, with no spaces.";

function normalizeModerationText(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/0/g, "o")
        .replace(/1/g, "i")
        .replace(/3/g, "e")
        .replace(/4/g, "a")
        .replace(/5/g, "s")
        .replace(/7/g, "t")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]/g, "");
}

function getNameValidationError(
    value,
    label = "Name"
) {
    const normalizedValue =
        normalizeModerationText(value);

    if (!normalizedValue) {
        return null;
    }

    const hasBlockedTerm =
        blockedNameTerms.some((term) =>
            normalizedValue.includes(
                normalizeModerationText(term)
            )
        );

    if (hasBlockedTerm) {
        return `${label} contains inappropriate words.`;
    }

    return null;
}

function getPasswordValidationError(
    password,
    label = "Password"
) {
    if (password.length < 8) {
        return `${label} must contain at least 8 characters.`;
    }

    if (/\s/.test(password)) {
        return `${label} cannot contain spaces.`;
    }

    if (!/[A-Z]/.test(password)) {
        return `${label} must contain at least one uppercase letter.`;
    }

    if (!/[a-z]/.test(password)) {
        return `${label} must contain at least one lowercase letter.`;
    }

    if (!/\d/.test(password)) {
        return `${label} must contain at least one number.`;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return `${label} must contain at least one special character.`;
    }

    return null;
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

    const fullNameError =
        getNameValidationError(
            fullName,
            "Full name"
        );

    if (fullNameError) {
        return {
            error: fullNameError
        };
    }

    const passwordError =
        getPasswordValidationError(password);

    if (passwordError) {
        return {
            error: passwordError
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

    const fullNameError =
        getNameValidationError(
            fullName,
            "Full name"
        );

    if (fullNameError) {
        return {
            error: fullNameError
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

    if (preferredName !== null) {
        const preferredNameError =
            getNameValidationError(
                preferredName,
                "Preferred name"
            );

        if (preferredNameError) {
            return {
                error: preferredNameError
            };
        }
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

    const passwordError =
        getPasswordValidationError(
            newPassword,
            "New password"
        );

    if (passwordError) {
        return {
            error: passwordError
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

    const passwordError =
        getPasswordValidationError(
            newPassword,
            "New password"
        );

    if (passwordError) {
        return {
            error: passwordError
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
    getNameValidationError,
    passwordRequirementsText,
    getPasswordValidationError,
    normalizeEmail,
    normalizeName,
    validateRegistration,
    validateProfileUpdate,
    validatePasswordUpdate,
    validateForgotPasswordRequest,
    validatePasswordReset
};
