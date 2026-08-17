const {
    buildGarageAiContext
} = require("../utils/garageAiContext");

const OPENAI_RESPONSES_URL =
    "https://api.openai.com/v1/responses";
const LOCAL_AI_MODEL = "carcare-local-rules";

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

function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
    return `${Math.round(
        toNumber(value)
    ).toLocaleString("en-US")} TL`;
}

function normalizeQuestion(question) {
    return String(question || "")
        .trim()
        .toLowerCase();
}

function matchesAnyKeyword(text, keywords) {
    return keywords.some((keyword) =>
        text.includes(keyword)
    );
}

function buildPriorityLines(garageContext) {
    const lines = [];
    const vehicles = Array.isArray(
        garageContext.vehicles
    )
        ? garageContext.vehicles
        : [];

    vehicles.forEach((vehicle) => {
        if (
            vehicle.mechanical
                .urgentIssueCount > 0
        ) {
            lines.push(
                `${vehicle.name}: ${vehicle.mechanical.urgentIssueCount} urgent issue should be handled first.`
            );
        }

        if (
            vehicle.maintenance
                .overdueCount > 0
        ) {
            lines.push(
                `${vehicle.name}: ${vehicle.maintenance.overdueCount} maintenance item is overdue.`
            );
        }

        if (
            vehicle.documents.expiredCount >
            0
        ) {
            lines.push(
                `${vehicle.name}: ${vehicle.documents.expiredCount} document is already expired.`
            );
        }
    });

    return lines;
}

function buildCostLines(garageContext) {
    const lines = [];
    const vehicles = Array.isArray(
        garageContext.vehicles
    )
        ? garageContext.vehicles
        : [];
    const overview =
        garageContext.overview || {};

    lines.push(
        `Tracked ownership cost is ${formatCurrency(overview.totalOwnershipCost)} so far.`
    );

    vehicles
        .slice()
        .sort(
            (firstVehicle, secondVehicle) =>
                secondVehicle.costs
                    .ownershipTotal -
                firstVehicle.costs
                    .ownershipTotal
        )
        .slice(0, 2)
        .forEach((vehicle) => {
            lines.push(
                `${vehicle.name}: service ${formatCurrency(vehicle.costs.serviceTotal)}, fuel ${formatCurrency(vehicle.costs.fuelTotal)}, other ${formatCurrency(vehicle.costs.expenseTotal)}.`
            );
        });

    return lines;
}

function buildMaintenanceLines(
    garageContext
) {
    const vehicles = Array.isArray(
        garageContext.vehicles
    )
        ? garageContext.vehicles
        : [];
    const lines = [];

    vehicles.forEach((vehicle) => {
        if (
            vehicle.maintenance
                .overdueCount > 0
        ) {
            lines.push(
                `${vehicle.name}: overdue maintenance count is ${vehicle.maintenance.overdueCount}.`
            );
        } else if (
            vehicle.maintenance
                .dueSoonCount > 0
        ) {
            lines.push(
                `${vehicle.name}: ${vehicle.maintenance.dueSoonCount} maintenance item is due soon.`
            );
        } else if (
            vehicle.maintenance.totalPlans >
            0
        ) {
            lines.push(
                `${vehicle.name}: current maintenance schedule looks under control.`
            );
        } else {
            lines.push(
                `${vehicle.name}: no maintenance baseline is recorded yet.`
            );
        }
    });

    return lines;
}

function buildDocumentLines(
    garageContext
) {
    const vehicles = Array.isArray(
        garageContext.vehicles
    )
        ? garageContext.vehicles
        : [];
    const lines = [];

    vehicles.forEach((vehicle) => {
        if (
            vehicle.documents.expiredCount > 0
        ) {
            lines.push(
                `${vehicle.name}: ${vehicle.documents.expiredCount} document is expired and should be renewed immediately.`
            );
            return;
        }

        if (
            vehicle.documents.dueSoonCount > 0
        ) {
            lines.push(
                `${vehicle.name}: ${vehicle.documents.dueSoonCount} document is due soon.`
            );
            return;
        }

        if (
            vehicle.documents.trackedCount > 0
        ) {
            lines.push(
                `${vehicle.name}: tracked documents currently look ready.`
            );
        } else {
            lines.push(
                `${vehicle.name}: no tracked document records yet.`
            );
        }
    });

    return lines;
}

function buildIssueLines(garageContext) {
    const vehicles = Array.isArray(
        garageContext.vehicles
    )
        ? garageContext.vehicles
        : [];
    const lines = [];

    vehicles.forEach((vehicle) => {
        if (
            vehicle.mechanical
                .urgentIssueCount > 0
        ) {
            lines.push(
                `${vehicle.name}: urgent issue count is ${vehicle.mechanical.urgentIssueCount}, so avoid delaying workshop time.`
            );
        } else if (
            vehicle.mechanical
                .openIssueCount > 0
        ) {
            lines.push(
                `${vehicle.name}: ${vehicle.mechanical.openIssueCount} open issue is being monitored.`
            );
        } else {
            lines.push(
                `${vehicle.name}: no active mechanical issue is currently recorded.`
            );
        }
    });

    return lines;
}

function buildOverviewLines(
    garageContext
) {
    const overview =
        garageContext.overview || {};
    const lines = [
        `You currently have ${overview.activeVehicleCount || 0} active vehicle${overview.activeVehicleCount === 1 ? "" : "s"}.`,
        `Open issues: ${overview.openIssueCount || 0}, overdue maintenance items: ${overview.overdueMaintenanceCount || 0}, expired documents: ${overview.expiredDocumentCount || 0}.`
    ];

    if (
        Array.isArray(
            garageContext.urgentItems
        ) &&
        garageContext.urgentItems.length > 0
    ) {
        lines.push(
            `Top alert: ${garageContext.urgentItems[0]}.`
        );
    }

    return lines;
}

function buildLocalGarageReply({
    message,
    garageContext
}) {
    const question =
        normalizeQuestion(message);
    const sections = [];
    const priorityLines =
        buildPriorityLines(garageContext);

    if (priorityLines.length > 0) {
        sections.push(
            `Priority now: ${priorityLines
                .slice(0, 2)
                .join(" ")}`
        );
    }

    if (
        matchesAnyKeyword(question, [
            "cost",
            "spend",
            "budget",
            "expense",
            "fuel",
            "money",
            "masraf",
            "maliyet"
        ])
    ) {
        sections.push(
            buildCostLines(garageContext).join(
                " "
            )
        );
    } else if (
        matchesAnyKeyword(question, [
            "maint",
            "service",
            "oil",
            "bak",
            "periy"
        ])
    ) {
        sections.push(
            buildMaintenanceLines(
                garageContext
            ).join(" ")
        );
    } else if (
        matchesAnyKeyword(question, [
            "document",
            "insurance",
            "inspection",
            "muayene",
            "sigorta",
            "belge"
        ])
    ) {
        sections.push(
            buildDocumentLines(
                garageContext
            ).join(" ")
        );
    } else if (
        matchesAnyKeyword(question, [
            "issue",
            "problem",
            "repair",
            "risk",
            "arıza",
            "sorun",
            "tamir"
        ])
    ) {
        sections.push(
            buildIssueLines(garageContext).join(
                " "
            )
        );
    } else {
        sections.push(
            buildOverviewLines(
                garageContext
            ).join(" ")
        );
        sections.push(
            buildMaintenanceLines(
                garageContext
            )
                .slice(0, 2)
                .join(" ")
        );
        sections.push(
            buildCostLines(garageContext)
                .slice(0, 2)
                .join(" ")
        );
    }

    const filteredSections =
        sections.filter(Boolean);

    if (filteredSections.length === 0) {
        return "I need more garage data before I can say anything useful. Add vehicles, maintenance plans, issues, or documents first.";
    }

    return filteredSections.join("\n\n");
}

async function requestGarageAiReply({
    message,
    garageContext
}) {
    if (!hasAiConfiguration()) {
        return {
            reply: buildLocalGarageReply({
                message,
                garageContext
            }),
            model: LOCAL_AI_MODEL
        };
    }

    try {
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
                buildLocalGarageReply({
                    message,
                    garageContext
                }),
            model: payload?.model || null
        };
    } catch (_error) {
        return {
            reply: buildLocalGarageReply({
                message,
                garageContext
            }),
            model: LOCAL_AI_MODEL
        };
    }
}

module.exports = {
    buildLocalGarageReply,
    buildGarageAiContext,
    hasAiConfiguration,
    requestGarageAiReply
};
