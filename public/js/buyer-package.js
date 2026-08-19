const loadingState = document.querySelector(
    "#buyer-package-loading"
);

const errorState = document.querySelector(
    "#buyer-package-error"
);

const errorMessage = document.querySelector(
    "#buyer-package-error-message"
);

const content = document.querySelector(
    "#buyer-package-content"
);

const titleElement = document.querySelector(
    "#buyer-package-title"
);

const subtitleElement = document.querySelector(
    "#buyer-package-subtitle"
);

const vehicleNameElement = document.querySelector(
    "#buyer-package-vehicle-name"
);

const plateElement = document.querySelector(
    "#buyer-package-plate"
);

const generatedAtElement = document.querySelector(
    "#buyer-package-generated-at"
);

const statusElement = document.querySelector(
    "#buyer-package-status"
);

const reportIdElement = document.querySelector(
    "#buyer-package-report-id"
);

const mileageElement = document.querySelector(
    "#buyer-package-mileage"
);

const serviceCountElement = document.querySelector(
    "#buyer-package-service-count"
);

const documentCountElement = document.querySelector(
    "#buyer-package-document-count"
);

const costTotalElement = document.querySelector(
    "#buyer-package-cost-total"
);

const summaryGrid = document.querySelector(
    "#buyer-package-summary-grid"
);

const handoverGrid = document.querySelector(
    "#buyer-package-handover-grid"
);

const ownershipCard = document.querySelector(
    "#buyer-package-ownership-card"
);

const serviceList = document.querySelector(
    "#buyer-package-service-list"
);

const documentList = document.querySelector(
    "#buyer-package-document-list"
);

const issueList = document.querySelector(
    "#buyer-package-issue-list"
);

const fuelList = document.querySelector(
    "#buyer-package-fuel-list"
);

const expenseList = document.querySelector(
    "#buyer-package-expense-list"
);

const mileageList = document.querySelector(
    "#buyer-package-mileage-list"
);

const backLink = document.querySelector(
    "#buyer-package-back-link"
);

const printButton = document.querySelector(
    "#buyer-package-print-button"
);

function hasValue(value) {
    return (
        value !== undefined &&
        value !== null &&
        value !== ""
    );
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function formatDate(value) {
    if (!hasValue(value)) {
        return "Not recorded";
    }

    return new Date(value).toLocaleDateString(
        window.getAppIntlLocale(),
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}

function formatDateTime(value) {
    if (!hasValue(value)) {
        return "Not recorded";
    }

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

function formatMileage(value) {
    if (!hasValue(value)) {
        return "Not recorded";
    }

    return `${window.formatAppNumber(value, {
        maximumFractionDigits: 0
    })} km`;
}

function formatCost(value) {
    if (!hasValue(value)) {
        return "Not recorded";
    }

    return window.formatAppCurrency(value);
}

function formatLiters(value) {
    if (!hasValue(value)) {
        return "Not recorded";
    }

    return `${Number(value).toLocaleString(window.getAppIntlLocale(), {
        maximumFractionDigits: 2
    })} L`;
}

function formatLabel(value, fallback = "Not specified") {
    if (!hasValue(value)) {
        return fallback;
    }

    return String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) =>
            character.toUpperCase()
        );
}

function createDetailCard(label, value) {
    const card = createElement(
        "div",
        "buyer-package-detail-card"
    );

    card.append(
        createElement("span", "", label),
        createElement(
            "strong",
            "",
            value
        )
    );

    return card;
}

function createEmptyState(message) {
    return createElement(
        "div",
        "buyer-package-empty-state",
        message
    );
}

function createRecordGrid(details) {
    const grid = createElement(
        "div",
        "buyer-package-record-grid"
    );

    details.forEach((detail) => {
        const item = document.createElement("div");

        item.append(
            createElement(
                "span",
                "",
                detail.label
            ),
            createElement(
                "strong",
                "",
                detail.value
            )
        );

        grid.append(item);
    });

    return grid;
}

function createRecordList(records, createRecord) {
    if (records.length === 0) {
        return createEmptyState(
            "No records available."
        );
    }

    const list = createElement(
        "div",
        "buyer-package-record-list"
    );

    records.forEach((record) => {
        list.append(createRecord(record));
    });

    return list;
}

function buildReportReference(vehicleId, exportedAt) {
    const exportDate = new Date(exportedAt);
    const year = exportDate.getFullYear();
    const month = String(
        exportDate.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
        exportDate.getDate()
    ).padStart(2, "0");

    return `CCR-${vehicleId}-${year}${month}${day}`;
}

function createServiceRecord(record) {
    const card = createElement(
        "article",
        "buyer-package-record"
    );

    const heading = createElement(
        "div",
        "buyer-package-record-heading"
    );

    const titleArea = document.createElement("div");

    titleArea.append(
        createElement(
            "strong",
            "",
            record.service_name
        ),
        createElement(
            "span",
            "",
            formatDate(record.completed_at)
        )
    );

    heading.append(
        titleArea,
        createElement(
            "span",
            "buyer-package-record-badge",
            hasValue(record.actual_cost)
                ? formatCost(record.actual_cost)
                : "No cost"
        )
    );

    card.append(
        heading,
        createRecordGrid([
            {
                label: "Mileage",
                value: formatMileage(
                    record.completed_at_mileage
                )
            },
            {
                label: "Provider",
                value:
                    record.service_provider ||
                    "Not specified"
            }
        ])
    );

    if (record.notes) {
        card.append(
            createElement(
                "p",
                "buyer-package-record-note",
                record.notes
            )
        );
    }

    return card;
}

function createDocumentRecord(record) {
    const card = createElement(
        "article",
        "buyer-package-record"
    );

    const heading = createElement(
        "div",
        "buyer-package-record-heading"
    );

    const titleArea = document.createElement("div");

    titleArea.append(
        createElement(
            "strong",
            "",
            record.title
        ),
        createElement(
            "span",
            "",
            formatLabel(
                record.document_type,
                "Document"
            )
        )
    );

    heading.append(
        titleArea,
        createElement(
            "span",
            "buyer-package-record-badge",
            formatDate(record.expiry_date)
        )
    );

    card.append(
        heading,
        createRecordGrid([
            {
                label: "Provider",
                value:
                    record.provider ||
                    "Not specified"
            },
            {
                label: "Reminder",
                value: hasValue(
                    record.reminder_days
                )
                    ? `${record.reminder_days} days before`
                    : "Not configured"
            }
        ])
    );

    if (record.notes) {
        card.append(
            createElement(
                "p",
                "buyer-package-record-note",
                record.notes
            )
        );
    }

    return card;
}

function createIssueRecord(record) {
    const card = createElement(
        "article",
        "buyer-package-record"
    );

    const heading = createElement(
        "div",
        "buyer-package-record-heading"
    );

    const titleArea = document.createElement("div");

    titleArea.append(
        createElement(
            "strong",
            "",
            record.issue_title
        ),
        createElement(
            "span",
            "",
            formatDate(record.created_at)
        )
    );

    heading.append(
        titleArea,
        createElement(
            "span",
            "buyer-package-record-badge",
            formatLabel(
                record.status,
                "Status"
            )
        )
    );

    card.append(
        heading,
        createRecordGrid([
            {
                label: "Category",
                value: formatLabel(
                    record.category,
                    "Other"
                )
            },
            {
                label: "Risk",
                value: formatLabel(
                    record.risk_level,
                    "Unknown"
                )
            }
        ])
    );

    if (record.description) {
        card.append(
            createElement(
                "p",
                "buyer-package-record-note",
                record.description
            )
        );
    }

    if (record.resolution_notes) {
        card.append(
            createElement(
                "p",
                "buyer-package-record-note",
                `Repair note: ${record.resolution_notes}`
            )
        );
    }

    return card;
}

function createFuelRecord(record) {
    const card = createElement(
        "article",
        "buyer-package-record"
    );

    const heading = createElement(
        "div",
        "buyer-package-record-heading"
    );

    const titleArea = document.createElement("div");

    titleArea.append(
        createElement(
            "strong",
            "",
            record.station || "Fuel fill-up"
        ),
        createElement(
            "span",
            "",
            formatDate(record.filled_at)
        )
    );

    heading.append(
        titleArea,
        createElement(
            "span",
            "buyer-package-record-badge",
            formatCost(record.total_cost)
        )
    );

    card.append(
        heading,
        createRecordGrid([
            {
                label: "Mileage",
                value: formatMileage(
                    record.odometer_km
                )
            },
            {
                label: "Fuel amount",
                value: formatLiters(
                    record.liters
                )
            }
        ])
    );

    if (record.notes) {
        card.append(
            createElement(
                "p",
                "buyer-package-record-note",
                record.notes
            )
        );
    }

    return card;
}

function createExpenseRecord(record) {
    const card = createElement(
        "article",
        "buyer-package-record"
    );

    const heading = createElement(
        "div",
        "buyer-package-record-heading"
    );

    const titleArea = document.createElement("div");

    titleArea.append(
        createElement(
            "strong",
            "",
            record.title
        ),
        createElement(
            "span",
            "",
            formatDate(record.expense_date)
        )
    );

    heading.append(
        titleArea,
        createElement(
            "span",
            "buyer-package-record-badge",
            formatCost(record.amount)
        )
    );

    card.append(
        heading,
        createRecordGrid([
            {
                label: "Type",
                value: formatLabel(
                    record.expense_type,
                    "Expense"
                )
            },
            {
                label: "Provider",
                value:
                    record.provider ||
                    "Not specified"
            }
        ])
    );

    if (record.notes) {
        card.append(
            createElement(
                "p",
                "buyer-package-record-note",
                record.notes
            )
        );
    }

    return card;
}

function createMileageRecord(record) {
    const card = createElement(
        "article",
        "buyer-package-record"
    );

    card.append(
        createElement(
            "div",
            "buyer-package-record-heading"
        )
    );

    card.querySelector(
        ".buyer-package-record-heading"
    ).append(
        (() => {
            const area =
                document.createElement("div");

            area.append(
                createElement(
                    "strong",
                    "",
                    `${formatMileage(record.previous_mileage)} -> ${formatMileage(record.new_mileage)}`
                ),
                createElement(
                    "span",
                    "",
                    formatDateTime(
                        record.recorded_at
                    )
                )
            );

            return area;
        })()
    );

    return card;
}

function showError(message) {
    loadingState.hidden = true;
    content.hidden = true;
    errorState.hidden = false;
    errorMessage.textContent = message;
}

function renderReport(reportPackage, vehicleId) {
    const vehicle = reportPackage.vehicle;
    const vehicleName =
        vehicle.nickname ||
        `${vehicle.brand} ${vehicle.model}`;
    const reportReference = buildReportReference(
        vehicle.id,
        reportPackage.exported_at
    );
    const latestService =
        reportPackage.service_history[0];
    const latestMileageRecord =
        reportPackage.mileage_history[0];
    const openIssueCount =
        reportPackage.issues.filter(
            (record) =>
                record.status !== "resolved"
        ).length;
    const totalRecordedCost =
        reportPackage.service_history.reduce(
            (total, record) =>
                total +
                Number(
                    record.actual_cost || 0
                ),
            0
        ) +
        reportPackage.fuel_history.reduce(
            (total, record) =>
                total +
                Number(
                    record.total_cost || 0
                ),
            0
        ) +
        reportPackage.expenses.reduce(
            (total, record) =>
                total +
                Number(
                    record.amount || 0
                ),
            0
        );

    document.title =
        `${vehicleName} Buyer Handoff Report | CarCare`;

    titleElement.textContent = vehicleName;
    subtitleElement.textContent =
        vehicle.nickname
            ? `${vehicle.brand} ${vehicle.model}`
            : "Buyer-ready vehicle summary";

    vehicleNameElement.textContent =
        vehicleName;
    plateElement.textContent =
        vehicle.license_plate ||
        "Not specified";
    generatedAtElement.textContent =
        formatDateTime(
            reportPackage.exported_at
        );
    statusElement.textContent =
        formatLabel(
            vehicle.vehicle_status,
            "Unknown"
        );
    reportIdElement.textContent =
        reportReference;
    mileageElement.textContent =
        formatMileage(
            vehicle.current_mileage
        );
    serviceCountElement.textContent =
        String(
            reportPackage.service_history.length
        );
    documentCountElement.textContent =
        String(
            reportPackage.documents.length
        );
    costTotalElement.textContent =
        formatCost(totalRecordedCost);

    summaryGrid.innerHTML = "";
    summaryGrid.append(
        createDetailCard(
            "Brand",
            vehicle.brand || "Not specified"
        ),
        createDetailCard(
            "Model",
            vehicle.model || "Not specified"
        ),
        createDetailCard(
            "Model year",
            vehicle.model_year
                ? String(vehicle.model_year)
                : "Not specified"
        ),
        createDetailCard(
            vehicle.vehicle_status === "sold"
                ? "Sold mileage"
                : "Current mileage",
            formatMileage(
                vehicle.current_mileage
            )
        ),
        createDetailCard(
            "First recorded",
            formatDate(vehicle.created_at)
        ),
        createDetailCard(
            "Sold at",
            vehicle.sold_at
                ? formatDate(vehicle.sold_at)
                : "Not marked as sold"
        )
    );

    handoverGrid.innerHTML = "";
    handoverGrid.append(
        createDetailCard(
            "Report ID",
            reportReference
        ),
        createDetailCard(
            "Ownership check",
            formatLabel(
                vehicle.ownership_status,
                "Unknown"
            )
        ),
        createDetailCard(
            "Open issues",
            openIssueCount === 0
                ? "No open issues"
                : `${openIssueCount} open`
        ),
        createDetailCard(
            "Latest service",
            latestService
                ? formatDate(
                    latestService.completed_at
                )
                : "No service record"
        ),
        createDetailCard(
            "Latest mileage update",
            latestMileageRecord
                ? formatDateTime(
                    latestMileageRecord.recorded_at
                )
                : "No mileage record"
        ),
        createDetailCard(
            "Vehicle state",
            vehicle.vehicle_status === "sold"
                ? `Sold on ${formatDate(
                    vehicle.sold_at
                )}`
                : "Active in owner account"
        )
    );

    ownershipCard.innerHTML = "";
    ownershipCard.append(
        createElement(
            "strong",
            "",
            formatLabel(
                vehicle.ownership_status,
                "Unknown"
            )
        ),
        createElement(
            "p",
            "",
            vehicle.ownership_status ===
                "verified"
                ? `Ownership was verified on ${formatDate(vehicle.ownership_verified_at)}.`
                : vehicle.ownership_failure_reason ||
                    "Ownership has not been fully verified in CarCare."
        )
    );

    serviceList.innerHTML = "";
    serviceList.append(
        createRecordList(
            reportPackage.service_history,
            createServiceRecord
        )
    );

    documentList.innerHTML = "";
    documentList.append(
        createRecordList(
            reportPackage.documents,
            createDocumentRecord
        )
    );

    issueList.innerHTML = "";
    issueList.append(
        createRecordList(
            reportPackage.issues,
            createIssueRecord
        )
    );

    fuelList.innerHTML = "";
    fuelList.append(
        createRecordList(
            reportPackage.fuel_history,
            createFuelRecord
        )
    );

    expenseList.innerHTML = "";
    expenseList.append(
        createRecordList(
            reportPackage.expenses,
            createExpenseRecord
        )
    );

    mileageList.innerHTML = "";
    mileageList.append(
        createRecordList(
            reportPackage.mileage_history,
            createMileageRecord
        )
    );

    if (backLink) {
        backLink.href =
            `/vehicle.html?id=${vehicleId}`;
    }

    loadingState.hidden = true;
    errorState.hidden = true;
    content.hidden = false;
}

async function loadBuyerPackageReport() {
    const parameters = new URLSearchParams(
        window.location.search
    );

    const vehicleId = Number(
        parameters.get("id")
    );

    if (
        !Number.isInteger(vehicleId) ||
        vehicleId <= 0
    ) {
        showError(
            "A valid vehicle ID was not provided."
        );
        return;
    }

    try {
        const data =
            await window.apiRequest(
                `/api/vehicles/${vehicleId}/handoff-package`
            );

        renderReport(
            data.package,
            vehicleId
        );
    } catch (error) {
        if (
            window.handlePageLoadError(
                error
            )
        ) {
            return;
        }

        showError(
            error.message ||
                "The buyer handoff report could not be loaded."
        );
    }
}

if (printButton) {
    printButton.addEventListener(
        "click",
        () => {
            window.print();
        }
    );
}

loadBuyerPackageReport();
