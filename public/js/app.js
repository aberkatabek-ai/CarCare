const userNameElement = document.querySelector(
    "#user-name"
);

const userEmailElement = document.querySelector(
    "#user-email"
);

const logoutButton = document.querySelector(
    "#logout-button"
);

const vehicleForm = document.querySelector(
    "#vehicle-form"
);

const vehicleFormMessage = document.querySelector(
    "#vehicle-form-message"
);

const vehicleList = document.querySelector(
    "#vehicle-list"
);

const vehicleCount = document.querySelector(
    "#vehicle-count"
);

const soldVehicleList = document.querySelector(
    "#sold-vehicle-list"
);

const soldVehicleCount = document.querySelector(
    "#sold-vehicle-count"
);

const mileageDialog = document.querySelector(
    "#mileage-dialog"
);

const mileageForm = document.querySelector(
    "#mileage-form"
);

const mileageVehicleName = document.querySelector(
    "#mileage-vehicle-name"
);

const currentMileageValue = document.querySelector(
    "#current-mileage-value"
);

const newMileageInput = document.querySelector(
    "#new-mileage"
);

const mileageMessage = document.querySelector(
    "#mileage-message"
);

const closeMileageDialogButton =
    document.querySelector(
        "#close-mileage-dialog"
    );

const cancelMileageButton =
    document.querySelector(
        "#cancel-mileage-button"
    );

const vehicleEditDialog =
    document.querySelector(
        "#vehicle-edit-dialog"
    );

const vehicleEditForm =
    document.querySelector(
        "#vehicle-edit-form"
    );

const vehicleEditMessage =
    document.querySelector(
        "#vehicle-edit-message"
    );

const closeVehicleEditDialogButton =
    document.querySelector(
        "#close-vehicle-edit-dialog"
    );

const cancelVehicleEditButton =
    document.querySelector(
        "#cancel-vehicle-edit-button"
    );

const dashboardLastUpdated =
    document.querySelector(
        "#dashboard-last-updated"
    );

const vehicleStatistic =
    document.querySelector(
        "#stat-vehicle-count"
    );

const vehicleStatisticDetail =
    document.querySelector(
        "#stat-vehicle-detail"
    );

const planStatistic =
    document.querySelector(
        "#stat-plan-count"
    );

const planStatisticDetail =
    document.querySelector(
        "#stat-plan-detail"
    );

const attentionStatistic =
    document.querySelector(
        "#stat-attention-count"
    );

const attentionStatisticDetail =
    document.querySelector(
        "#stat-attention-detail"
    );

const serviceCostStatistic =
    document.querySelector(
        "#stat-service-cost"
    );

const serviceStatisticDetail =
    document.querySelector(
        "#stat-service-detail"
    );

const maintenanceOverviewList =
    document.querySelector(
        "#maintenance-overview-list"
    );

const recentServiceList =
    document.querySelector(
        "#recent-service-list"
    );

const mechanicalSignalScore =
    document.querySelector(
        "#mechanical-signal-score"
    );

const mechanicalSignalTone =
    document.querySelector(
        "#mechanical-signal-tone"
    );

const mechanicalSignalSummary =
    document.querySelector(
        "#mechanical-signal-summary"
    );

const maintenanceSignalScore =
    document.querySelector(
        "#maintenance-signal-score"
    );

const maintenanceSignalTone =
    document.querySelector(
        "#maintenance-signal-tone"
    );

const maintenanceSignalSummary =
    document.querySelector(
        "#maintenance-signal-summary"
    );

const documentSignalScore =
    document.querySelector(
        "#document-signal-score"
    );

const documentSignalTone =
    document.querySelector(
        "#document-signal-tone"
    );

const documentSignalSummary =
    document.querySelector(
        "#document-signal-summary"
    );

const garagePriorityList =
    document.querySelector(
        "#garage-priority-list"
    );
const forecast30Total = document.querySelector(
    "#forecast-30-total"
);
const forecast90Total = document.querySelector(
    "#forecast-90-total"
);
const forecast30Summary =
    document.querySelector(
        "#forecast-30-summary"
    );
const forecast90Summary =
    document.querySelector(
        "#forecast-90-summary"
    );
const garageForecastList =
    document.querySelector(
        "#garage-forecast-list"
    );
const expenseTopCategory =
    document.querySelector(
        "#expense-top-category"
    );
const expenseTopCategorySummary =
    document.querySelector(
        "#expense-top-category-summary"
    );
const expenseTopVehicle =
    document.querySelector(
        "#expense-top-vehicle"
    );
const expenseTopVehicleSummary =
    document.querySelector(
        "#expense-top-vehicle-summary"
    );
const upcomingWorkList =
    document.querySelector(
        "#upcoming-work-list"
    );
const saleReadinessList =
    document.querySelector(
        "#sale-readiness-list"
    );
const vehicleHealthList =
    document.querySelector(
        "#vehicle-health-list"
    );
const dataGapList = document.querySelector(
    "#data-gap-list"
);

const garageStatusBadge =
    document.querySelector(
        "#garage-status-badge"
    );
const aiChatThread = document.querySelector(
    "#ai-chat-thread"
);
const aiChatForm = document.querySelector(
    "#ai-chat-form"
);
const aiChatInput = document.querySelector(
    "#ai-chat-input"
);
const aiChatStatus =
    document.querySelector(
        "#ai-chat-status"
    );
const aiChatSubmitButton =
    document.querySelector(
        "#ai-chat-submit"
    );
const aiQuickActionButtons =
    document.querySelectorAll(
        ".ai-quick-action"
    );

let vehicles = [];
let soldVehicles = [];
let maintenancePlans = [];
let serviceHistory = [];
let vehicleIssues = [];
let vehicleDocuments = [];
let fuelEntries = [];
let vehicleExpenses = [];
let ownershipCostSummary = {};
let aiConfigured = true;
let aiConversationHistory = [];

let selectedVehicleId = null;
let editingVehicleId = null;

function showMessage(
    element,
    message,
    type = "error"
) {
    element.textContent = message;
    element.className =
        `form-message ${type}`;
}

function clearMessage(element) {
    element.textContent = "";
    element.className = "form-message";
}

function createTextElement(
    tagName,
    className,
    text
) {
    const element =
        document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    element.textContent = text;

    return element;
}

function createAiFeedbackButton(
    label,
    isActive,
    onClick
) {
    const button =
        document.createElement("button");

    button.type = "button";
    button.className =
        `ai-feedback-button${isActive ? " active" : ""}`;
    button.textContent = label;
    button.addEventListener("click", onClick);

    return button;
}

async function saveAiFeedback(
    conversationId,
    feedbackStatus,
    buttonRow
) {
    const feedbackNote =
        feedbackStatus ===
        "not_helpful"
            ? window.prompt(
                "What was missing or wrong in this reply?",
                ""
            ) || ""
            : "";

    try {
        const data =
            await window.apiRequest(
                `/api/ai/conversations/${conversationId}/feedback`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        feedbackStatus,
                        feedbackNote
                    })
                }
            );

        const nextStatus =
            data.feedback.feedback_status;

        buttonRow
            .querySelectorAll(
                ".ai-feedback-button"
            )
            .forEach((button) => {
                button.classList.toggle(
                    "active",
                    button.dataset.status ===
                        nextStatus
                );
            });

        setAiStatus(data.message);
    } catch (error) {
        setAiStatus(
            error.message,
            true
        );
    }
}

function appendAiMessage(
    role,
    text,
    options = {}
) {
    if (!aiChatThread) {
        return;
    }

    const message =
        document.createElement("article");

    message.className =
        `ai-message ${role}`;

    if (options.conversationId) {
        message.dataset.conversationId =
            String(options.conversationId);
    }

    message.append(
        createTextElement(
            "strong",
            "",
            role === "user"
                ? "You"
                : "CarCare AI"
        ),
        createTextElement(
            "p",
            "",
            text
        )
    );

    if (
        role === "assistant" &&
        options.conversationId
    ) {
        const feedbackRow =
            document.createElement("div");

        feedbackRow.className =
            "ai-message-feedback";

        const helpfulButton =
            createAiFeedbackButton(
                "Helpful",
                options.feedbackStatus ===
                    "helpful",
                async () => {
                    await saveAiFeedback(
                        options.conversationId,
                        "helpful",
                        feedbackRow
                    );
                }
            );

        helpfulButton.dataset.status =
            "helpful";

        const notHelpfulButton =
            createAiFeedbackButton(
                "Needs work",
                options.feedbackStatus ===
                    "not_helpful",
                async () => {
                    await saveAiFeedback(
                        options.conversationId,
                        "not_helpful",
                        feedbackRow
                    );
                }
            );

        notHelpfulButton.dataset.status =
            "not_helpful";

        feedbackRow.append(
            helpfulButton,
            notHelpfulButton
        );

        message.append(feedbackRow);
    }

    aiChatThread.append(message);
    aiChatThread.scrollTop =
        aiChatThread.scrollHeight;
}

function setAiStatus(text, isError = false) {
    if (!aiChatStatus) {
        return;
    }

    aiChatStatus.textContent = text;
    aiChatStatus.style.color = isError
        ? "var(--error)"
        : "";
}

async function askGarageAi(question) {
    if (!question) {
        return;
    }

    appendAiMessage("user", question);

    if (aiChatInput) {
        aiChatInput.value = "";
    }

    if (aiChatSubmitButton) {
        aiChatSubmitButton.disabled = true;
        aiChatSubmitButton.textContent =
            "Thinking...";
    }

    setAiStatus(
        "CarCare AI is reviewing your recorded garage data..."
    );

    try {
        const data =
            await window.apiRequest(
                "/api/ai/chat",
                {
                    method: "POST",
                    body: JSON.stringify({
                        message: question
                    })
                }
            );

        aiConfigured =
            data.configured !== false;

        appendAiMessage(
            "assistant",
            data.reply,
            {
                conversationId:
                    data.conversation?.id,
                feedbackStatus:
                    data.conversation
                        ?.feedback_status
            }
        );

        if (data.conversation) {
            aiConversationHistory.unshift(
                data.conversation
            );
        }

        setAiStatus(
            aiConfigured
                ? "Reply generated from your current garage records."
                : "AI is not configured on the server yet."
        );
    } catch (error) {
        aiConfigured =
            error.payload?.configured !== false;

        appendAiMessage(
            "assistant",
            error.message
        );

        setAiStatus(
            error.message,
            true
        );
    } finally {
        if (aiChatSubmitButton) {
            aiChatSubmitButton.disabled = false;
            aiChatSubmitButton.textContent =
                "Ask AI";
        }
    }
}

async function loadAiHistory() {
    if (!aiChatThread) {
        return;
    }

    try {
        const data =
            await window.apiRequest(
                "/api/ai/history"
            );

        aiConversationHistory =
            data.conversations || [];

        if (
            aiConversationHistory.length === 0
        ) {
            return;
        }

        aiChatThread.innerHTML = "";

        aiConversationHistory
            .slice()
            .reverse()
            .forEach((conversation) => {
                appendAiMessage(
                    "user",
                    conversation.question
                );

                appendAiMessage(
                    "assistant",
                    conversation.reply,
                    {
                        conversationId:
                            conversation.id,
                        feedbackStatus:
                            conversation.feedback_status
                    }
                );
            });

        setAiStatus(
            "Previous AI conversations loaded. Mark the useful ones so they become training data."
        );
    } catch (error) {
        console.error(error);
    }
}

function getOwnershipBadgeInfo(status) {
    const badgeMap = {
        verified: {
            text: "Ownership verified",
            className: "ownership-badge verified"
        },
        failed: {
            text: "Verification failed",
            className: "ownership-badge failed"
        },
        unverified: {
            text: "Verification needed",
            className: "ownership-badge pending"
        },
        not_started: {
            text: "No plate verification",
            className: "ownership-badge muted"
        }
    };

    return (
        badgeMap[status] || {
            text: "Verification needed",
            className: "ownership-badge pending"
        }
    );
}

function formatMileage(value) {
    return (
        `${Number(value).toLocaleString(
            "en-US"
        )} km`
    );
}

function formatCurrency(value) {
    return new Intl.NumberFormat(
        "tr-TR",
        {
            style: "currency",
            currency: "TRY",
            maximumFractionDigits: 2
        }
    ).format(Number(value) || 0);
}

function formatDashboardDate(value) {
    if (!value) {
        return "Unknown date";
    }

    return new Date(value)
        .toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
}

function requestOptionalList(
    url,
    responseProperties
) {
    return window.apiRequest(url)
        .then((data) => {
            const propertyNames = Array.isArray(
                responseProperties
            )
                ? responseProperties
                : [responseProperties];

            for (const propertyName of propertyNames) {
                if (Array.isArray(data[propertyName])) {
                    return data[propertyName];
                }
            }

            return [];
        })
        .catch((error) => {
            console.warn(
                `Optional dashboard source failed: ${url}`,
                error
            );

            return [];
        });
}

function getDisplayName(user) {
    return (
        user.preferred_name ||
        user.full_name ||
        "Driver"
    );
}

function getPlanVehicleName(plan) {
    if (plan.nickname) {
        return (
            `${plan.nickname} — ` +
            `${plan.brand} ${plan.model}`
        );
    }

    return `${plan.brand} ${plan.model}`;
}

function getRecordVehicleName(record) {
    if (record.nickname) {
        return (
            `${record.nickname} — ` +
            `${record.brand} ${record.model}`
        );
    }

    return `${record.brand} ${record.model}`;
}

function getVehicleDisplayName(vehicle) {
    if (!vehicle) {
        return "Vehicle";
    }

    if (vehicle.nickname) {
        return vehicle.nickname;
    }

    return `${vehicle.brand} ${vehicle.model}`;
}

function safeNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}

function getDaysUntilDate(value) {
    if (!value) {
        return null;
    }

    const today = new Date();
    const normalizedToday = new Date(
        `${today.toISOString().slice(0, 10)}T00:00:00Z`
    );
    const targetDate = new Date(
        `${String(value).slice(0, 10)}T00:00:00Z`
    );

    if (Number.isNaN(targetDate.getTime())) {
        return null;
    }

    return Math.round(
        (targetDate - normalizedToday) /
        (24 * 60 * 60 * 1000)
    );
}

function createMetricCard(
    eyebrow,
    title,
    detail,
    badgeText,
    badgeClassName = "priority-badge info"
) {
    const card =
        document.createElement("article");

    card.className = "priority-item";

    const content =
        document.createElement("div");
    content.className =
        "priority-item-content";

    content.append(
        createTextElement(
            "span",
            "",
            eyebrow
        ),
        createTextElement(
            "strong",
            "",
            title
        ),
        createTextElement(
            "p",
            "",
            detail
        )
    );

    const badge =
        createTextElement(
            "span",
            badgeClassName,
            badgeText
        );

    card.append(content, badge);

    return card;
}

function getPlanDeadline(plan) {
    const deadlineInformation = [];

    if (
        plan.next_due_mileage !== null &&
        plan.next_due_mileage !== undefined
    ) {
        deadlineInformation.push(
            formatMileage(
                plan.next_due_mileage
            )
        );
    }

    if (plan.next_due_date) {
        deadlineInformation.push(
            formatDashboardDate(
                plan.next_due_date
            )
        );
    }

    if (
        deadlineInformation.length === 0
    ) {
        return (
            "Waiting for a service baseline"
        );
    }

    return deadlineInformation.join(" • ");
}

function createOverviewEmptyState(
    icon,
    title,
    description
) {
    const emptyState =
        document.createElement("div");

    emptyState.className =
        "overview-empty-state";

    emptyState.append(
        createTextElement(
            "span",
            "overview-empty-icon",
            icon
        ),

        createTextElement(
            "strong",
            "",
            title
        ),

        createTextElement(
            "p",
            "",
            description
        )
    );

    return emptyState;
}

function formatSignalScore(score) {
    return Number(score).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    );
}

function applySignal(
    scoreElement,
    toneElement,
    summaryElement,
    metric
) {
    scoreElement.textContent =
        formatSignalScore(metric.score);
    toneElement.textContent = metric.toneLabel;
    toneElement.className =
        `signal-tone ${metric.tone}`;
    summaryElement.textContent =
        metric.summary;
}

function updateGarageStatusBadge({
    overduePlans,
    dueSoonPlans,
    openIssues,
    documentAlerts
}) {
    if (!garageStatusBadge) {
        return;
    }

    const criticalIssues = openIssues.filter(
        (issue) => issue.risk_level === "red"
    );
    const expiredDocuments =
        documentAlerts.filter(
            (documentRecord) =>
                documentRecord.renewal_status ===
                "expired"
        );

    if (
        criticalIssues.length > 0 ||
        overduePlans.length > 0 ||
        expiredDocuments.length > 0
    ) {
        const totalCritical =
            criticalIssues.length +
            overduePlans.length +
            expiredDocuments.length;

        garageStatusBadge.textContent =
            `${totalCritical} item` +
            `${totalCritical === 1 ? "" : "s"} need attention`;
        garageStatusBadge.className =
            "status-badge risk";
        return;
    }

    if (
        dueSoonPlans.length > 0 ||
        documentAlerts.length > 0
    ) {
        if (dueSoonPlans.length > 0) {
            garageStatusBadge.textContent =
                "Next service due soon";
        } else {
            garageStatusBadge.textContent =
                "Documents need a check soon";
        }

        garageStatusBadge.className =
            "status-badge warning";
        return;
    }

    if (vehicles.length > 0) {
        garageStatusBadge.textContent =
            "Garage looks healthy";
        garageStatusBadge.className =
            "status-badge stable";
        return;
    }

    garageStatusBadge.textContent =
        "Add your first vehicle";
    garageStatusBadge.className =
        "status-badge";
}

function createPriorityItem(priority) {
    const item =
        document.createElement("article");

    item.className = "priority-item";

    const content =
        document.createElement("div");

    content.className =
        "priority-item-content";

    content.append(
        createTextElement(
            "span",
            "",
            `${priority.area} | ${priority.vehicleName}`
        ),
        createTextElement(
            "strong",
            "",
            priority.title
        ),
        createTextElement(
            "p",
            "",
            priority.detail
        )
    );

    const badge =
        createTextElement(
            "span",
            `priority-badge ${priority.level}`,
            priority.level === "critical"
                ? "Now"
                : priority.level === "warning"
                    ? "Soon"
                    : "Monitor"
        );

    item.append(content, badge);

    return item;
}

function createForecastItem(item) {
    const forecastItem =
        document.createElement("article");

    forecastItem.className =
        "priority-item";

    const content =
        document.createElement("div");
    content.className =
        "priority-item-content";

    content.append(
        createTextElement(
            "span",
            "",
            `${item.type} | ${item.vehicleName}`
        ),
        createTextElement(
            "strong",
            "",
            item.title
        ),
        createTextElement(
            "p",
            "",
            item.detail
        )
    );

    const badge =
        createTextElement(
            "span",
            "priority-badge warning",
            formatCurrency(item.amount)
        );

    forecastItem.append(content, badge);

    return forecastItem;
}

function renderGarageSignals() {
    if (!window.garageInsights) {
        return;
    }

    const vehicleInsightList =
        vehicles.map((vehicleRecord) =>
            window.garageInsights.assessVehicle({
                vehicle: vehicleRecord,
                maintenancePlans:
                    maintenancePlans.filter(
                        (plan) =>
                            String(
                                plan.vehicle_id
                            ) ===
                            String(
                                vehicleRecord.id
                            )
                    ),
                serviceHistory:
                    serviceHistory.filter(
                        (record) =>
                            String(
                                record.vehicle_id
                            ) ===
                            String(
                                vehicleRecord.id
                            )
                    ),
                issues: vehicleIssues.filter(
                    (issue) =>
                        String(
                            issue.vehicle_id
                        ) ===
                        String(
                            vehicleRecord.id
                        )
                ),
                documents:
                    vehicleDocuments.filter(
                        (documentRecord) =>
                            String(
                                documentRecord.vehicle_id
                            ) ===
                            String(
                                vehicleRecord.id
                            )
                    )
            })
        );

    const summary =
        window.garageInsights.summarizeGarage(
            vehicleInsightList
        );

    applySignal(
        mechanicalSignalScore,
        mechanicalSignalTone,
        mechanicalSignalSummary,
        summary.metrics.mechanicalConfidence
    );

    applySignal(
        maintenanceSignalScore,
        maintenanceSignalTone,
        maintenanceSignalSummary,
        summary.metrics.maintenanceDiscipline
    );

    applySignal(
        documentSignalScore,
        documentSignalTone,
        documentSignalSummary,
        summary.metrics.documentReadiness
    );

    garagePriorityList.innerHTML = "";

    if (summary.priorities.length === 0) {
        garagePriorityList.append(
            createOverviewEmptyState(
                "OK",
                "No urgent garage priority",
                "Your active vehicles do not currently show a critical or upcoming issue."
            )
        );

        return;
    }

    summary.priorities.forEach((priority) => {
        garagePriorityList.append(
            createPriorityItem(priority)
        );
    });
}

function renderGarageForecast() {
    if (!window.garageInsights) {
        return;
    }

    const forecasts = vehicles.map((vehicleRecord) =>
        window.garageInsights.buildUpcomingCostForecast({
            vehicle: vehicleRecord,
            maintenancePlans:
                maintenancePlans.filter(
                    (plan) =>
                        String(plan.vehicle_id) ===
                        String(vehicleRecord.id)
                ),
            serviceHistory:
                serviceHistory.filter(
                    (record) =>
                        String(
                            record.vehicle_id
                        ) ===
                        String(vehicleRecord.id)
                ),
            issues: vehicleIssues.filter(
                (issue) =>
                    String(issue.vehicle_id) ===
                    String(vehicleRecord.id)
            ),
            documents:
                vehicleDocuments.filter(
                    (documentRecord) =>
                        String(
                            documentRecord.vehicle_id
                        ) ===
                        String(vehicleRecord.id)
                )
        })
    );

    const summary =
        window.garageInsights.summarizeCostForecast(
            forecasts
        );

    forecast30Total.textContent =
        formatCurrency(
            summary.next30DaysTotal
        );
    forecast90Total.textContent =
        formatCurrency(
            summary.next90DaysTotal
        );
    forecast30Summary.textContent =
        summary.next30DaysTotal > 0
            ? "Likely spend that may hit within the next month."
            : "No immediate tracked cost pressure was found.";
    forecast90Summary.textContent =
        summary.next90DaysTotal > 0
            ? "Wider budget view including short-term and near-term items."
            : "Nothing significant is forecast from tracked items yet.";

    garageForecastList.innerHTML = "";

    if (summary.items.length === 0) {
        garageForecastList.append(
            createOverviewEmptyState(
                "₺",
                "No approaching cost pressure",
                "Tracked maintenance, documents and issues do not currently suggest a near-term cost spike."
            )
        );

        return;
    }

    summary.items.forEach((item) => {
        garageForecastList.append(
            createForecastItem(item)
        );
    });
}

function renderExpenseIntelligence() {
    const categoryTotals = new Map();
    const vehicleTotals = new Map();

    vehicleExpenses.forEach((expense) => {
        const category =
            expense.expense_type || "other";
        const amount = safeNumber(
            expense.amount
        );

        categoryTotals.set(
            category,
            (categoryTotals.get(category) || 0) +
                amount
        );
    });

    fuelEntries.forEach((entry) => {
        const amount = safeNumber(
            entry.total_cost
        );
        const vehicleKey = String(
            entry.vehicle_id
        );

        vehicleTotals.set(
            vehicleKey,
            (vehicleTotals.get(vehicleKey) || 0) +
                amount
        );
    });

    vehicleExpenses.forEach((expense) => {
        const amount = safeNumber(
            expense.amount
        );
        const vehicleKey = String(
            expense.vehicle_id
        );

        vehicleTotals.set(
            vehicleKey,
            (vehicleTotals.get(vehicleKey) || 0) +
                amount
        );
    });

    serviceHistory.forEach((record) => {
        const amount = safeNumber(
            record.actual_cost
        );
        const vehicleKey = String(
            record.vehicle_id
        );

        vehicleTotals.set(
            vehicleKey,
            (vehicleTotals.get(vehicleKey) || 0) +
                amount
        );

        categoryTotals.set(
            "service",
            (categoryTotals.get("service") || 0) +
                amount
        );
    });

    const topCategory =
        [...categoryTotals.entries()]
            .sort(
                (firstEntry, secondEntry) =>
                    secondEntry[1] - firstEntry[1]
            )[0] || null;

    if (!topCategory) {
        expenseTopCategory.textContent =
            "No data";
        expenseTopCategorySummary.textContent =
            "Add fuel, service or expense records to understand the spending mix.";
    } else {
        expenseTopCategory.textContent =
            topCategory[0];
        expenseTopCategorySummary.textContent =
            `${formatCurrency(topCategory[1])} is your largest tracked cost bucket so far.`;
    }

    const topVehicleEntry =
        [...vehicleTotals.entries()]
            .sort(
                (firstEntry, secondEntry) =>
                    secondEntry[1] - firstEntry[1]
            )[0] || null;

    if (!topVehicleEntry) {
        expenseTopVehicle.textContent =
            "No data";
        expenseTopVehicleSummary.textContent =
            "Vehicle-level cost pressure appears here once ownership records accumulate.";
        return;
    }

    const vehicle = vehicles.find(
        (item) =>
            String(item.id) ===
            topVehicleEntry[0]
    );

    expenseTopVehicle.textContent =
        getVehicleDisplayName(vehicle);
    expenseTopVehicleSummary.textContent =
        `${formatCurrency(topVehicleEntry[1])} is the highest tracked spend concentration across your active garage.`;
}

function renderUpcomingWorkTimeline() {
    upcomingWorkList.innerHTML = "";

    const items = [];

    maintenancePlans
        .filter(
            (plan) =>
                plan.status === "overdue" ||
                plan.status === "due_soon"
        )
        .forEach((plan) => {
            const daysAway =
                plan.status === "overdue"
                    ? -1
                    : getDaysUntilDate(
                        plan.next_due_date
                    );

            items.push({
                sortKey:
                    daysAway === null
                        ? 999
                        : daysAway,
                card: createMetricCard(
                    `maintenance | ${getPlanVehicleName(plan)}`,
                    plan.name,
                    plan.status === "overdue"
                        ? "This service is already past target and should be planned immediately."
                        : `Expected soon. ${getPlanDeadline(plan)}`,
                    plan.status === "overdue"
                        ? "Overdue"
                        : "Soon",
                    `priority-badge ${plan.status === "overdue" ? "critical" : "warning"}`
                )
            });
        });

    vehicleDocuments
        .filter(
            (documentRecord) =>
                documentRecord.renewal_status ===
                    "expired" ||
                documentRecord.renewal_status ===
                    "due_soon"
        )
        .forEach((documentRecord) => {
            const vehicle = vehicles.find(
                (item) =>
                    String(item.id) ===
                    String(
                        documentRecord.vehicle_id
                    )
            );
            const daysRemaining = safeNumber(
                documentRecord.days_remaining
            );

            items.push({
                sortKey: daysRemaining,
                card: createMetricCard(
                    `documents | ${getVehicleDisplayName(vehicle)}`,
                    documentRecord.title,
                    daysRemaining < 0
                        ? `${Math.abs(daysRemaining)} days overdue. Renew this before buyer-facing or operational issues grow.`
                        : `${daysRemaining} days remaining before renewal pressure becomes critical.`,
                    daysRemaining < 0
                        ? "Expired"
                        : `${daysRemaining}d`,
                    `priority-badge ${daysRemaining < 0 ? "critical" : "warning"}`
                )
            });
        });

    vehicleIssues
        .filter(
            (issue) =>
                issue.status !== "repaired"
        )
        .forEach((issue) => {
            items.push({
                sortKey:
                    issue.risk_level === "red"
                        ? -2
                        : 14,
                card: createMetricCard(
                    `issue | ${getRecordVehicleName(issue)}`,
                    issue.issue_title,
                    issue.risk_level === "red"
                        ? "Urgent mechanical attention should come before less critical garage work."
                        : "Keep this issue visible before it turns into downtime or a larger repair.",
                    issue.risk_level === "red"
                        ? "Urgent"
                        : "Monitor",
                    `priority-badge ${issue.risk_level === "red" ? "critical" : "warning"}`
                )
            });
        });

    if (items.length === 0) {
        upcomingWorkList.append(
            createOverviewEmptyState(
                "OK",
                "No near-term work pileup",
                "Nothing currently stands out across maintenance, documents or open issues."
            )
        );
        return;
    }

    items
        .sort(
            (firstItem, secondItem) =>
                firstItem.sortKey -
                secondItem.sortKey
        )
        .slice(0, 8)
        .forEach((item) => {
            upcomingWorkList.append(
                item.card
            );
        });
}

function renderSaleReadiness() {
    saleReadinessList.innerHTML = "";

    if (!window.garageInsights || vehicles.length === 0) {
        saleReadinessList.append(
            createOverviewEmptyState(
                "S",
                "No active vehicle to prepare",
                "Add an active vehicle before using buyer-facing readiness checks."
            )
        );
        return;
    }

    const readinessCards = vehicles.map(
        (vehicle) => {
            const plans =
                maintenancePlans.filter(
                    (plan) =>
                        String(plan.vehicle_id) ===
                        String(vehicle.id)
                );
            const history =
                serviceHistory.filter(
                    (record) =>
                        String(record.vehicle_id) ===
                        String(vehicle.id)
                );
            const issues =
                vehicleIssues.filter(
                    (issue) =>
                        String(issue.vehicle_id) ===
                        String(vehicle.id)
                );
            const documents =
                vehicleDocuments.filter(
                    (documentRecord) =>
                        String(
                            documentRecord.vehicle_id
                        ) ===
                        String(vehicle.id)
                );
            const openIssues = issues.filter(
                (issue) =>
                    issue.status !== "repaired"
            );
            const expiredDocuments =
                documents.filter(
                    (documentRecord) =>
                        documentRecord.renewal_status ===
                        "expired"
                );
            const overduePlans = plans.filter(
                (plan) =>
                    plan.status === "overdue"
            );

            let score = 10;
            const blockers = [];

            if (openIssues.length > 0) {
                score -= 3;
                blockers.push(
                    `${openIssues.length} open issue`
                );
            }

            if (expiredDocuments.length > 0) {
                score -= 2.5;
                blockers.push(
                    `${expiredDocuments.length} expired document`
                );
            }

            if (overduePlans.length > 0) {
                score -= 2;
                blockers.push(
                    `${overduePlans.length} overdue maintenance item`
                );
            }

            if (history.length === 0) {
                score -= 1.5;
                blockers.push(
                    "no service history"
                );
            }

            if (
                vehicle.ownership_status !==
                "verified"
            ) {
                score -= 1;
                blockers.push(
                    "ownership not verified"
                );
            }

            const finalScore = Math.max(
                0,
                Math.round(score * 10) / 10
            );
            const readyText =
                blockers.length === 0
                    ? "Buyer-facing profile looks clean with no obvious trust blockers."
                    : `Before sharing this vehicle, fix ${blockers.slice(0, 2).join(" and ")}.`;

            return createMetricCard(
                `sale prep | ${getVehicleDisplayName(vehicle)}`,
                "Buyer confidence readiness",
                readyText,
                `${finalScore}/10`,
                `priority-badge ${finalScore >= 8 ? "info" : finalScore >= 6 ? "warning" : "critical"}`
            );
        }
    );

    readinessCards.forEach((card) => {
        saleReadinessList.append(card);
    });
}

function renderVehicleHealthSnapshots() {
    vehicleHealthList.innerHTML = "";

    if (!window.garageInsights || vehicles.length === 0) {
        vehicleHealthList.append(
            createOverviewEmptyState(
                "V",
                "No vehicle snapshot yet",
                "Add an active vehicle to generate health summaries."
            )
        );
        return;
    }

    vehicles.forEach((vehicle) => {
        const insight =
            window.garageInsights.assessVehicle({
                vehicle,
                maintenancePlans:
                    maintenancePlans.filter(
                        (plan) =>
                            String(plan.vehicle_id) ===
                            String(vehicle.id)
                    ),
                serviceHistory:
                    serviceHistory.filter(
                        (record) =>
                            String(record.vehicle_id) ===
                            String(vehicle.id)
                    ),
                issues: vehicleIssues.filter(
                    (issue) =>
                        String(issue.vehicle_id) ===
                        String(vehicle.id)
                ),
                documents:
                    vehicleDocuments.filter(
                        (documentRecord) =>
                            String(
                                documentRecord.vehicle_id
                            ) ===
                            String(vehicle.id)
                    )
            });

        const score = (
            insight.metrics
                .mechanicalConfidence.score +
            insight.metrics
                .maintenanceDiscipline.score +
            insight.metrics
                .documentReadiness.score
        ) / 3;

        const summary = [
            insight.metrics.mechanicalConfidence
                .summary,
            insight.metrics.maintenanceDiscipline
                .summary
        ].join(" ");

        vehicleHealthList.append(
            createMetricCard(
                `snapshot | ${getVehicleDisplayName(vehicle)}`,
                "Short health summary",
                summary,
                `${score.toFixed(1)}/10`,
                `priority-badge ${score >= 8 ? "info" : score >= 6 ? "warning" : "critical"}`
            )
        );
    });
}

function renderDataGaps() {
    dataGapList.innerHTML = "";

    const gaps = [];

    vehicles.forEach((vehicle) => {
        const vehicleName =
            getVehicleDisplayName(vehicle);
        const plans =
            maintenancePlans.filter(
                (plan) =>
                    String(plan.vehicle_id) ===
                    String(vehicle.id)
            );
        const history =
            serviceHistory.filter(
                (record) =>
                    String(record.vehicle_id) ===
                    String(vehicle.id)
            );
        const docs =
            vehicleDocuments.filter(
                (documentRecord) =>
                    String(
                        documentRecord.vehicle_id
                    ) ===
                    String(vehicle.id)
            );
        const fuel =
            fuelEntries.filter(
                (entry) =>
                    String(entry.vehicle_id) ===
                    String(vehicle.id)
            );

        if (plans.length === 0) {
            gaps.push(
                createMetricCard(
                    `data gap | ${vehicleName}`,
                    "No maintenance baseline",
                    "Recurring service planning is missing, so maintenance insights are less reliable.",
                    "Missing",
                    "priority-badge warning"
                )
            );
        }

        if (history.length === 0) {
            gaps.push(
                createMetricCard(
                    `data gap | ${vehicleName}`,
                    "No completed service history",
                    "Buyer trust and forecast quality both improve when past workshop work is recorded.",
                    "History",
                    "priority-badge warning"
                )
            );
        }

        if (docs.length === 0) {
            gaps.push(
                createMetricCard(
                    `data gap | ${vehicleName}`,
                    "No document tracking",
                    "Expiry-related readiness cannot be trusted until core documents are recorded.",
                    "Docs",
                    "priority-badge warning"
                )
            );
        }

        if (fuel.length === 0) {
            gaps.push(
                createMetricCard(
                    `data gap | ${vehicleName}`,
                    "No fuel records",
                    "Ownership cost and usage efficiency analysis stay shallow without fill-up data.",
                    "Fuel",
                    "priority-badge info"
                )
            );
        }

        if (
            vehicle.ownership_status !==
            "verified"
        ) {
            gaps.push(
                createMetricCard(
                    `data gap | ${vehicleName}`,
                    "Ownership not verified",
                    "Plate verification is still missing, which weakens buyer-facing confidence.",
                    "Trust",
                    "priority-badge info"
                )
            );
        }
    });

    if (gaps.length === 0) {
        dataGapList.append(
            createOverviewEmptyState(
                "OK",
                "No major data weakness found",
                "This garage has enough structure for stronger insights and buyer-facing presentation."
            )
        );
        return;
    }

    gaps.slice(0, 8).forEach((gapCard) => {
        dataGapList.append(gapCard);
    });
}

function renderMaintenanceOverview() {
    maintenanceOverviewList.innerHTML = "";

    const statusPriority = {
        overdue: 0,
        due_soon: 1
    };

    const attentionPlans =
        maintenancePlans
            .filter(
                (plan) =>
                    plan.status ===
                        "overdue" ||
                    plan.status ===
                        "due_soon"
            )
            .sort(
                (
                    firstPlan,
                    secondPlan
                ) =>
                    statusPriority[
                        firstPlan.status
                    ] -
                    statusPriority[
                        secondPlan.status
                    ]
            )
            .slice(0, 4);

    if (attentionPlans.length === 0) {
        maintenanceOverviewList.append(
            createOverviewEmptyState(
                "✓",
                "Everything looks good",
                "There are no overdue or upcoming maintenance plans."
            )
        );

        return;
    }

    attentionPlans.forEach((plan) => {
        const item =
            document.createElement(
                "article"
            );

        item.className =
            "overview-list-item";

        const content =
            document.createElement("div");

        content.className =
            "overview-item-content";

        content.append(
            createTextElement(
                "strong",
                "",
                plan.name
            ),

            createTextElement(
                "span",
                "",
                getPlanVehicleName(plan)
            ),

            createTextElement(
                "small",
                "",
                getPlanDeadline(plan)
            )
        );

        const statusText =
            plan.status === "overdue"
                ? "Overdue"
                : "Due soon";

        const statusBadge =
            createTextElement(
                "span",
                `overview-status ` +
                    `${plan.status}`,
                statusText
            );

        item.append(
            content,
            statusBadge
        );

        maintenanceOverviewList.append(
            item
        );
    });
}

function renderRecentServices() {
    recentServiceList.innerHTML = "";

    const recentRecords =
        [...serviceHistory]
            .sort(
                (
                    firstRecord,
                    secondRecord
                ) =>
                    new Date(
                        secondRecord
                            .completed_at
                    ).getTime() -
                    new Date(
                        firstRecord
                            .completed_at
                    ).getTime()
            )
            .slice(0, 4);

    if (recentRecords.length === 0) {
        recentServiceList.append(
            createOverviewEmptyState(
                "↗",
                "No service records yet",
                "Completed maintenance will appear here."
            )
        );

        return;
    }

    recentRecords.forEach((record) => {
        const item =
            document.createElement(
                "article"
            );

        item.className =
            "overview-list-item";

        const content =
            document.createElement("div");

        content.className =
            "overview-item-content";

        content.append(
            createTextElement(
                "strong",
                "",
                record.service_name
            ),

            createTextElement(
                "span",
                "",
                getRecordVehicleName(
                    record
                )
            ),

            createTextElement(
                "small",
                "",
                formatDashboardDate(
                    record.completed_at
                )
            )
        );

        const costText =
            record.actual_cost === null ||
            record.actual_cost === undefined
                ? "No cost"
                : formatCurrency(
                    record.actual_cost
                );

        const costBadge =
            createTextElement(
                "span",
                "service-cost-badge",
                costText
            );

        item.append(
            content,
            costBadge
        );

        recentServiceList.append(item);
    });
}

function renderDashboardOverview() {
    const totalMileage =
        vehicles.reduce(
            (total, vehicle) =>
                total +
                Number(
                    vehicle.current_mileage ||
                        0
                ),
            0
        );

    const overduePlans =
        maintenancePlans.filter(
            (plan) =>
                plan.status === "overdue"
        );

    const dueSoonPlans =
        maintenancePlans.filter(
            (plan) =>
                plan.status === "due_soon"
        );

    const openIssues = vehicleIssues.filter(
        (issue) => issue.status !== "repaired"
    );

    const documentAlerts =
        vehicleDocuments.filter(
            (documentRecord) =>
                documentRecord.renewal_status ===
                    "expired" ||
                documentRecord.renewal_status ===
                    "due_soon"
        );

    const attentionCount =
        overduePlans.length +
        dueSoonPlans.length +
        openIssues.length +
        documentAlerts.length;

    const totalServiceCost =
        serviceHistory.reduce(
            (total, record) =>
                total +
                Number(
                    record.actual_cost || 0
                ),
            0
        );

    vehicleStatistic.textContent =
        String(vehicles.length);

    vehicleStatisticDetail.textContent =
        vehicles.length === 0
            ? "No registered vehicles"
            : `${formatMileage(
                totalMileage
            )} tracked in total`;

    planStatistic.textContent =
        String(maintenancePlans.length);

    planStatisticDetail.textContent =
        maintenancePlans.length === 1
            ? "1 active maintenance plan"
            : `${maintenancePlans.length} ` +
                `active maintenance plans`;

    attentionStatistic.textContent =
        String(attentionCount);

    if (attentionCount === 0) {
        attentionStatisticDetail.textContent =
            "No tracked issue currently needs attention";
    } else {
        attentionStatisticDetail.textContent =
            `${overduePlans.length} overdue • ` +
            `${openIssues.length} issues • ` +
            `${documentAlerts.length} documents`;
    }

    serviceCostStatistic.textContent =
        formatCurrency(
            totalServiceCost
        );

    serviceStatisticDetail.textContent =
        serviceHistory.length === 1
            ? "Across 1 completed service"
            : `Across ${serviceHistory.length} ` +
                `completed services`;

    dashboardLastUpdated.textContent =
        "Updated just now";

    updateGarageStatusBadge({
        overduePlans,
        dueSoonPlans,
        openIssues,
        documentAlerts
    });

    renderGarageSignals();
    renderGarageForecast();
    renderMaintenanceOverview();
    renderRecentServices();
    renderExpenseIntelligence();
    renderUpcomingWorkTimeline();
    renderSaleReadiness();
    renderVehicleHealthSnapshots();
    renderDataGaps();
}

function createDetail(label, value) {
    const detail =
        document.createElement("div");

    detail.className =
        "vehicle-detail";

    detail.append(
        createTextElement(
            "span",
            "detail-label",
            label
        ),

        createTextElement(
            "strong",
            "",
            String(value)
        )
    );

    return detail;
}

function renderVehicles() {
    vehicleList.innerHTML = "";

    const countText =
        vehicles.length === 1
            ? "1 vehicle"
            : `${vehicles.length} vehicles`;

    vehicleCount.textContent = countText;

    renderDashboardOverview();

    if (vehicles.length === 0) {
        const emptyState =
            document.createElement("div");

        emptyState.className =
            "empty-state vehicle-empty-state";

        emptyState.append(
            createTextElement(
                "div",
                "empty-icon",
                "🚗"
            ),

            createTextElement(
                "h2",
                "",
                "No vehicles yet"
            ),

            createTextElement(
                "p",
                "",
                "Add your first vehicle using the form above."
            )
        );

        vehicleList.append(emptyState);

        return;
    }

    const grid =
        document.createElement("div");

    grid.className = "vehicle-grid";

    vehicles.forEach((vehicle) => {
        const card =
            document.createElement(
                "article"
            );

        card.className = "vehicle-card";

        const header =
            document.createElement("div");

        header.className =
            "vehicle-card-header";

        const titleArea =
            document.createElement("div");

        const title =
            vehicle.nickname ||
            `${vehicle.brand} ` +
                `${vehicle.model}`;

        const vehicleTitle =
            createTextElement(
                "h3",
                "vehicle-title",
                title
            );

        const subtitleText =
            vehicle.nickname
                ? `${vehicle.brand} ` +
                    `${vehicle.model}`
                : "Registered vehicle";

        const vehicleSubtitle =
            createTextElement(
                "p",
                "vehicle-subtitle",
                subtitleText
            );

        const ownershipBadgeInfo =
            getOwnershipBadgeInfo(
                vehicle.ownership_status
            );

        const ownershipBadge =
            createTextElement(
                "span",
                ownershipBadgeInfo.className,
                ownershipBadgeInfo.text
            );

        titleArea.append(
            vehicleTitle,
            vehicleSubtitle,
            ownershipBadge
        );

        const mileageBadge =
            createTextElement(
                "div",
                "mileage-badge",
                formatMileage(
                    vehicle.current_mileage
                )
            );

        header.append(
            titleArea,
            mileageBadge
        );

        const details =
            document.createElement("div");

        details.className =
            "vehicle-details";

        const yearText =
            vehicle.model_year ||
            "Not specified";

        const plateText =
            vehicle.license_plate ||
            "Not specified";

        details.append(
            createDetail(
                "Model year",
                yearText
            ),

            createDetail(
                "License plate",
                plateText
            )
        );

        const actions =
            document.createElement("div");

        actions.className =
            "vehicle-actions";

        const viewDetailsButton =
            document.createElement("button");

        viewDetailsButton.type = "button";

        viewDetailsButton.className =
            "secondary-button";

        viewDetailsButton.textContent =
            "View details";

        viewDetailsButton.addEventListener(
            "click",
            () => {
                window.location.href =
                    `/vehicle.html?id=` +
                    `${vehicle.id}`;
            }
        );

        const mileageButton =
            document.createElement("button");

        mileageButton.type = "button";

        mileageButton.className =
            "secondary-button";

        mileageButton.textContent =
            "Update mileage";

        mileageButton.addEventListener(
            "click",
            () => {
                openMileageDialog(
                    vehicle.id
                );
            }
        );

        const editButton =
            document.createElement("button");

        editButton.type = "button";

        editButton.className =
            "secondary-button";

        editButton.textContent =
            "Edit";

        editButton.addEventListener(
            "click",
            () => {
                openVehicleEditDialog(
                    vehicle.id
                );
            }
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className =
            "danger-button";

        deleteButton.textContent =
            "Mark as sold";

        deleteButton.addEventListener(
            "click",
            () => {
                markVehicleAsSold(
                    vehicle.id
                );
            }
        );

        actions.append(
            viewDetailsButton,
            editButton,
            mileageButton,
            deleteButton
        );

        card.append(
            header,
            details,
            actions
        );

        grid.append(card);
    });

    vehicleList.append(grid);
}

function renderSoldVehicles() {
    if (!soldVehicleList || !soldVehicleCount) {
        return;
    }

    soldVehicleList.innerHTML = "";

    soldVehicleCount.textContent =
        soldVehicles.length === 1
            ? "1 vehicle"
            : `${soldVehicles.length} vehicles`;

    if (soldVehicles.length === 0) {
        soldVehicleList.append(
            createOverviewEmptyState(
                "S",
                "No sold vehicles yet",
                "Vehicles marked as sold will appear here."
            )
        );

        return;
    }

    const grid =
        document.createElement("div");

    grid.className = "vehicle-grid sold-vehicle-grid";

    soldVehicles.forEach((vehicle) => {
        const card =
            document.createElement(
                "article"
            );

        card.className =
            "vehicle-card sold-vehicle-card";

        const header =
            document.createElement("div");

        header.className =
            "vehicle-card-header";

        const titleArea =
            document.createElement("div");

        const title =
            vehicle.nickname ||
            `${vehicle.brand} ${vehicle.model}`;

        titleArea.append(
            createTextElement(
                "h3",
                "vehicle-title",
                title
            ),
            createTextElement(
                "p",
                "vehicle-subtitle",
                vehicle.nickname
                    ? `${vehicle.brand} ${vehicle.model}`
                    : "Archived vehicle"
            ),
            createTextElement(
                "span",
                "ownership-badge muted",
                vehicle.sold_at
                    ? `Sold on ${formatDashboardDate(
                        vehicle.sold_at
                    )}`
                    : "Sold vehicle"
            )
        );

        header.append(
            titleArea,
            createTextElement(
                "div",
                "mileage-badge",
                formatMileage(
                    vehicle.current_mileage
                )
            )
        );

        const details =
            document.createElement("div");

        details.className =
            "vehicle-details";

        details.append(
            createDetail(
                "Model year",
                vehicle.model_year ||
                    "Not specified"
            ),
            createDetail(
                "License plate",
                vehicle.license_plate ||
                    "Not specified"
            )
        );

        const actions =
            document.createElement("div");

        actions.className =
            "vehicle-actions";

        const viewDetailsButton =
            document.createElement("button");

        viewDetailsButton.type = "button";
        viewDetailsButton.className =
            "secondary-button";
        viewDetailsButton.textContent =
            "View details";
        viewDetailsButton.addEventListener(
            "click",
            () => {
                window.location.href =
                    `/vehicle.html?id=${vehicle.id}`;
            }
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "danger-button";
        deleteButton.textContent =
            "Delete permanently";
        deleteButton.addEventListener(
            "click",
            () => {
                deleteSoldVehicle(vehicle.id);
            }
        );

        actions.append(
            viewDetailsButton,
            deleteButton
        );

        card.append(
            header,
            details,
            actions
        );

        grid.append(card);
    });

    soldVehicleList.append(grid);
}

async function loadDashboard() {
    try {
        const [
            userData,
            vehicleData,
            soldVehicleData,
            maintenanceData,
            historyData,
            issueData,
            documentData,
            fuelData,
            expenseData,
            ownershipCostData
        ] = await Promise.all([
            window.apiRequest(
                "/api/auth/me"
            ),

            window.apiRequest(
                "/api/vehicles"
            ),
            window.apiRequest(
                "/api/vehicles/archive"
            ),

            window.apiRequest(
                "/api/maintenance-plans"
            ),

            window.apiRequest(
                "/api/service-history"
            ),

            requestOptionalList(
                "/api/issues",
                "issues"
            ),

            requestOptionalList(
                "/api/documents",
                "documents"
            ),
            requestOptionalList(
                "/api/costs/fuel",
                "fuelEntries"
            ),
            requestOptionalList(
                "/api/costs/expenses",
                "expenses"
            ),
            window.apiRequest(
                "/api/costs/summary"
            )
        ]);

        userNameElement.textContent =
            getDisplayName(
                userData.user
            );

        userEmailElement.textContent =
            userData.user.email;

        vehicles =
            vehicleData.vehicles;

        soldVehicles =
            soldVehicleData.vehicles;

        maintenancePlans =
            maintenanceData
                .maintenancePlans;

        serviceHistory =
            historyData.serviceHistory;

        vehicleIssues = issueData;

        vehicleDocuments = documentData;
        fuelEntries = fuelData;
        vehicleExpenses = expenseData;
        ownershipCostSummary =
            ownershipCostData.summary || {};

        renderVehicles();
        renderSoldVehicles();
    } catch (error) {
        window.handlePageLoadError(
            error,
            "Dashboard could not be loaded."
        );
    }
}

vehicleForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        clearMessage(
            vehicleFormMessage
        );

        const submitButton =
            vehicleForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;

        submitButton.textContent =
            "Adding vehicle...";

        const formData =
            new FormData(vehicleForm);

        const vehicleData = {
            brand:
                formData.get("brand"),

            model:
                formData.get("model"),

            modelYear:
                formData.get(
                    "modelYear"
                ),

            nickname:
                formData.get(
                    "nickname"
                ),

            licensePlate:
                formData.get(
                    "licensePlate"
                ),

            currentMileage:
                formData.get(
                    "currentMileage"
                )
        };

        try {
            const data =
                await window.apiRequest(
                    "/api/vehicles",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                vehicleData
                            )
                    }
                );

            vehicles.unshift(
                data.vehicle
            );

            vehicleForm.reset();

            showMessage(
                vehicleFormMessage,
                data.message,
                "success"
            );

            renderVehicles();
        } catch (error) {
            showMessage(
                vehicleFormMessage,
                error.message
            );
        } finally {
            submitButton.disabled = false;

            submitButton.textContent =
                "Add vehicle";
        }
    }
);

function openMileageDialog(vehicleId) {
    const vehicle = vehicles.find(
        (item) =>
            item.id === vehicleId
    );

    if (!vehicle) {
        return;
    }

    selectedVehicleId = vehicleId;

    mileageVehicleName.textContent =
        `${vehicle.brand} ${vehicle.model}`;

    currentMileageValue.textContent =
        formatMileage(
            vehicle.current_mileage
        );

    newMileageInput.min =
        Number(
            vehicle.current_mileage
        ) + 1;

    newMileageInput.value = "";

    clearMessage(mileageMessage);

    mileageDialog.showModal();
}

function closeMileageDialog() {
    selectedVehicleId = null;

    mileageForm.reset();

    clearMessage(mileageMessage);

    mileageDialog.close();
}

function openVehicleEditDialog(
    vehicleId
) {
    const vehicle = vehicles.find(
        (item) =>
            item.id === vehicleId
    );

    if (!vehicle) {
        return;
    }

    editingVehicleId = vehicleId;

    vehicleEditForm.elements.brand.value =
        vehicle.brand || "";

    vehicleEditForm.elements.model.value =
        vehicle.model || "";

    vehicleEditForm.elements.modelYear.value =
        vehicle.model_year || "";

    vehicleEditForm.elements.nickname.value =
        vehicle.nickname || "";

    vehicleEditForm.elements.licensePlate.value =
        vehicle.license_plate || "";

    clearMessage(
        vehicleEditMessage
    );

    vehicleEditDialog.showModal();
}

function closeVehicleEditDialog() {
    editingVehicleId = null;
    vehicleEditForm.reset();
    clearMessage(
        vehicleEditMessage
    );
    vehicleEditDialog.close();
}

closeMileageDialogButton.addEventListener(
    "click",
    closeMileageDialog
);

cancelMileageButton.addEventListener(
    "click",
    closeMileageDialog
);

closeVehicleEditDialogButton.addEventListener(
    "click",
    closeVehicleEditDialog
);

cancelVehicleEditButton.addEventListener(
    "click",
    closeVehicleEditDialog
);

mileageForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const vehicle = vehicles.find(
            (item) =>
                item.id ===
                selectedVehicleId
        );

        if (!vehicle) {
            return;
        }

        const newMileage =
            Number(
                newMileageInput.value
            );

        const currentMileage =
            Number(
                vehicle.current_mileage
            );

        if (
            !Number.isInteger(
                newMileage
            ) ||
            newMileage <= currentMileage
        ) {
            showMessage(
                mileageMessage,
                `Mileage must be greater ` +
                    `than ${currentMileage} km.`
            );

            return;
        }

        const confirmed =
            window.confirm(
                `You are changing the ` +
                `mileage from ` +
                `${formatMileage(
                    currentMileage
                )} to ` +
                `${formatMileage(
                    newMileage
                )}.\n\n` +
                `This change cannot be ` +
                `reversed. Continue?`
            );

        if (!confirmed) {
            return;
        }

        const submitButton =
            mileageForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;

        submitButton.textContent =
            "Updating...";

        try {
            const data =
                await window.apiRequest(
                    `/api/vehicles/` +
                    `${vehicle.id}/mileage`,
                    {
                        method: "PATCH",

                        body:
                            JSON.stringify({
                                newMileage
                            })
                    }
                );

            vehicles = vehicles.map(
                (item) =>
                    item.id ===
                    vehicle.id
                        ? data.vehicle
                        : item
            );

            try {
                const maintenanceData =
                    await window.apiRequest(
                        "/api/maintenance-plans"
                    );

                maintenancePlans =
                    maintenanceData
                        .maintenancePlans;
            } catch (refreshError) {
                console.error(
                    refreshError
                );
            }

            closeMileageDialog();
            renderVehicles();
        } catch (error) {
            showMessage(
                mileageMessage,
                error.message
            );
        } finally {
            submitButton.disabled = false;

            submitButton.textContent =
                "Confirm mileage";
        }
    }
);

vehicleEditForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const vehicle = vehicles.find(
            (item) =>
                item.id ===
                editingVehicleId
        );

        if (!vehicle) {
            return;
        }

        clearMessage(
            vehicleEditMessage
        );

        const submitButton =
            vehicleEditForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;
        submitButton.textContent =
            "Saving...";

        const formData =
            new FormData(
                vehicleEditForm
            );

        try {
            const data =
                await window.apiRequest(
                    `/api/vehicles/${vehicle.id}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            brand:
                                formData.get(
                                    "brand"
                                ),
                            model:
                                formData.get(
                                    "model"
                                ),
                            modelYear:
                                formData.get(
                                    "modelYear"
                                ),
                            nickname:
                                formData.get(
                                    "nickname"
                                ),
                            licensePlate:
                                formData.get(
                                    "licensePlate"
                                )
                        })
                    }
                );

            vehicles = vehicles.map(
                (item) =>
                    item.id === vehicle.id
                        ? data.vehicle
                        : item
            );

            closeVehicleEditDialog();
            renderVehicles();
        } catch (error) {
            showMessage(
                vehicleEditMessage,
                error.message
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent =
                "Save changes";
        }
    }
);

async function markVehicleAsSold(vehicleId) {
    const vehicle = vehicles.find(
        (item) =>
            item.id === vehicleId
    );

    if (!vehicle) {
        return;
    }

    const confirmed =
        window.confirm(
            `Mark ${vehicle.brand} ` +
            `${vehicle.model}?\n\n` +
            `This will release the license plate for a future owner and remove the vehicle from your active garage.`
        );

    if (!confirmed) {
        return;
    }

    try {
        await window.apiRequest(
            `/api/vehicles/${vehicleId}/sell`,
            {
                method: "PATCH"
            }
        );

        vehicles = vehicles.filter(
            (item) =>
                item.id !== vehicleId
        );

        maintenancePlans =
            maintenancePlans.filter(
                (plan) =>
                    String(
                        plan.vehicle_id
                    ) !==
                    String(vehicleId)
            );

        serviceHistory =
            serviceHistory.filter(
                (record) =>
                    String(
                        record.vehicle_id
                    ) !==
                    String(vehicleId)
            );

        soldVehicles.unshift(
            {
                ...vehicle,
                vehicle_status: "sold",
                sold_at: new Date().toISOString()
            }
        );

        renderVehicles();
        renderSoldVehicles();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteSoldVehicle(vehicleId) {
    const vehicle = soldVehicles.find(
        (item) => item.id === vehicleId
    );

    if (!vehicle) {
        return;
    }

    const confirmed =
        window.confirm(
            `Delete ${vehicle.brand} ${vehicle.model} permanently?\n\nThis removes the archived vehicle record from your account.`
        );

    if (!confirmed) {
        return;
    }

    try {
        await window.apiRequest(
            `/api/vehicles/${vehicleId}`,
            {
                method: "DELETE"
            }
        );

        soldVehicles = soldVehicles.filter(
            (item) => item.id !== vehicleId
        );

        renderSoldVehicles();
    } catch (error) {
        alert(error.message);
    }
}

async function logout() {
    logoutButton.disabled = true;

    logoutButton.textContent =
        "Logging out...";

    try {
        await window.apiRequest(
            "/api/auth/logout",
            {
                method: "POST"
            }
        );

        window.location.href =
            "/login.html";
    } catch (error) {
        logoutButton.disabled = false;

        logoutButton.textContent =
            "Log out";

        alert(error.message);
    }
}

logoutButton.addEventListener(
    "click",
    logout
);

if (aiChatForm) {
    aiChatForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const question =
                aiChatInput.value.trim();

            await askGarageAi(question);
        }
    );
}

aiQuickActionButtons.forEach((button) => {
    button.addEventListener(
        "click",
        async () => {
            const question =
                button.dataset.aiQuestion || "";

            await askGarageAi(question);
        }
    );
});

loadDashboard();
loadAiHistory();
