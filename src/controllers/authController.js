const bcrypt = require("bcrypt");
const db = require("../config/db");
const {
    normalizeEmail,
    normalizeName,
    validateProfileUpdate,
    validatePasswordUpdate,
    validateForgotPasswordRequest,
    validatePasswordReset
} = require("../utils/profileValidation");
const {
    createPasswordResetCode,
    consumePasswordResetCode
} = require("../utils/passwordReset");
const {
    sendPasswordResetCode,
    hasSmtpConfiguration
} = require("../utils/mailer");

let preferredNameColumnState = null;
let remindersEnabledColumnState = null;

async function hasPreferredNameColumn() {
    if (preferredNameColumnState !== null) {
        return preferredNameColumnState;
    }

    const result = await db.query(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
              AND column_name = 'preferred_name'
        ) AS has_preferred_name`
    );

    preferredNameColumnState = Boolean(
        result.rows[0]?.has_preferred_name
    );

    return preferredNameColumnState;
}

async function hasRemindersEnabledColumn() {
    if (remindersEnabledColumnState !== null) {
        return remindersEnabledColumnState;
    }

    const result = await db.query(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
              AND column_name = 'reminders_enabled'
        ) AS has_reminders_enabled`
    );

    remindersEnabledColumnState = Boolean(
        result.rows[0]?.has_reminders_enabled
    );

    return remindersEnabledColumnState;
}

async function getUserById(userId) {
    const includePreferredName =
        await hasPreferredNameColumn();
    const includeRemindersEnabled =
        await hasRemindersEnabledColumn();

    const result = await db.query(
        includePreferredName &&
        includeRemindersEnabled
            ? `SELECT
                id,
                full_name,
                preferred_name,
                email,
                reminders_enabled,
                created_at
               FROM users
               WHERE id = $1`
            : includePreferredName
                ? `SELECT
                id,
                full_name,
                preferred_name,
                email,
                TRUE AS reminders_enabled,
                created_at
               FROM users
               WHERE id = $1`
                : includeRemindersEnabled
                    ? `SELECT
                id,
                full_name,
                NULL AS preferred_name,
                email,
                reminders_enabled,
                created_at
               FROM users
               WHERE id = $1`
            : `SELECT
                id,
                full_name,
                NULL AS preferred_name,
                email,
                TRUE AS reminders_enabled,
                created_at
               FROM users
               WHERE id = $1`,
        [userId]
    );

    return result.rows[0] || null;
}

function createUserSession(req, userId) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => {
            if (error) {
                return reject(error);
            }

            req.session.userId = userId;

            req.session.save((saveError) => {
                if (saveError) {
                    return reject(saveError);
                }

                resolve();
            });
        });
    });
}

async function register(req, res, next) {
    try {
        const { fullName, email, password } = req.body;

        const normalizedName =
            normalizeName(fullName);

        const normalizedEmail =
            normalizeEmail(email);

        if (!normalizedName || !normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });
        }

        const validEmail =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

        if (!validEmail) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        const existingUser = await db.query(
            "SELECT id FROM users WHERE email = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account already exists with this email."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await db.query(
            `INSERT INTO users (
                full_name,
                email,
                password_hash
            )
            VALUES ($1, $2, $3)
            RETURNING id, full_name, email, created_at`,
            [normalizedName, normalizedEmail, passwordHash]
        );

        const user = result.rows[0];

        await createUserSession(req, user.id);

        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            user
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "An account already exists with this email."
            });
        }

        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        const normalizedEmail =
            normalizeEmail(email);

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const result = await db.query(
            `SELECT
                id,
                full_name,
                email,
                password_hash,
                created_at
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Email or password is incorrect."
            });
        }

        const user = result.rows[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Email or password is incorrect."
            });
        }

        await createUserSession(req, user.id);

        res.json({
            success: true,
            message: "Login successful.",
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        next(error);
    }
}

async function logout(req, res, next) {
    try {
        req.session.destroy((error) => {
            if (error) {
                return next(error);
            }

            res.clearCookie("carcare.sid");

            res.json({
                success: true,
                message: "Logout successful."
            });
        });
    } catch (error) {
        next(error);
    }
}

async function getCurrentUser(req, res, next) {
    try {
        const user = await getUserById(
            req.session.userId
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User was not found."
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
}

async function updateProfile(req, res, next) {
    try {
        const validation =
            validateProfileUpdate(req.body);

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const profileData = validation.value;

        const existingUser = await db.query(
            `SELECT id
             FROM users
             WHERE email = $1
               AND id <> $2`,
            [
                profileData.email,
                req.session.userId
            ]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Another account already uses this email address."
            });
        }

        const result = await db.query(
            await hasPreferredNameColumn()
                ? `UPDATE users
                   SET
                      full_name = $1,
                      preferred_name = $2,
                      email = $3
                   WHERE id = $4`
                : `UPDATE users
                   SET
                      full_name = $1,
                      email = $2
                   WHERE id = $3`,
            await hasPreferredNameColumn()
                ? [
                    profileData.fullName,
                    profileData.preferredName,
                    profileData.email,
                    req.session.userId
                ]
                : [
                    profileData.fullName,
                    profileData.email,
                    req.session.userId
                ]
        );

        const user = await getUserById(
            req.session.userId
        );

        res.json({
            success: true,
            message:
                "Profile settings updated successfully.",
            user
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message:
                    "Another account already uses this email address."
            });
        }

        next(error);
    }
}

async function updatePassword(req, res, next) {
    try {
        const validation =
            validatePasswordUpdate(req.body);

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const passwordData = validation.value;

        const result = await db.query(
            `SELECT id, password_hash
             FROM users
             WHERE id = $1`,
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User was not found."
            });
        }

        const user = result.rows[0];

        const passwordMatches =
            await bcrypt.compare(
                passwordData.currentPassword,
                user.password_hash
            );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message:
                    "Current password is incorrect."
            });
        }

        const passwordHash =
            await bcrypt.hash(
                passwordData.newPassword,
                12
            );

        await db.query(
            `UPDATE users
             SET password_hash = $1
             WHERE id = $2`,
            [
                passwordHash,
                req.session.userId
            ]
        );

        res.json({
            success: true,
            message:
                "Password updated successfully."
        });
    } catch (error) {
        next(error);
    }
}

async function updateReminderSettings(
    req,
    res,
    next
) {
    try {
        const remindersEnabled =
            req.body.remindersEnabled;

        if (
            typeof remindersEnabled !== "boolean"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reminder preference must be true or false."
            });
        }

        if (
            !(
                await hasRemindersEnabledColumn()
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reminder settings are not available yet. Apply the latest database schema first."
            });
        }

        await db.query(
            `UPDATE users
             SET reminders_enabled = $1
             WHERE id = $2`,
            [
                remindersEnabled,
                req.session.userId
            ]
        );

        const user = await getUserById(
            req.session.userId
        );

        res.json({
            success: true,
            message:
                remindersEnabled
                    ? "Email reminders enabled."
                    : "Email reminders paused.",
            user
        });
    } catch (error) {
        next(error);
    }
}

async function requestPasswordReset(
    req,
    res,
    next
) {
    try {
        const validation =
            validateForgotPasswordRequest(req.body);

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const { email } = validation.value;

        const result = await db.query(
            `SELECT id, full_name, email
             FROM users
             WHERE email = $1`,
            [email]
        );

        const user = result.rows[0] || null;
        let debugCode = undefined;

        if (user) {
            const resetCode =
                await createPasswordResetCode({
                    userId: user.id,
                    email: user.email
                });

            const deliveryResult =
                await sendPasswordResetCode({
                to: user.email,
                fullName: user.full_name,
                code: resetCode.code,
                expiresInMinutes:
                    resetCode.expiresInMinutes
                });

            if (
                process.env.NODE_ENV !==
                    "production" &&
                deliveryResult.fallback
            ) {
                debugCode = resetCode.code;
            }
        }

        res.json({
            success: true,
            message:
                "If that email exists, a verification code has been sent.",
            ...(debugCode
                ? {
                    debugCode
                }
                : {})
        });
    } catch (error) {
        next(error);
    }
}

async function resetPassword(
    req,
    res,
    next
) {
    try {
        const validation =
            validatePasswordReset(req.body);

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const passwordResetData =
            validation.value;

        const consumedCode =
            await consumePasswordResetCode({
                email: passwordResetData.email,
                code: passwordResetData.code
            });

        if (!consumedCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Verification code is invalid or expired."
            });
        }

        const passwordHash =
            await bcrypt.hash(
                passwordResetData.newPassword,
                12
            );

        await db.query(
            `UPDATE users
             SET password_hash = $1
             WHERE id = $2`,
            [
                passwordHash,
                consumedCode.user_id
            ]
        );

        res.json({
            success: true,
            message:
                "Password has been reset successfully."
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile,
    updatePassword,
    updateReminderSettings,
    requestPasswordReset,
    resetPassword
};
