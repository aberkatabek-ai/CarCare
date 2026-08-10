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

const garageStatusBadge =
    document.querySelector(
        "#garage-status-badge"
    );

let vehicles = [];
let soldVehicles = [];
let maintenancePlans = [];
let serviceHistory = [];
let vehicleIssues = [];
let vehicleDocuments = [];

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
    renderMaintenanceOverview();
    renderRecentServices();
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
            documentData
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

loadDashboard();
