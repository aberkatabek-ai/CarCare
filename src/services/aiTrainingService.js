const db = require("../config/db");

let aiConversationTableReady = false;

async function ensureAiConversationTable() {
    if (aiConversationTableReady) {
        return;
    }

    await db.query(
        `CREATE TABLE IF NOT EXISTS ai_conversations (
            id BIGSERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            question TEXT NOT NULL,
            reply TEXT NOT NULL,
            garage_context JSONB NOT NULL,
            model_name VARCHAR(120),
            feedback_status VARCHAR(20) NOT NULL DEFAULT 'unrated',
            feedback_note TEXT,
            helpfulness_score SMALLINT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            feedback_updated_at TIMESTAMPTZ
        )`
    );

    await db.query(
        `ALTER TABLE ai_conversations
         DROP CONSTRAINT IF EXISTS chk_ai_conversations_feedback_status`
    );

    await db.query(
        `ALTER TABLE ai_conversations
         ADD CONSTRAINT chk_ai_conversations_feedback_status
         CHECK (
            feedback_status IN (
                'unrated',
                'helpful',
                'not_helpful'
            )
         )`
    );

    await db.query(
        `CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_created_at
         ON ai_conversations(user_id, created_at DESC)`
    );

    await db.query(
        `CREATE INDEX IF NOT EXISTS idx_ai_conversations_feedback_status
         ON ai_conversations(feedback_status, created_at DESC)`
    );

    aiConversationTableReady = true;
}

async function recordAiConversation({
    userId,
    question,
    reply,
    garageContext,
    model
}) {
    await ensureAiConversationTable();

    const result = await db.query(
        `INSERT INTO ai_conversations (
            user_id,
            question,
            reply,
            garage_context,
            model_name
         )
         VALUES ($1, $2, $3, $4::JSONB, $5)
         RETURNING
            id,
            user_id,
            question,
            reply,
            garage_context,
            model_name,
            feedback_status,
            feedback_note,
            helpfulness_score,
            created_at,
            feedback_updated_at`,
        [
            userId,
            question,
            reply,
            JSON.stringify(garageContext),
            model || null
        ]
    );

    return result.rows[0];
}

async function updateAiConversationFeedback({
    conversationId,
    userId,
    feedbackStatus,
    feedbackNote
}) {
    await ensureAiConversationTable();

    const helpfulnessScore =
        feedbackStatus === "helpful"
            ? 1
            : feedbackStatus === "not_helpful"
                ? -1
                : 0;

    const result = await db.query(
        `UPDATE ai_conversations
         SET
            feedback_status = $1,
            feedback_note = $2,
            helpfulness_score = $3,
            feedback_updated_at = NOW()
         WHERE id = $4
           AND user_id = $5
         RETURNING
            id,
            feedback_status,
            feedback_note,
            helpfulness_score,
            feedback_updated_at`,
        [
            feedbackStatus,
            feedbackNote,
            helpfulnessScore,
            conversationId,
            userId
        ]
    );

    return result.rows[0] || null;
}

async function getAiConversationHistory(userId) {
    await ensureAiConversationTable();

    const result = await db.query(
        `SELECT
            id,
            question,
            reply,
            model_name,
            feedback_status,
            feedback_note,
            helpfulness_score,
            created_at,
            feedback_updated_at
         FROM ai_conversations
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId]
    );

    return result.rows;
}

async function getHelpfulAiExamples(
    userId,
    limit = 12
) {
    await ensureAiConversationTable();

    const safeLimit = Math.max(
        1,
        Math.min(Number(limit) || 12, 30)
    );

    const result = await db.query(
        `SELECT
            id,
            question,
            reply,
            feedback_note,
            helpfulness_score,
            created_at
         FROM ai_conversations
         WHERE user_id = $1
           AND feedback_status = 'helpful'
         ORDER BY feedback_updated_at DESC NULLS LAST,
                  created_at DESC
         LIMIT $2`,
        [userId, safeLimit]
    );

    return result.rows;
}

function formatConversationDatasetRow(row) {
    return JSON.stringify({
        messages: [{
            role: "system",
            content:
                "You are CarCare AI, an automotive ownership copilot."
        }, {
            role: "user",
            content: row.question
        }, {
            role: "assistant",
            content: row.reply
        }],
        metadata: {
            conversationId: row.id,
            userId: row.user_id,
            model: row.model_name,
            feedbackStatus:
                row.feedback_status,
            feedbackNote:
                row.feedback_note,
            helpfulnessScore:
                row.helpfulness_score,
            createdAt: row.created_at,
            garageContext:
                row.garage_context
        }
    });
}

async function getAiConversationExportRows({
    userId,
    feedbackStatus
}) {
    await ensureAiConversationTable();

    const values = [userId];
    let feedbackCondition = "";

    if (
        feedbackStatus &&
        feedbackStatus !== "all"
    ) {
        values.push(feedbackStatus);
        feedbackCondition =
            `AND feedback_status = $2`;
    }

    const result = await db.query(
        `SELECT
            id,
            user_id,
            question,
            reply,
            garage_context,
            model_name,
            feedback_status,
            feedback_note,
            helpfulness_score,
            created_at
         FROM ai_conversations
         WHERE user_id = $1
         ${feedbackCondition}
         ORDER BY created_at DESC`,
        values
    );

    return result.rows;
}

module.exports = {
    ensureAiConversationTable,
    recordAiConversation,
    updateAiConversationFeedback,
    getAiConversationHistory,
    getHelpfulAiExamples,
    formatConversationDatasetRow,
    getAiConversationExportRows
};
