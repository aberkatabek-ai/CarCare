const logoutButton = document.querySelector(
    "#logout-button"
);

const printPassportButton = document.querySelector(
    "#print-passport-button"
);

const exportBuyerPackageButton = document.querySelector(
    "#export-buyer-package-button"
);

const shareVehicleProfileButton =
    document.querySelector(
        "#share-vehicle-profile-button"
    );

const pageLoading = document.querySelector(
    "#vehicle-page-loading"
);

const pageError = document.querySelector(
    "#vehicle-page-error"
);

const pageContent = document.querySelector(
    "#vehicle-page-content"
);

const errorMessage = document.querySelector(
    "#vehicle-error-message"
);

const vehicleTitle = document.querySelector(
    "#vehicle-title"
);

const vehicleSubtitle = document.querySelector(
    "#vehicle-subtitle"
);

const vehicleModelYear = document.querySelector(
    "#vehicle-model-year"
);

const vehicleLicensePlate = document.querySelector(
    "#vehicle-license-plate"
);

const vehiclePassportNumber = document.querySelector(
    "#vehicle-passport-number"
);

const vehicleCurrentMileage = document.querySelector(
    "#vehicle-current-mileage"
);

const vehicleMileageLabel = document.querySelector(
    "#vehicle-mileage-label"
);

const vehicleMileageNote = document.querySelector(
    "#vehicle-mileage-note"
);

const passportOwnerName = document.querySelector(
    "#passport-owner-name"
);

const passportGeneratedAt = document.querySelector(
    "#passport-generated-at"
);

const passportRecordStatus = document.querySelector(
    "#passport-record-status"
);

const ownershipVerificationForm = document.querySelector(
    "#ownership-verification-form"
);

const ownershipVerificationSection =
    ownershipVerificationForm?.closest(
        ".vehicle-detail-section"
    ) || null;

const ownershipDocumentFileInput = document.querySelector(
    "#ownership-document-file"
);

const ownershipDocumentHelp = document.querySelector(
    "#ownership-document-help"
);

const ownershipVerificationMessage = document.querySelector(
    "#ownership-verification-message"
);

const ownershipVerifyButton = document.querySelector(
    "#ownership-verify-button"
);

const vehiclePlanCount = document.querySelector(
    "#vehicle-plan-count"
);

const vehicleAttentionCount = document.querySelector(
    "#vehicle-attention-count"
);

const vehicleServiceCount = document.querySelector(
    "#vehicle-service-count"
);

const vehicleOpenIssueCount = document.querySelector(
    "#vehicle-open-issue-count"
);

const vehicleTotalLiters = document.querySelector(
    "#vehicle-total-liters"
);

const vehicleTotalCost = document.querySelector(
    "#vehicle-total-cost"
);

const vehicleMechanicalScore =
    document.querySelector(
        "#vehicle-mechanical-score"
    );

const vehicleMechanicalTone =
    document.querySelector(
        "#vehicle-mechanical-tone"
    );

const vehicleMechanicalSummary =
    document.querySelector(
        "#vehicle-mechanical-summary"
    );

const vehicleMaintenanceScore =
    document.querySelector(
        "#vehicle-maintenance-score"
    );

const vehicleMaintenanceTone =
    document.querySelector(
        "#vehicle-maintenance-tone"
    );

const vehicleMaintenanceSummary =
    document.querySelector(
        "#vehicle-maintenance-summary"
    );

const vehicleDocumentScore =
    document.querySelector(
        "#vehicle-document-score"
    );

const vehicleDocumentTone =
    document.querySelector(
        "#vehicle-document-tone"
    );

const vehicleDocumentSummary =
    document.querySelector(
        "#vehicle-document-summary"
    );

const vehiclePriorityList =
    document.querySelector(
        "#vehicle-priority-list"
    );
const vehicleForecast30Total =
    document.querySelector(
        "#vehicle-forecast-30-total"
    );
const vehicleForecast90Total =
    document.querySelector(
        "#vehicle-forecast-90-total"
    );
const vehicleForecast30Summary =
    document.querySelector(
        "#vehicle-forecast-30-summary"
    );
const vehicleForecast90Summary =
    document.querySelector(
        "#vehicle-forecast-90-summary"
    );
const vehicleForecastList =
    document.querySelector(
        "#vehicle-forecast-list"
    );

const mileageRecordCount = document.querySelector(
    "#mileage-record-count"
);

const mileageHistoryList = document.querySelector(
    "#mileage-history-list"
);

const vehicleMaintenanceList = document.querySelector(
    "#vehicle-maintenance-list"
);

const maintenanceActionLink = document.querySelector(
    'a[href="/maintenance.html"]'
);

const vehicleServiceList = document.querySelector(
    "#vehicle-service-list"
);

const vehicleTimelineList = document.querySelector(
    "#vehicle-timeline-list"
);

const vehicleIssueList = document.querySelector(
    "#vehicle-issue-list"
);

const vehicleDocumentList = document.querySelector(
    "#vehicle-document-list"
);

const vehicleFuelList = document.querySelector(
    "#vehicle-fuel-list"
);

const vehicleExpenseList = document.querySelector(
    "#vehicle-expense-list"
);

const vehicleFuelCost = document.querySelector(
    "#vehicle-fuel-cost"
);

const vehicleExpenseCost = document.querySelector(
    "#vehicle-expense-cost"
);

let account = null;
let vehicle = null;
let mileageHistory = [];
let maintenancePlans = [];
let serviceHistory = [];
let vehicleIssues = [];
let vehicleDocuments = [];
let fuelRecords = [];
let expenseRecords = [];
let ownershipFilePayload = null;

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function getFirstValue(record, fieldNames, fallback = null) {
    for (const fieldName of fieldNames) {
        const value = record?.[fieldName];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            return value;
        }
    }

    return fallback;
}

function getNumberValue(record, fieldNames) {
    const value = getFirstValue(
        record,
        fieldNames,
        0
    );

    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}

function formatMileage(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "Not scheduled";
    }

    return (
        `${window.formatAppNumber(value, {
            maximumFractionDigits: 0
        })} km`
    );
}

function formatCost(value) {
    return window.formatAppCurrency(value);
}

function formatLiters(value) {
    return (
        `${Number(value || 0).toLocaleString(
            window.getAppIntlLocale(),
            {
                maximumFractionDigits: 2
            }
        )} L`
    );
}

function formatDate(value) {
    if (!value) {
        return "Date not recorded";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date not recorded";
    }

    return date.toLocaleDateString(
        window.getAppIntlLocale(),
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}

function formatDateTime(value) {
    return new Date(value).toLocaleString(
        window.getAppIntlLocale(),
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function formatLabel(value, fallback = "Not specified") {
    if (!value) {
        return fallback;
    }

    return String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}

function getVehicleDisplayName() {
    if (vehicle.nickname) {
        return vehicle.nickname;
    }

    return `${vehicle.brand} ${vehicle.model}`;
}

function belongsToVehicle(record, vehicleId) {
    return (
        String(record.vehicle_id) ===
        String(vehicleId)
    );
}

function getStatusInformation(status) {
    const statuses = {
        overdue: {
            text: "Overdue",
            className: "detail-status-overdue"
        },

        due_soon: {
            text: "Due soon",
            className: "detail-status-due-soon"
        },

        ok: {
            text: "On schedule",
            className: "detail-status-ok"
        },

        not_scheduled: {
            text: "Waiting for baseline",
            className: "detail-status-unscheduled"
        }
    };

    return (
        statuses[status] ||
        statuses.not_scheduled
    );
}

function getIssueStatusInformation(issue) {
    if (issue.status === "repaired") {
        return {
            text: "Repaired",
            className: "detail-status-ok"
        };
    }

    if (issue.status === "diagnosed") {
        return {
            text: "Inspected",
            className: "detail-status-due-soon"
        };
    }

    if (issue.risk_level === "red") {
        return {
            text: "Urgent",
            className: "detail-status-overdue"
        };
    }

    return {
        text: "Reported",
        className: "detail-status-unscheduled"
    };
}

function getDocumentStatusInformation(documentRecord) {
    const statuses = {
        expired: {
            text: "Expired",
            className: "detail-status-overdue"
        },

        due_soon: {
            text: "Due soon",
            className: "detail-status-due-soon"
        },

        ok: {
            text: "Valid",
            className: "detail-status-ok"
        }
    };

    return (
        statuses[documentRecord.renewal_status] ||
        {
            text: formatLabel(
                documentRecord.renewal_status,
                "Recorded"
            ),
            className: "detail-status-unscheduled"
        }
    );
}

function showOwnershipMessage(
    message,
    type = "error"
) {
    if (!ownershipVerificationMessage) {
        return;
    }

    ownershipVerificationMessage.textContent =
        message;
    ownershipVerificationMessage.className =
        `form-message ${type}`;
}

function renderOwnershipVerificationState() {
    if (!vehicle) {
        return;
    }

    if (ownershipVerificationSection) {
        ownershipVerificationSection.hidden =
            vehicle.vehicle_status !==
            "active";
    }

    if (
        vehicle.vehicle_status !==
        "active"
    ) {
        showOwnershipMessage("", "error");
        return;
    }

    if (vehicle.ownership_status === "verified") {
        const verifiedAt =
            vehicle.ownership_verified_at
                ? formatDate(
                    vehicle.ownership_verified_at
                )
                : "recently";

        showOwnershipMessage(
            `Ownership verified successfully. Last successful check: ${verifiedAt}.`,
            "success"
        );

        return;
    }

    if (
        vehicle.ownership_status === "failed" &&
        vehicle.ownership_failure_reason
    ) {
        showOwnershipMessage(
            `${vehicle.ownership_failure_reason} Upload a clearer registration image if needed.`
        );

        return;
    }

    if (
        vehicle.ownership_status === "unverified"
    ) {
        showOwnershipMessage(
            "This plate is saved, but ownership still needs to be verified with a registration image.",
            "error"
        );

        return;
    }

    showOwnershipMessage("", "error");
}

function getOwnershipStatusInformation(status) {
    const statuses = {
        not_started: {
            text: "No plate added",
            className: "detail-status-unscheduled"
        },

        unverified: {
            text: "Registration needed",
            className: "detail-status-due-soon"
        },

        verified: {
            text: "Ownership verified",
            className: "detail-status-ok"
        },

        failed: {
            text: "Verification failed",
            className: "detail-status-overdue"
        }
    };

    return (
        statuses[status] ||
        statuses.unverified
    );
}

function createEmptyState(icon, title, description) {
    const emptyState = createElement(
        "div",
        "vehicle-empty-state"
    );

    emptyState.append(
        createElement(
            "span",
            "vehicle-empty-icon",
            icon
        ),

        createElement(
            "strong",
            "",
            title
        ),

        createElement(
            "p",
            "",
            description
        )
    );

    return emptyState;
}

function formatSignalScore(score) {
    return Number(score).toLocaleString(
        window.getAppIntlLocale(),
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
    if (
        !scoreElement ||
        !toneElement ||
        !summaryElement
    ) {
        return;
    }

    scoreElement.textContent =
        formatSignalScore(metric.score);
    toneElement.textContent = metric.toneLabel;
    toneElement.className =
        `signal-tone ${metric.tone}`;
    summaryElement.textContent =
        metric.summary;
}

function createPriorityItem(priority) {
    const item = createElement(
        "article",
        "priority-item"
    );

    const content = createElement(
        "div",
        "priority-item-content"
    );

    content.append(
        createElement(
            "span",
            "",
            priority.area
        ),
        createElement(
            "strong",
            "",
            priority.title
        ),
        createElement(
            "p",
            "",
            priority.detail
        )
    );

    const badge = createElement(
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
    const card = createElement(
        "article",
        "priority-item"
    );

    const content = createElement(
        "div",
        "priority-item-content"
    );

    content.append(
        createElement(
            "span",
            "",
            item.type
        ),
        createElement(
            "strong",
            "",
            item.title
        ),
        createElement(
            "p",
            "",
            item.detail
        )
    );

    card.append(
        content,
        createElement(
            "span",
            "priority-badge warning",
            formatCost(item.amount)
        )
    );

    return card;
}

function createInformationItem(label, value) {
    const information = createElement(
        "div",
        "vehicle-information-item"
    );

    information.append(
        createElement(
            "span",
            "",
            label
        ),

        createElement(
            "strong",
            "",
            value
        )
    );

    return information;
}

function createStatusBadge(status) {
    return createElement(
        "span",
        `vehicle-detail-status ${status.className}`,
        status.text
    );
}

function createRecordCard(
    className,
    eyebrow,
    title,
    status
) {
    const card = createElement(
        "article",
        className
    );

    const heading = createElement(
        "div",
        "passport-record-heading"
    );

    const titleArea = createElement("div");

    titleArea.append(
        createElement(
            "span",
            "vehicle-plan-category",
            eyebrow
        ),

        createElement(
            "h3",
            "",
            title
        )
    );

    heading.append(
        titleArea,
        createStatusBadge(status)
    );

    card.append(heading);

    return card;
}

function renderVehicleHeader() {
    document.title =
        `${getVehicleDisplayName()} | CarCare`;

    vehicleTitle.textContent =
        getVehicleDisplayName();

    vehicleSubtitle.textContent =
        vehicle.nickname
            ? `${vehicle.brand} ${vehicle.model}`
            : "Registered vehicle profile";

    vehicleModelYear.textContent =
        vehicle.model_year
            ? `Model year: ${vehicle.model_year}`
            : "Model year not specified";

    vehicleLicensePlate.textContent =
        vehicle.license_plate
            ? `License plate: ${vehicle.license_plate}`
            : "License plate not specified";

    vehiclePassportNumber.textContent =
        `Passport #CC-${String(vehicle.id).padStart(
            6,
            "0"
        )}`;

    vehicleCurrentMileage.textContent =
        formatMileage(vehicle.current_mileage);

    if (vehicleMileageLabel) {
        vehicleMileageLabel.textContent =
            vehicle.vehicle_status === "sold"
                ? "Sold mileage"
                : "Current mileage";
    }

    if (vehicleMileageNote) {
        vehicleMileageNote.textContent =
            vehicle.vehicle_status === "sold"
                ? "Mileage at the time this vehicle was marked as sold"
                : "Odometer reductions are not permitted";
    }

    passportOwnerName.textContent =
        account?.full_name || "CarCare account owner";

    passportGeneratedAt.textContent =
        formatDateTime(new Date());

    passportRecordStatus.textContent =
        getOwnershipStatusInformation(
            vehicle.ownership_status
        ).text;

    passportRecordStatus.className =
        `vehicle-detail-status ${
            getOwnershipStatusInformation(
                vehicle.ownership_status
            ).className
        }`;

    if (ownershipDocumentHelp) {
        ownershipDocumentHelp.textContent =
            vehicle.ownership_original_file_name
                ? `Current registration image: ${vehicle.ownership_original_file_name}`
                : "No file selected.";
    }

    renderOwnershipVerificationState();
}

function calculateTotals() {
    const serviceCost = serviceHistory.reduce(
        (total, record) =>
            total + Number(record.actual_cost || 0),
        0
    );

    const fuelCost = fuelRecords.reduce(
        (total, record) =>
            total + getNumberValue(
                record,
                ["total_cost", "cost", "amount"]
            ),
        0
    );

    const expenseCost = expenseRecords.reduce(
        (total, record) =>
            total + getNumberValue(
                record,
                ["amount", "total_cost", "cost"]
            ),
        0
    );

    const totalLiters = fuelRecords.reduce(
        (total, record) =>
            total + getNumberValue(
                record,
                [
                    "liters",
                    "litres",
                    "quantity_liters",
                    "fuel_liters"
                ]
            ),
        0
    );

    return {
        serviceCost,
        fuelCost,
        expenseCost,
        totalLiters,
        ownershipCost:
            serviceCost + fuelCost + expenseCost
    };
}

function renderVehicleInsights() {
    if (!window.garageInsights || !vehicle) {
        return;
    }

    const insight =
        window.garageInsights.assessVehicle({
            vehicle,
            maintenancePlans,
            serviceHistory,
            issues: vehicleIssues,
            documents: vehicleDocuments,
            fuelRecords,
            expenseRecords
        });

    applySignal(
        vehicleMechanicalScore,
        vehicleMechanicalTone,
        vehicleMechanicalSummary,
        insight.metrics.mechanicalConfidence
    );

    applySignal(
        vehicleMaintenanceScore,
        vehicleMaintenanceTone,
        vehicleMaintenanceSummary,
        insight.metrics.maintenanceDiscipline
    );

    applySignal(
        vehicleDocumentScore,
        vehicleDocumentTone,
        vehicleDocumentSummary,
        insight.metrics.documentReadiness
    );

    if (!vehiclePriorityList) {
        return;
    }

    vehiclePriorityList.innerHTML = "";

    if (insight.priorities.length === 0) {
        vehiclePriorityList.append(
            createEmptyState(
                "OK",
                "No urgent next step",
                "This vehicle does not currently show a critical or near-term issue."
            )
        );

        return;
    }

    insight.priorities
        .slice(0, 5)
        .forEach((priority) => {
            vehiclePriorityList.append(
                createPriorityItem(priority)
            );
        });
}

function renderVehicleForecast() {
    if (!window.garageInsights || !vehicle) {
        return;
    }

    const forecast =
        window.garageInsights.buildUpcomingCostForecast({
            vehicle,
            maintenancePlans,
            serviceHistory,
            issues: vehicleIssues,
            documents: vehicleDocuments
        });

    if (
        vehicleForecast30Total &&
        vehicleForecast90Total
    ) {
        vehicleForecast30Total.textContent =
            formatCost(
                forecast.next30DaysTotal
            );
        vehicleForecast90Total.textContent =
            formatCost(
                forecast.next90DaysTotal
            );
    }

    if (vehicleForecast30Summary) {
        vehicleForecast30Summary.textContent =
            forecast.next30DaysTotal > 0
                ? "Likely spend that may land within the next month."
                : "No immediate tracked cost pressure was found.";
    }

    if (vehicleForecast90Summary) {
        vehicleForecast90Summary.textContent =
            forecast.next90DaysTotal > 0
                ? "Wider budget estimate from maintenance, documents and open issues."
                : "Nothing material is forecast from tracked items yet.";
    }

    if (!vehicleForecastList) {
        return;
    }

    vehicleForecastList.innerHTML = "";

    if (forecast.items.length === 0) {
        vehicleForecastList.append(
            createEmptyState(
                "₺",
                "No approaching cost estimate",
                "Tracked maintenance, documents and issues do not currently suggest a near-term spend."
            )
        );

        return;
    }

    forecast.items
        .slice(0, 5)
        .forEach((item) => {
            vehicleForecastList.append(
                createForecastItem(item)
            );
        });
}

function renderSummary() {
    const attentionPlans = maintenancePlans.filter(
        (plan) =>
            plan.status === "overdue" ||
            plan.status === "due_soon"
    );

    const openIssues = vehicleIssues.filter(
        (issue) => issue.status !== "repaired"
    );

    const documentAlerts = vehicleDocuments.filter(
        (documentRecord) =>
            documentRecord.renewal_status ===
                "expired" ||
            documentRecord.renewal_status ===
                "due_soon"
    );

    const totals = calculateTotals();

    vehiclePlanCount.textContent =
        String(maintenancePlans.length);

    vehicleAttentionCount.textContent = String(
        attentionPlans.length +
        openIssues.length +
        documentAlerts.length
    );

    vehicleServiceCount.textContent =
        String(serviceHistory.length);

    vehicleOpenIssueCount.textContent =
        String(openIssues.length);

    vehicleTotalLiters.textContent =
        formatLiters(totals.totalLiters);

    vehicleTotalCost.textContent =
        formatCost(totals.ownershipCost);

    vehicleFuelCost.textContent =
        formatCost(totals.fuelCost);

    vehicleExpenseCost.textContent =
        formatCost(totals.expenseCost);

    vehicleAttentionCount
        .closest(".vehicle-summary-card")
        .classList.toggle(
            "has-attention",
            Number(vehicleAttentionCount.textContent) > 0
        );
}

function renderMileageHistory() {
    mileageHistoryList.innerHTML = "";

    const countText =
        mileageHistory.length === 1
            ? "1 update"
            : `${mileageHistory.length} updates`;

    mileageRecordCount.textContent = countText;

    if (mileageHistory.length === 0) {
        mileageHistoryList.append(
            createEmptyState(
                "↗",
                "No mileage changes yet",
                "Future odometer updates will be recorded here permanently."
            )
        );

        return;
    }

    const timeline = createElement(
        "div",
        "mileage-timeline"
    );

    mileageHistory.forEach(
        (record, index) => {
            const item = createElement(
                "article",
                "mileage-record"
            );

            const marker = createElement(
                "span",
                "mileage-marker",
                String(mileageHistory.length - index)
            );

            const content = createElement(
                "div",
                "mileage-record-content"
            );

            const heading = createElement(
                "div",
                "mileage-record-heading"
            );

            const changeAmount =
                Number(record.new_mileage) -
                Number(record.previous_mileage);

            heading.append(
                createElement(
                    "strong",
                    "",
                    `${formatMileage(
                        record.previous_mileage
                    )} → ${formatMileage(
                        record.new_mileage
                    )}`
                ),

                createElement(
                    "span",
                    "mileage-increase",
                    `+${formatMileage(changeAmount)}`
                )
            );

            content.append(
                heading,

                createElement(
                    "p",
                    "",
                    formatDate(record.recorded_at)
                )
            );

            item.append(marker, content);
            timeline.append(item);
        }
    );

    mileageHistoryList.append(timeline);
}

function renderMaintenancePlans() {
    vehicleMaintenanceList.innerHTML = "";

    if (maintenanceActionLink) {
        maintenanceActionLink.hidden =
            vehicle?.vehicle_status !==
            "active";
    }

    if (maintenancePlans.length === 0) {
        vehicleMaintenanceList.append(
            createEmptyState(
                "M",
                "No maintenance plans",
                vehicle?.vehicle_status ===
                    "active"
                    ? "Create a maintenance plan to begin tracking upcoming work."
                    : "This vehicle is marked as sold, so new maintenance plans are no longer available."
            )
        );

        return;
    }

    const statusPriority = {
        overdue: 0,
        due_soon: 1,
        ok: 2,
        not_scheduled: 3
    };

    const sortedPlans = [...maintenancePlans].sort(
        (firstPlan, secondPlan) =>
            (
                statusPriority[firstPlan.status] ?? 4
            ) -
            (
                statusPriority[secondPlan.status] ?? 4
            )
    );

    const planGrid = createElement(
        "div",
        "vehicle-plan-list"
    );

    sortedPlans.forEach((plan) => {
        const card = createElement(
            "article",
            "vehicle-plan-card"
        );

        if (plan.is_critical) {
            card.classList.add(
                "critical-vehicle-plan"
            );
        }

        const heading = createElement(
            "div",
            "vehicle-plan-heading"
        );

        const titleArea = createElement("div");

        titleArea.append(
            createElement(
                "span",
                "vehicle-plan-category",
                plan.category || "Maintenance"
            ),

            createElement(
                "h3",
                "",
                plan.name
            )
        );

        heading.append(
            titleArea,
            createStatusBadge(
                getStatusInformation(plan.status)
            )
        );

        const informationGrid = createElement(
            "div",
            "vehicle-information-grid"
        );

        const intervalParts = [];

        if (plan.interval_km !== null) {
            intervalParts.push(
                formatMileage(plan.interval_km)
            );
        }

        if (plan.interval_months !== null) {
            intervalParts.push(
                `${plan.interval_months} months`
            );
        }

        informationGrid.append(
            createInformationItem(
                "Interval",
                intervalParts.length > 0
                    ? intervalParts.join(" / ")
                    : "Not specified"
            ),

            createInformationItem(
                "Next due mileage",
                formatMileage(plan.next_due_mileage)
            ),

            createInformationItem(
                "Next due date",
                plan.next_due_date
                    ? formatDate(plan.next_due_date)
                    : "Not scheduled"
            ),

            createInformationItem(
                "Estimated cost",
                plan.estimated_cost === null
                    ? "Not specified"
                    : formatCost(plan.estimated_cost)
            )
        );

        card.append(heading, informationGrid);
        planGrid.append(card);
    });

    vehicleMaintenanceList.append(planGrid);
}

function renderServiceHistory() {
    vehicleServiceList.innerHTML = "";

    if (serviceHistory.length === 0) {
        vehicleServiceList.append(
            createEmptyState(
                "S",
                "No completed services",
                "Complete a maintenance plan to create a permanent service record."
            )
        );

        return;
    }

    const sortedHistory = [...serviceHistory].sort(
        (firstRecord, secondRecord) =>
            new Date(secondRecord.completed_at) -
            new Date(firstRecord.completed_at)
    );

    const serviceGrid = createElement(
        "div",
        "vehicle-service-grid"
    );

    sortedHistory.forEach((record) => {
        const card = createElement(
            "article",
            "vehicle-service-record"
        );

        const heading = createElement(
            "div",
            "vehicle-service-heading"
        );

        const titleArea = createElement("div");

        titleArea.append(
            createElement(
                "span",
                "vehicle-plan-category",
                record.category || "Maintenance"
            ),

            createElement(
                "h3",
                "",
                record.service_name
            ),

            createElement(
                "p",
                "",
                formatDate(record.completed_at)
            )
        );

        const actualCost = createElement(
            "strong",
            "vehicle-service-cost",
            record.actual_cost === null
                ? "Cost not specified"
                : formatCost(record.actual_cost)
        );

        heading.append(titleArea, actualCost);

        const informationGrid = createElement(
            "div",
            "vehicle-information-grid"
        );

        informationGrid.append(
            createInformationItem(
                "Completed mileage",
                formatMileage(
                    record.completed_at_mileage
                )
            ),

            createInformationItem(
                "Service provider",
                record.service_provider ||
                    "Not specified"
            ),

            createInformationItem(
                "Estimated cost",
                record.estimated_cost === null
                    ? "Not specified"
                    : formatCost(record.estimated_cost)
            ),

            createInformationItem(
                "Actual cost",
                record.actual_cost === null
                    ? "Not specified"
                    : formatCost(record.actual_cost)
            )
        );

        card.append(heading, informationGrid);

        if (record.notes) {
            const notes = createElement(
                "div",
                "vehicle-service-notes"
            );

            notes.append(
                createElement("span", "", "Notes"),
                createElement("p", "", record.notes)
            );

            card.append(notes);
        }

        serviceGrid.append(card);
    });

    vehicleServiceList.append(serviceGrid);
}

function renderTimeline() {
    if (!vehicleTimelineList) {
        return;
    }

    vehicleTimelineList.innerHTML = "";

    const events = [];

    mileageHistory.forEach((record) => {
        events.push({
            type: "Mileage update",
            title: `${formatMileage(record.previous_mileage)} -> ${formatMileage(record.new_mileage)}`,
            date: record.recorded_at,
            meta: "Mileage history"
        });
    });

    serviceHistory.forEach((record) => {
        events.push({
            type: "Service",
            title: record.service_name,
            date: record.completed_at,
            meta:
                record.actual_cost === null ||
                record.actual_cost === undefined
                    ? "No cost recorded"
                    : formatCost(
                        record.actual_cost
                    )
        });
    });

    vehicleDocuments.forEach((documentRecord) => {
        events.push({
            type: "Document",
            title: documentRecord.title,
            date: documentRecord.expiry_date,
            meta: formatLabel(
                documentRecord.document_type,
                "Document"
            )
        });
    });

    vehicleIssues.forEach((issue) => {
        events.push({
            type: "Issue",
            title: issue.issue_title,
            date:
                issue.resolved_at ||
                issue.created_at,
            meta:
                issue.status === "repaired"
                    ? "Repaired"
                    : "Reported"
        });
    });

    fuelRecords.forEach((record) => {
        events.push({
            type: "Fuel",
            title: getFirstValue(
                record,
                ["station"],
                "Fuel fill-up"
            ),
            date: getFirstValue(record, [
                "filled_at",
                "date",
                "created_at"
            ]),
            meta: formatLiters(
                getNumberValue(record, [
                    "liters",
                    "litres",
                    "fuel_liters"
                ])
            )
        });
    });

    expenseRecords.forEach((record) => {
        events.push({
            type: "Expense",
            title: getFirstValue(
                record,
                ["title", "expense_type"],
                "Expense"
            ),
            date: getFirstValue(record, [
                "expense_date",
                "date",
                "created_at"
            ]),
            meta: formatCost(
                getNumberValue(record, [
                    "amount",
                    "cost"
                ])
            )
        });
    });

    if (vehicle.sold_at) {
        events.push({
            type: "Sale",
            title: "Vehicle marked as sold",
            date: vehicle.sold_at,
            meta: formatMileage(
                vehicle.current_mileage
            )
        });
    }

    events.sort(
        (firstEvent, secondEvent) =>
            new Date(secondEvent.date) -
            new Date(firstEvent.date)
    );

    if (events.length === 0) {
        vehicleTimelineList.append(
            createEmptyState(
                "T",
                "No timeline events",
                "Vehicle activity will appear here as records are added."
            )
        );

        return;
    }

    const list = createElement(
        "div",
        "passport-transaction-list"
    );

    events.slice(0, 20).forEach((event) => {
        const item = createElement(
            "article",
            "passport-transaction"
        );

        const content = createElement("div");

        content.append(
            createElement(
                "strong",
                "",
                event.title
            ),
            createElement(
                "span",
                "",
                `${event.type} • ${formatTimelineDate(event.date)} • ${event.meta}`
            )
        );

        item.append(
            content,
            createElement(
                "strong",
                "transaction-cost",
                event.type
            )
        );

        list.append(item);
    });

    vehicleTimelineList.append(list);
}

function renderIssues() {
    vehicleIssueList.innerHTML = "";

    if (vehicleIssues.length === 0) {
        vehicleIssueList.append(
            createEmptyState(
                "H",
                "No health issues recorded",
                "Reported symptoms and completed repairs will appear here."
            )
        );

        return;
    }

    const statusPriority = {
        reported: 0,
        diagnosed: 1,
        repaired: 2
    };

    const list = createElement(
        "div",
        "passport-record-list"
    );

    [...vehicleIssues]
        .sort(
            (firstIssue, secondIssue) =>
                (
                    statusPriority[firstIssue.status] ?? 3
                ) -
                (
                    statusPriority[secondIssue.status] ?? 3
                )
        )
        .forEach((issue) => {
            const card = createRecordCard(
                "passport-record-card issue-record-card",
                issue.category || "Vehicle health",
                issue.issue_title || "Reported issue",
                getIssueStatusInformation(issue)
            );

            const informationGrid = createElement(
                "div",
                "vehicle-information-grid"
            );

            informationGrid.append(
                createInformationItem(
                    "Reported mileage",
                    formatMileage(issue.current_mileage)
                ),

                createInformationItem(
                    "Severity",
                    formatLabel(issue.severity)
                ),

                createInformationItem(
                    "Risk",
                    formatLabel(issue.risk_level)
                ),

                createInformationItem(
                    "Reported",
                    formatDate(issue.created_at)
                )
            );

            card.append(informationGrid);

            const note =
                issue.status === "repaired"
                    ? issue.resolution_notes
                    : issue.mechanic_diagnosis ||
                        issue.description;

            if (note) {
                card.append(
                    createElement(
                        "p",
                        "passport-record-note",
                        note
                    )
                );
            }

            if (
                issue.recurring_issue_detected
            ) {
                card.append(
                    createElement(
                        "p",
                        "passport-record-note",
                        `Recurring issue: ${issue.previous_similar_issue_count} similar record${issue.previous_similar_issue_count === 1 ? "" : "s"} were reported before this one.`
                    )
                );
            }

            list.append(card);
        });

    vehicleIssueList.append(list);
}

function renderDocuments() {
    vehicleDocumentList.innerHTML = "";

    if (vehicleDocuments.length === 0) {
        vehicleDocumentList.append(
            createEmptyState(
                "D",
                "No documents recorded",
                "Insurance, inspection and other renewal records will appear here."
            )
        );

        return;
    }

    const list = createElement(
        "div",
        "passport-record-list"
    );

    [...vehicleDocuments]
        .sort(
            (firstRecord, secondRecord) =>
                new Date(firstRecord.expiry_date) -
                new Date(secondRecord.expiry_date)
        )
        .forEach((documentRecord) => {
            const card = createRecordCard(
                "passport-record-card document-record-card",
                formatLabel(
                    getFirstValue(
                        documentRecord,
                        ["document_type", "category"],
                        "Document"
                    )
                ),
                documentRecord.title || "Vehicle document",
                getDocumentStatusInformation(
                    documentRecord
                )
            );

            const informationGrid = createElement(
                "div",
                "vehicle-information-grid"
            );

            const remainingDays = Number(
                documentRecord.days_remaining
            );

            informationGrid.append(
                createInformationItem(
                    "Expiry date",
                    formatDate(documentRecord.expiry_date)
                ),

                createInformationItem(
                    "Time remaining",
                    Number.isFinite(remainingDays)
                        ? remainingDays < 0
                            ? `${Math.abs(remainingDays)} days overdue`
                            : `${remainingDays} days`
                        : "Not calculated"
                )
            );

            card.append(informationGrid);

            if (documentRecord.notes) {
                card.append(
                    createElement(
                        "p",
                        "passport-record-note",
                        documentRecord.notes
                    )
                );
            }

            list.append(card);
        });

    vehicleDocumentList.append(list);
}

function renderFuelHistory() {
    vehicleFuelList.innerHTML = "";

    if (fuelRecords.length === 0) {
        vehicleFuelList.append(
            createEmptyState(
                "F",
                "No fuel records",
                "Fuel fill-ups entered in Cost Center will appear here."
            )
        );

        return;
    }

    const list = createElement(
        "div",
        "passport-transaction-list"
    );

    [...fuelRecords]
        .sort((firstRecord, secondRecord) => {
            const firstDate = getFirstValue(
                firstRecord,
                ["fill_date", "fuel_date", "date", "created_at"]
            );

            const secondDate = getFirstValue(
                secondRecord,
                ["fill_date", "fuel_date", "date", "created_at"]
            );

            return new Date(secondDate) - new Date(firstDate);
        })
        .forEach((record) => {
            const liters = getNumberValue(
                record,
                [
                    "liters",
                    "litres",
                    "quantity_liters",
                    "fuel_liters"
                ]
            );

            const totalCost = getNumberValue(
                record,
                ["total_cost", "cost", "amount"]
            );

            const date = getFirstValue(
                record,
                ["fill_date", "fuel_date", "date", "created_at"]
            );

            const mileage = getFirstValue(
                record,
                ["mileage", "odometer", "current_mileage"]
            );

            const station = getFirstValue(
                record,
                ["fuel_station", "station", "vendor"],
                "Fuel fill-up"
            );

            const item = createElement(
                "article",
                "passport-transaction"
            );

            const content = createElement("div");

            content.append(
                createElement("strong", "", station),
                createElement(
                    "span",
                    "",
                    `${formatDate(date)} • ${
                        mileage === null
                            ? "Mileage not recorded"
                            : formatMileage(mileage)
                    } • ${formatLiters(liters)}`
                )
            );

            item.append(
                content,
                createElement(
                    "strong",
                    "transaction-cost",
                    formatCost(totalCost)
                )
            );

            list.append(item);
        });

    vehicleFuelList.append(list);
}

function renderExpenses() {
    vehicleExpenseList.innerHTML = "";

    if (expenseRecords.length === 0) {
        vehicleExpenseList.append(
            createEmptyState(
                "E",
                "No other expenses",
                "Insurance, parking, tax and other costs will appear here."
            )
        );

        return;
    }

    const list = createElement(
        "div",
        "passport-transaction-list"
    );

    [...expenseRecords]
        .sort((firstRecord, secondRecord) => {
            const firstDate = getFirstValue(
                firstRecord,
                ["expense_date", "date", "created_at"]
            );

            const secondDate = getFirstValue(
                secondRecord,
                ["expense_date", "date", "created_at"]
            );

            return new Date(secondDate) - new Date(firstDate);
        })
        .forEach((record) => {
            const title = getFirstValue(
                record,
                [
                    "title",
                    "description",
                    "expense_type",
                    "category"
                ],
                "Vehicle expense"
            );

            const category = getFirstValue(
                record,
                ["category", "expense_type"],
                "Other expense"
            );

            const date = getFirstValue(
                record,
                ["expense_date", "date", "created_at"]
            );

            const amount = getNumberValue(
                record,
                ["amount", "total_cost", "cost"]
            );

            const item = createElement(
                "article",
                "passport-transaction"
            );

            const content = createElement("div");

            content.append(
                createElement("strong", "", title),
                createElement(
                    "span",
                    "",
                    `${formatDate(date)} • ${formatLabel(category)}`
                )
            );

            item.append(
                content,
                createElement(
                    "strong",
                    "transaction-cost",
                    formatCost(amount)
                )
            );

            list.append(item);
        });

    vehicleExpenseList.append(list);
}

function renderVehiclePage() {
    renderVehicleHeader();
    renderVehicleInsights();
    renderVehicleForecast();
    renderSummary();
    renderMileageHistory();
    renderMaintenancePlans();
    renderServiceHistory();
    renderTimeline();
    renderIssues();
    renderDocuments();
    renderFuelHistory();
    renderExpenses();

    pageLoading.hidden = true;
    pageError.hidden = true;
    pageContent.hidden = false;
}

function showVehicleError(message) {
    pageLoading.hidden = true;
    pageContent.hidden = true;
    pageError.hidden = false;

    errorMessage.textContent = message;
}

async function requestOptionalList(
    url,
    responseProperties
) {
    try {
        const data = await window.apiRequest(url);

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
    } catch (error) {
        console.warn(
            `Optional passport source failed: ${url}`,
            error
        );

        return [];
    }
}

async function loadVehiclePage() {
    const parameters = new URLSearchParams(
        window.location.search
    );

    const vehicleId = Number(parameters.get("id"));

    if (
        !Number.isInteger(vehicleId) ||
        vehicleId <= 0
    ) {
        showVehicleError(
            "A valid vehicle ID was not provided."
        );

        return;
    }

    try {
        const accountData = await window.apiRequest(
            "/api/auth/me"
        );

        account = accountData.user;
    } catch (error) {
        if (
            window.handlePageLoadError(
                error
            )
        ) {
            return;
        }

        showVehicleError(
            error.message ||
                "Account information could not be loaded."
        );

        return;
    }

    try {
        const [
            vehicleData,
            mileageData,
            maintenanceData,
            historyData,
            allIssues,
            allDocuments,
            allFuelRecords,
            allExpenseRecords
        ] = await Promise.all([
            window.apiRequest(
                `/api/vehicles/${vehicleId}`
            ),

            window.apiRequest(
                `/api/vehicles/${vehicleId}/mileage-history`
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
                `/api/documents?vehicleId=${vehicleId}`,
                "documents"
            ),

            requestOptionalList(
                `/api/costs/fuel?vehicleId=${vehicleId}`,
                [
                    "fuelRecords",
                    "fuelEntries",
                    "fillUps",
                    "fuel"
                ]
            ),

            requestOptionalList(
                `/api/costs/expenses?vehicleId=${vehicleId}`,
                ["expenses", "expenseRecords"]
            )
        ]);

        vehicle = vehicleData.vehicle;

        mileageHistory =
            mileageData.mileageHistory || [];

        maintenancePlans = (
            maintenanceData.maintenancePlans || []
        ).filter((plan) =>
            belongsToVehicle(plan, vehicleId)
        );

        serviceHistory = (
            historyData.serviceHistory || []
        ).filter((record) =>
            belongsToVehicle(record, vehicleId)
        );

        vehicleIssues = allIssues.filter((issue) =>
            belongsToVehicle(issue, vehicleId)
        );

        vehicleDocuments = allDocuments.filter(
            (documentRecord) =>
                belongsToVehicle(
                    documentRecord,
                    vehicleId
                )
        );

        fuelRecords = allFuelRecords.filter(
            (record) =>
                !record.vehicle_id ||
                belongsToVehicle(record, vehicleId)
        );

        expenseRecords = allExpenseRecords.filter(
            (record) =>
                !record.vehicle_id ||
                belongsToVehicle(record, vehicleId)
        );

        renderVehiclePage();
    } catch (error) {
        console.error(error);

        showVehicleError(
            error.message ||
                "Vehicle information could not be loaded."
        );
    }
}

function printVehiclePassport() {
    if (!vehicle) {
        return;
    }

    passportGeneratedAt.textContent =
        formatDateTime(new Date());

    const originalTitle = document.title;

    document.title =
        `CarCare Vehicle Passport - ${getVehicleDisplayName()}`;

    window.print();

    document.title = originalTitle;
}

async function logout() {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging out...";

    try {
        await window.apiRequest(
            "/api/auth/logout",
            {
                method: "POST"
            }
        );

        window.location.href = "/login.html";
    } catch (error) {
        logoutButton.disabled = false;
        logoutButton.textContent = "Log out";

        alert(error.message);
    }
}

async function exportBuyerPackage() {
    if (!vehicle || !exportBuyerPackageButton) {
        return;
    }

    window.location.href =
        `/buyer-package.html?id=${vehicle.id}`;
}

async function copyVehicleShareLink() {
    if (
        !vehicle ||
        !shareVehicleProfileButton
    ) {
        return;
    }

    shareVehicleProfileButton.disabled = true;
    shareVehicleProfileButton.textContent =
        "Preparing...";

    try {
        const data = await window.apiRequest(
            `/api/vehicles/${vehicle.id}/share-link`
        );

        await window.navigator.clipboard.writeText(
            data.shareUrl
        );

        shareVehicleProfileButton.textContent =
            "Link copied";

        window.setTimeout(() => {
            shareVehicleProfileButton.textContent =
                "Copy share link";
        }, 1800);
    } catch (error) {
        shareVehicleProfileButton.textContent =
            "Copy share link";
        window.alert(error.message);
    } finally {
        shareVehicleProfileButton.disabled =
            false;
    }
}

if (ownershipDocumentFileInput) {
    ownershipDocumentFileInput.addEventListener(
        "change",
        async () => {
            const [selectedFile] =
                ownershipDocumentFileInput.files || [];

            ownershipFilePayload = null;

            if (!selectedFile) {
                ownershipDocumentHelp.textContent =
                    vehicle?.ownership_original_file_name
                        ? `Current registration image: ${vehicle.ownership_original_file_name}`
                        : "No file selected.";
                return;
            }

            const contentBase64 =
                await new Promise(
                    (resolve, reject) => {
                        const reader =
                            new FileReader();

                        reader.onload = () => {
                            const result =
                                typeof reader.result ===
                                "string"
                                    ? reader.result
                                    : "";

                            const base64 =
                                result.includes(",")
                                    ? result.split(",")[1]
                                    : "";

                            if (!base64) {
                                reject(
                                    new Error(
                                        "Selected file could not be read."
                                    )
                                );
                                return;
                            }

                            resolve(base64);
                        };

                        reader.onerror = () => {
                            reject(
                                new Error(
                                    "Selected file could not be read."
                                )
                            );
                        };

                        reader.readAsDataURL(
                            selectedFile
                        );
                    }
                ).catch((error) => {
                    showOwnershipMessage(
                        error.message
                    );
                    return null;
                });

            if (!contentBase64) {
                ownershipDocumentFileInput.value =
                    "";
                return;
            }

            ownershipFilePayload = {
                name: selectedFile.name,
                type: selectedFile.type,
                contentBase64
            };

            ownershipDocumentHelp.textContent =
                `${selectedFile.name} selected`;
        }
    );
}

function formatTimelineDate(value) {
    if (!value) {
        return "Unknown date";
    }

    return new Date(value).toLocaleDateString(
        window.getAppIntlLocale(),
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

if (ownershipVerificationForm) {
    ownershipVerificationForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            if (!vehicle) {
                return;
            }

            showOwnershipMessage("");

            ownershipVerifyButton.disabled =
                true;
            ownershipVerifyButton.textContent =
                "Verifying...";

            try {
                const data =
                    await window.apiRequest(
                        `/api/vehicles/${vehicle.id}/verify-ownership`,
                        {
                            method: "POST",
                            body: JSON.stringify({
                                file: ownershipFilePayload
                            })
                        }
                    );

                vehicle = {
                    ...vehicle,
                    ...data.vehicle
                };

                renderVehicleHeader();
                renderVehicleInsights();

                showOwnershipMessage(
                    `${data.message} Score: ${data.verification.score}`,
                    data.verification.status ===
                        "verified"
                        ? "success"
                        : "error"
                );
            } catch (error) {
                showOwnershipMessage(
                    error.message
                );
            } finally {
                ownershipVerifyButton.disabled =
                    false;
                ownershipVerifyButton.textContent =
                    "Verify ownership";
            }
        }
    );
}

const dashboardLink = document.querySelector(
    'a[href="/index.html"]'
);

if (dashboardLink) {
    dashboardLink.classList.add("active");
}

printPassportButton.addEventListener(
    "click",
    printVehiclePassport
);

if (exportBuyerPackageButton) {
    exportBuyerPackageButton.addEventListener(
        "click",
        exportBuyerPackage
    );
}

if (shareVehicleProfileButton) {
    shareVehicleProfileButton.addEventListener(
        "click",
        copyVehicleShareLink
    );
}

window.addEventListener(
    "beforeprint",
    () => {
        passportGeneratedAt.textContent =
            formatDateTime(new Date());
    }
);

logoutButton.addEventListener("click", logout);

loadVehiclePage();
