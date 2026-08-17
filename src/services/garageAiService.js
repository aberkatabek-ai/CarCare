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
    return Number.isFinite(number)
        ? number
        : 0;
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

function tokenizeText(text) {
    return normalizeQuestion(text)
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 3);
}

function matchesAnyKeyword(text, keywords) {
    return keywords.some((keyword) =>
        text.includes(keyword)
    );
}

function getVehicleSearchTerms(vehicle) {
    const terms = [];

    [
        vehicle?.name,
        vehicle?.brand,
        vehicle?.model
    ].forEach((value) => {
        tokenizeText(value).forEach((token) =>
            terms.push(token)
        );
    });

    return Array.from(new Set(terms));
}

function isLikelyTurkishQuestion(
    question
) {
    return (
        /[çğıöşü]/iu.test(question) ||
        matchesAnyKeyword(question, [
            "ne",
            "hangi",
            "bakim",
            "bakım",
            "masraf",
            "maliyet",
            "belge",
            "sigorta",
            "muayene",
            "ariza",
            "arıza",
            "risk",
            "oncelik",
            "öncelik",
            "simdi",
            "şimdi"
        ])
    );
}

function getVehicleRiskScore(vehicle) {
    let score = 0;

    score +=
        toNumber(
            vehicle.mechanical
                ?.urgentIssueCount
        ) * 12;
    score +=
        toNumber(
            vehicle.documents?.expiredCount
        ) * 10;
    score +=
        toNumber(
            vehicle.maintenance
                ?.overdueCount
        ) * 8;
    score +=
        toNumber(
            vehicle.mechanical
                ?.monitorIssueCount
        ) * 4;
    score +=
        toNumber(
            vehicle.documents?.dueSoonCount
        ) * 3;
    score +=
        toNumber(
            vehicle.maintenance
                ?.dueSoonCount
        ) * 2;

    return score;
}

function getRiskiestVehicle(
    garageContext
) {
    const vehicles = Array.isArray(
        garageContext.vehicles
    )
        ? garageContext.vehicles
        : [];

    return vehicles
        .slice()
        .sort(
            (firstVehicle, secondVehicle) =>
                getVehicleRiskScore(
                    secondVehicle
                ) -
                getVehicleRiskScore(
                    firstVehicle
                )
        )[0] || null;
}

function selectRelevantVehicles(
    garageContext,
    question
) {
    const vehicles = Array.isArray(
        garageContext.vehicles
    )
        ? garageContext.vehicles
        : [];

    const matchedVehicles = vehicles.filter(
        (vehicle) =>
            getVehicleSearchTerms(vehicle).some(
                (term) =>
                    term &&
                    question.includes(term)
            )
    );

    return matchedVehicles.length > 0
        ? matchedVehicles
        : vehicles;
}

function filterGarageContextToVehicles(
    garageContext,
    selectedVehicles
) {
    if (
        !Array.isArray(selectedVehicles) ||
        selectedVehicles.length === 0
    ) {
        return garageContext;
    }

    const selectedIds = new Set(
        selectedVehicles.map((vehicle) =>
            String(vehicle.id)
        )
    );

    const filteredVehicles = (
        garageContext.vehicles || []
    ).filter((vehicle) =>
        selectedIds.has(String(vehicle.id))
    );

    const urgentItems =
        filteredVehicles.flatMap(
            (vehicle) =>
                Array.isArray(vehicle.topAlerts)
                    ? vehicle.topAlerts.map(
                        (alert) =>
                            `${vehicle.name}: ${alert}`
                    )
                    : []
        );

    const overview =
        filteredVehicles.reduce(
            (summary, vehicle) => {
                summary.activeVehicleCount += 1;
                summary.overdueMaintenanceCount +=
                    toNumber(
                        vehicle.maintenance
                            ?.overdueCount
                    );
                summary.openIssueCount +=
                    toNumber(
                        vehicle.mechanical
                            ?.openIssueCount
                    );
                summary.expiredDocumentCount +=
                    toNumber(
                        vehicle.documents
                            ?.expiredCount
                    );
                summary.totalOwnershipCost +=
                    toNumber(
                        vehicle.costs
                            ?.ownershipTotal
                    );
                summary.totalServiceCost +=
                    toNumber(
                        vehicle.costs
                            ?.serviceTotal
                    );
                summary.totalExpenseCost +=
                    toNumber(
                        vehicle.costs
                            ?.expenseTotal
                    );
                summary.totalFuelCost +=
                    toNumber(
                        vehicle.costs?.fuelTotal
                    );

                return summary;
            },
            {
                activeVehicleCount: 0,
                overdueMaintenanceCount: 0,
                openIssueCount: 0,
                expiredDocumentCount: 0,
                totalOwnershipCost: 0,
                totalServiceCost: 0,
                totalExpenseCost: 0,
                totalFuelCost: 0
            }
        );

    return {
        ...garageContext,
        overview,
        urgentItems,
        vehicles: filteredVehicles
    };
}

function scoreHelpfulExample(
    questionTokens,
    example
) {
    const exampleTokens = new Set(
        tokenizeText(example.question)
    );

    if (
        questionTokens.length === 0 ||
        exampleTokens.size === 0
    ) {
        return 0;
    }

    let overlap = 0;

    questionTokens.forEach((token) => {
        if (exampleTokens.has(token)) {
            overlap += 1;
        }
    });

    return overlap;
}

function selectHelpfulExamples({
    question,
    helpfulExamples
}) {
    if (!Array.isArray(helpfulExamples)) {
        return [];
    }

    const questionTokens =
        tokenizeText(question);

    return helpfulExamples
        .map((example) => ({
            ...example,
            score: scoreHelpfulExample(
                questionTokens,
                example
            )
        }))
        .filter((example) => example.score > 0)
        .sort(
            (firstExample, secondExample) =>
                secondExample.score -
                firstExample.score
        )
        .slice(0, 2);
}

function createTranslator(lang) {
    const isTurkish = lang === "tr";

    return {
        nowTitle: isTurkish
            ? "Simdi odaklan"
            : "Focus now",
        monthTitle: isTurkish
            ? "Bu ay planla"
            : "Plan this month",
        laterTitle: isTurkish
            ? "Sonra iyilestir"
            : "Improve later",
        costTitle: isTurkish
            ? "Maliyet gorunumu"
            : "Cost view",
        dataTitle: isTurkish
            ? "Veri eksigi"
            : "Data gaps",
        riskiestLead: isTurkish
            ? "Su an en riskli arac"
            : "The riskiest vehicle right now is",
        noUrgentItems: isTurkish
            ? "Kayitli veriye gore su an kirmizi alarm gerektiren acil bir konu görünmüyor."
            : "There is no recorded red-flag item that needs immediate action right now.",
        needMoreData: isTurkish
            ? "Daha faydali yorum yapmam icin arac, bakim, ariza veya belge verisi eklemen gerekiyor."
            : "Add vehicles, maintenance, issue, or document data first so I can give a useful answer."
    };
}

function prefixSection(title, lines) {
    if (!Array.isArray(lines) || lines.length === 0) {
        return null;
    }

    return `${title}\n- ${lines.join("\n- ")}`;
}

function buildActionBuckets(
    garageContext,
    lang
) {
    const now = [];
    const thisMonth = [];
    const later = [];
    const dataGaps = [];
    const isTurkish = lang === "tr";
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
            now.push(
                isTurkish
                    ? `${vehicle.name}: acil ariza once ele alinmali.`
                    : `${vehicle.name}: urgent issue should be handled first.`
            );
        }

        if (
            vehicle.documents.expiredCount > 0
        ) {
            now.push(
                isTurkish
                    ? `${vehicle.name}: suresi dolmus belgeyi hemen yenile.`
                    : `${vehicle.name}: renew the expired document immediately.`
            );
        }

        if (
            vehicle.maintenance
                .overdueCount > 0
        ) {
            now.push(
                isTurkish
                    ? `${vehicle.name}: gecikmis bakim kalemini daha fazla bekletme.`
                    : `${vehicle.name}: do not delay the overdue maintenance item.`
            );
        }

        if (
            vehicle.documents.dueSoonCount > 0
        ) {
            thisMonth.push(
                isTurkish
                    ? `${vehicle.name}: yaklasan belge yenilemesini bu ay planla.`
                    : `${vehicle.name}: plan the upcoming document renewal this month.`
            );
        }

        if (
            vehicle.maintenance
                .dueSoonCount > 0
        ) {
            thisMonth.push(
                isTurkish
                    ? `${vehicle.name}: yaklasan bakim kalemini randevuya donustur.`
                    : `${vehicle.name}: turn the upcoming maintenance item into a booked appointment.`
            );
        }

        if (
            vehicle.mechanical
                .openIssueCount > 0 &&
            vehicle.mechanical
                .urgentIssueCount === 0
        ) {
            thisMonth.push(
                isTurkish
                    ? `${vehicle.name}: acik mekanik notlari netlestir ve gerekirse kontrol ettir.`
                    : `${vehicle.name}: review the open mechanical notes and inspect them if needed.`
            );
        }

        if (
            vehicle.maintenance.totalPlans ===
            0
        ) {
            later.push(
                isTurkish
                    ? `${vehicle.name}: en az bir bakim plani ekleyerek takibi duzenli hale getir.`
                    : `${vehicle.name}: add at least one maintenance plan for stronger tracking.`
            );
        }

        if (
            vehicle.documents.trackedCount ===
            0
        ) {
            dataGaps.push(
                isTurkish
                    ? `${vehicle.name}: belge takibi bos, bu yüzden hazirlik seviyesi daha az guvenilir.`
                    : `${vehicle.name}: document tracking is empty, so readiness is less reliable.`
            );
        }

        if (!vehicle.recentService) {
            dataGaps.push(
                isTurkish
                    ? `${vehicle.name}: kayitli servis gecmisi yok.`
                    : `${vehicle.name}: no completed service history is recorded.`
            );
        }
    });

    return {
        now: Array.from(
            new Set(now)
        ).slice(0, 3),
        thisMonth: Array.from(
            new Set(thisMonth)
        ).slice(0, 3),
        later: Array.from(
            new Set(later)
        ).slice(0, 2),
        dataGaps: Array.from(
            new Set(dataGaps)
        ).slice(0, 2)
    };
}

function buildLocalizedCostLines(
    garageContext,
    lang
) {
    const vehicles = Array.isArray(
        garageContext.vehicles
    )
        ? garageContext.vehicles
        : [];
    const overview =
        garageContext.overview || {};

    if (lang === "tr") {
        return [
            `Kayitli toplam sahip olma maliyeti ${formatCurrency(overview.totalOwnershipCost)} seviyesinde.`,
            ...vehicles
                .slice()
                .sort(
                    (
                        firstVehicle,
                        secondVehicle
                    ) =>
                        secondVehicle.costs
                            .ownershipTotal -
                        firstVehicle.costs
                            .ownershipTotal
                )
                .slice(0, 2)
                .map(
                    (vehicle) =>
                        `${vehicle.name}: servis ${formatCurrency(vehicle.costs.serviceTotal)}, yakit ${formatCurrency(vehicle.costs.fuelTotal)}, diger ${formatCurrency(vehicle.costs.expenseTotal)}.`
                )
        ];
    }

    return [
        `Tracked ownership cost is ${formatCurrency(overview.totalOwnershipCost)} so far.`,
        ...vehicles
            .slice()
            .sort(
                (
                    firstVehicle,
                    secondVehicle
                ) =>
                    secondVehicle.costs
                        .ownershipTotal -
                    firstVehicle.costs
                        .ownershipTotal
            )
            .slice(0, 2)
            .map(
                (vehicle) =>
                    `${vehicle.name}: service ${formatCurrency(vehicle.costs.serviceTotal)}, fuel ${formatCurrency(vehicle.costs.fuelTotal)}, other ${formatCurrency(vehicle.costs.expenseTotal)}.`
            )
    ];
}

function buildMaintenanceLines(
    garageContext,
    lang
) {
    const vehicles = Array.isArray(
        garageContext.vehicles
    )
        ? garageContext.vehicles
        : [];
    const isTurkish = lang === "tr";

    return vehicles.map((vehicle) => {
        if (
            vehicle.maintenance
                .overdueCount > 0
        ) {
            return isTurkish
                ? `${vehicle.name}: gecikmis bakim sayisi ${vehicle.maintenance.overdueCount}.`
                : `${vehicle.name}: overdue maintenance count is ${vehicle.maintenance.overdueCount}.`;
        }

        if (
            vehicle.maintenance
                .dueSoonCount > 0
        ) {
            return isTurkish
                ? `${vehicle.name}: ${vehicle.maintenance.dueSoonCount} bakim kalemi yaklasiyor.`
                : `${vehicle.name}: ${vehicle.maintenance.dueSoonCount} maintenance item is due soon.`;
        }

        if (
            vehicle.maintenance.totalPlans > 0
        ) {
            return isTurkish
                ? `${vehicle.name}: mevcut bakim plani simdilik kontrol altinda görünüyor.`
                : `${vehicle.name}: the current maintenance schedule looks under control.`;
        }

        return isTurkish
            ? `${vehicle.name}: henuz bir bakim baseline kaydi yok.`
            : `${vehicle.name}: no maintenance baseline is recorded yet.`;
    });
}

function buildDocumentLines(
    garageContext,
    lang
) {
    const vehicles = Array.isArray(
        garageContext.vehicles
    )
        ? garageContext.vehicles
        : [];
    const isTurkish = lang === "tr";

    return vehicles.map((vehicle) => {
        if (
            vehicle.documents.expiredCount > 0
        ) {
            return isTurkish
                ? `${vehicle.name}: ${vehicle.documents.expiredCount} belgenin suresi dolmus, hemen yenilenmeli.`
                : `${vehicle.name}: ${vehicle.documents.expiredCount} document is expired and should be renewed immediately.`;
        }

        if (
            vehicle.documents.dueSoonCount > 0
        ) {
            return isTurkish
                ? `${vehicle.name}: ${vehicle.documents.dueSoonCount} belge yakinda yenileme isteyecek.`
                : `${vehicle.name}: ${vehicle.documents.dueSoonCount} document is due soon.`;
        }

        if (
            vehicle.documents.trackedCount > 0
        ) {
            return isTurkish
                ? `${vehicle.name}: takip edilen belgeler simdilik hazir görünüyor.`
                : `${vehicle.name}: tracked documents currently look ready.`;
        }

        return isTurkish
            ? `${vehicle.name}: belge kaydi bulunmuyor.`
            : `${vehicle.name}: no tracked document records yet.`;
    });
}

function buildIssueLines(
    garageContext,
    lang
) {
    const vehicles = Array.isArray(
        garageContext.vehicles
    )
        ? garageContext.vehicles
        : [];
    const isTurkish = lang === "tr";

    return vehicles.map((vehicle) => {
        if (
            vehicle.mechanical
                .urgentIssueCount > 0
        ) {
            return isTurkish
                ? `${vehicle.name}: acil ariza sayisi ${vehicle.mechanical.urgentIssueCount}, servisi geciktirme.`
                : `${vehicle.name}: urgent issue count is ${vehicle.mechanical.urgentIssueCount}, so avoid delaying workshop time.`;
        }

        if (
            vehicle.mechanical
                .openIssueCount > 0
        ) {
            return isTurkish
                ? `${vehicle.name}: ${vehicle.mechanical.openIssueCount} acik issue izleniyor.`
                : `${vehicle.name}: ${vehicle.mechanical.openIssueCount} open issue is being monitored.`;
        }

        return isTurkish
            ? `${vehicle.name}: kayitli aktif mekanik issue görünmüyor.`
            : `${vehicle.name}: no active mechanical issue is currently recorded.`;
    });
}

function buildOverviewLines(
    garageContext,
    lang
) {
    const overview =
        garageContext.overview || {};

    if (lang === "tr") {
        const lines = [
            `Aktif arac sayisi ${overview.activeVehicleCount || 0}.`,
            `Acik issue: ${overview.openIssueCount || 0}, gecikmis bakim: ${overview.overdueMaintenanceCount || 0}, suresi dolmus belge: ${overview.expiredDocumentCount || 0}.`
        ];

        if (
            Array.isArray(
                garageContext.urgentItems
            ) &&
            garageContext.urgentItems.length > 0
        ) {
            lines.push(
                `En ust alarm: ${garageContext.urgentItems[0]}.`
            );
        }

        return lines;
    }

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
    garageContext,
    helpfulExamples = []
}) {
    const question =
        normalizeQuestion(message);
    const relevantVehicles =
        selectRelevantVehicles(
            garageContext,
            question
        );
    const scopedGarageContext =
        filterGarageContextToVehicles(
            garageContext,
            relevantVehicles
        );
    const lang = isLikelyTurkishQuestion(
        question
    )
        ? "tr"
        : "en";
    const t = createTranslator(lang);
    const sections = [];
    const actionBuckets =
        buildActionBuckets(
            scopedGarageContext,
            lang
        );
    const riskiestVehicle =
        getRiskiestVehicle(
            scopedGarageContext
        );
    const matchedHelpfulExamples =
        selectHelpfulExamples({
            question,
            helpfulExamples
        });

    if (riskiestVehicle) {
        sections.push(
            `${t.riskiestLead} ${riskiestVehicle.name}.`
        );
    }

    if (
        matchesAnyKeyword(question, [
            "oncelik",
            "öncelik",
            "first",
            "priorit",
            "now",
            "simdi",
            "şimdi"
        ])
    ) {
        sections.push(
            prefixSection(
                t.nowTitle,
                actionBuckets.now.length > 0
                    ? actionBuckets.now
                    : [t.noUrgentItems]
            )
        );
        sections.push(
            prefixSection(
                t.monthTitle,
                actionBuckets.thisMonth
            )
        );
        sections.push(
            prefixSection(
                t.laterTitle,
                actionBuckets.later
            )
        );
    } else if (
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
            prefixSection(
                t.costTitle,
                buildLocalizedCostLines(
                    scopedGarageContext,
                    lang
                )
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
            prefixSection(
                t.nowTitle,
                actionBuckets.now.filter(
                    (line) =>
                        line.includes("bak") ||
                        line.includes(
                            "maintenance"
                        )
                )
            )
        );
        sections.push(
            prefixSection(
                t.monthTitle,
                buildMaintenanceLines(
                    scopedGarageContext,
                    lang
                )
            )
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
            prefixSection(
                t.nowTitle,
                actionBuckets.now.filter(
                    (line) =>
                        line.includes("belge") ||
                        line.includes(
                            "document"
                        )
                )
            )
        );
        sections.push(
            prefixSection(
                t.monthTitle,
                buildDocumentLines(
                    scopedGarageContext,
                    lang
                )
            )
        );
    } else if (
        matchesAnyKeyword(question, [
            "issue",
            "problem",
            "repair",
            "risk",
            "ariza",
            "arıza",
            "sorun",
            "tamir"
        ])
    ) {
        sections.push(
            prefixSection(
                t.nowTitle,
                actionBuckets.now.filter(
                    (line) =>
                        line.includes("ariza") ||
                        line.includes(
                            "issue"
                        ) ||
                        line.includes(
                            "workshop"
                        ) ||
                        line.includes(
                            "mekanik"
                        )
                )
            )
        );
        sections.push(
            prefixSection(
                t.monthTitle,
                buildIssueLines(
                    scopedGarageContext,
                    lang
                )
            )
        );
    } else if (
        matchesAnyKeyword(question, [
            "hangi arac",
            "hangi araç",
            "which vehicle",
            "riskiest",
            "riskli arac",
            "riskli araç"
        ])
    ) {
        sections.push(
            prefixSection(
                t.nowTitle,
                actionBuckets.now.length > 0
                    ? actionBuckets.now
                    : [t.noUrgentItems]
            )
        );
        sections.push(
            prefixSection(
                t.monthTitle,
                actionBuckets.thisMonth
            )
        );
    } else {
        sections.push(
            prefixSection(
                t.nowTitle,
                actionBuckets.now.length > 0
                    ? actionBuckets.now
                    : [t.noUrgentItems]
            )
        );
        sections.push(
            prefixSection(
                t.monthTitle,
                actionBuckets.thisMonth.length >
                    0
                    ? actionBuckets.thisMonth
                    : buildOverviewLines(
                        scopedGarageContext,
                        lang
                    )
            )
        );
        sections.push(
            prefixSection(
                t.costTitle,
                buildLocalizedCostLines(
                    scopedGarageContext,
                    lang
                ).slice(0, 3)
            )
        );
        sections.push(
            prefixSection(
                t.laterTitle,
                actionBuckets.later
            )
        );
    }

    sections.push(
        prefixSection(
            t.dataTitle,
            actionBuckets.dataGaps
        )
    );

    if (matchedHelpfulExamples.length > 0) {
        sections.push(
            prefixSection(
                lang === "tr"
                    ? "Daha once ise yarayan cevaplardan not"
                    : "Useful note from previous helpful replies",
                matchedHelpfulExamples.map(
                    (example) =>
                        example.reply
                            .split("\n")[0]
                            .slice(0, 220)
                )
            )
        );
    }

    const filteredSections =
        sections.filter(Boolean);

    if (filteredSections.length === 0) {
        return t.needMoreData;
    }

    return filteredSections.join("\n\n");
}

async function requestGarageAiReply({
    message,
    garageContext,
    helpfulExamples = []
}) {
    if (!hasAiConfiguration()) {
        return {
            reply: buildLocalGarageReply({
                message,
                garageContext,
                helpfulExamples
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
                    garageContext,
                    helpfulExamples
                }),
            model: payload?.model || null
        };
    } catch (_error) {
        return {
            reply: buildLocalGarageReply({
                message,
                garageContext,
                helpfulExamples
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
