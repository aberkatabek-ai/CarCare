const crypto = require("crypto");
const db = require("../config/db");

const PASSWORD_RESET_CODE_TTL_MINUTES = 10;

let passwordResetTableReady = false;

async function ensurePasswordResetTable() {
    if (passwordResetTableReady) {
        return;
    }

    await db.query(
        `CREATE TABLE IF NOT EXISTS password_reset_codes (
            id BIGSERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            code_hash TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            consumed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`
    );

    await db.query(
        `CREATE INDEX IF NOT EXISTS idx_password_reset_codes_active
         ON password_reset_codes(user_id, email, expires_at)
         WHERE consumed_at IS NULL`
    );

    passwordResetTableReady = true;
}

function generateResetCode() {
    return String(
        crypto.randomInt(0, 1000000)
    ).padStart(6, "0");
}

function hashResetCode(email, code) {
    return crypto
        .createHash("sha256")
        .update(
            `${email}:${code}:${process.env.SHARE_TOKEN_SECRET || process.env.JWT_SECRET || "carcare"}`
        )
        .digest("hex");
}

async function createPasswordResetCode({
    userId,
    email
}) {
    await ensurePasswordResetTable();

    const code = generateResetCode();
    const codeHash = hashResetCode(email, code);

    await db.query(
        `DELETE FROM password_reset_codes
         WHERE user_id = $1
            OR (
                email = $2
                AND consumed_at IS NULL
            )`,
        [userId, email]
    );

    await db.query(
        `INSERT INTO password_reset_codes (
            user_id,
            email,
            code_hash,
            expires_at
        )
        VALUES (
            $1,
            $2,
            $3,
            NOW() + ($4 || ' minutes')::interval
        )`,
        [
            userId,
            email,
            codeHash,
            PASSWORD_RESET_CODE_TTL_MINUTES
        ]
    );

    return {
        code,
        expiresInMinutes:
            PASSWORD_RESET_CODE_TTL_MINUTES
    };
}

async function consumePasswordResetCode({
    email,
    code
}) {
    await ensurePasswordResetTable();

    const codeHash = hashResetCode(email, code);

    const result = await db.query(
        `UPDATE password_reset_codes
         SET consumed_at = NOW()
         WHERE id = (
            SELECT id
            FROM password_reset_codes
            WHERE email = $1
              AND code_hash = $2
              AND consumed_at IS NULL
              AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
         )
         RETURNING user_id`,
        [email, codeHash]
    );

    return result.rows[0] || null;
}

module.exports = {
    PASSWORD_RESET_CODE_TTL_MINUTES,
    createPasswordResetCode,
    consumePasswordResetCode,
    ensurePasswordResetTable
};
