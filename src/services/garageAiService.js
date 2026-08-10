const {
    buildGarageAiContext
} = require("../utils/garageAiContext");

const OPENAI_RESPONSES_URL =
    "https://api.openai.com/v1/responses";

function hasAiConfiguration() {
    return Boolean(process.env.OPENAI_API_KEY);
}

function buildSystemInstructions() {
    return [
        "You are CarCare AI, an automotive ownership copilot inside a garage dashboard.",
        "Use only the supplied garage context.",
        "Do not invent missing repairs, dates, prices, or vehicle facts.",
        "Be practical and concise.",
        "When the data is incomplete, say that clearly.",
        "Prioritize actionability: tell the user what matters now, what can wait, and why.",
        "Do not recommend unsafe driving if urgent issues or expired mandatory documents exist."
    ].join(" ");
}

function buildUserInput({
    message,
    garageContext
}) {
    return [
        `Driver question: ${message}`,
        "",
        "Garage context JSON:",
        JSON.stringify(garageContext)
    ].join("\n");
}

async function requestGarageAiReply({
    message,
    garageContext
}) {
    if (!hasAiConfiguration()) {
        const error = new Error(
            "OPENAI_API_KEY is not configured."
        );
        error.code = "AI_NOT_CONFIGURED";
        throw error;
    }

    const response = await fetch(
        OPENAI_RESPONSES_URL,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
                Authorization:
                    `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model:
                    process.env.OPENAI_MODEL ||
                    "gpt-5.6-terra",
                reasoning: {
                    effort: "low"
                },
                max_output_tokens: 450,
                instructions:
                    buildSystemInstructions(),
                input: buildUserInput({
                    message,
                    garageContext
                })
            })
        }
    );

    const payload = await response
        .json()
        .catch(() => null);

    if (!response.ok) {
        const error = new Error(
            payload?.error?.message ||
            "OpenAI request failed."
        );
        error.code = "AI_REQUEST_FAILED";
        error.status = response.status;
        throw error;
    }

    return {
        reply:
            payload?.output_text ||
            "I could not generate a useful answer from the current garage context.",
        model: payload?.model || null
    };
}

module.exports = {
    buildGarageAiContext,
    hasAiConfiguration,
    requestGarageAiReply
};
