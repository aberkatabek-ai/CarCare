const accountName = document.querySelector(
    "#account-name"
);

const logoutButton = document.querySelector(
    "#logout-button"
);

const vehicleFilter = document.querySelector(
    "#history-vehicle-filter"
);

const serviceHistoryList = document.querySelector(
    "#service-history-list"
);

const totalServices = document.querySelector(
    "#total-services"
);

const totalCost = document.querySelector(
    "#total-cost"
);

let vehicles = [];
let serviceHistory = [];

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

function getVehicleName(vehicle) {
    if (vehicle.nickname) {
        return (
            `${vehicle.nickname} — ` +
            `${vehicle.brand} ${vehicle.model}`
        );
    }

    return `${vehicle.brand} ${vehicle.model}`;
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

function formatMileage(value) {
    return (
        `${Number(value).toLocaleString("en-US")} km`
    );
}

function formatDate(value) {
    if (!value) {
        return "Unknown date";
    }

    return new Date(value).toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}

function formatCost(value) {
    if (value === null || value === undefined) {
        return "Not specified";
    }

    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 2
    }).format(Number(value));
}

function populateVehicleFilter() {
    vehicleFilter.innerHTML = "";

    const allOption =
        document.createElement("option");

    allOption.value = "all";
    allOption.textContent = "All vehicles";

    vehicleFilter.append(allOption);

    vehicles.forEach((vehicle) => {
        const option =
            document.createElement("option");

        option.value = vehicle.id;
        option.textContent =
            getVehicleName(vehicle);

        vehicleFilter.append(option);
    });
}

function createHistoryDetail(label, value) {
    const detail = createElement(
        "div",
        "history-detail"
    );

    detail.append(
        createElement(
            "span",
            "history-detail-label",
            label
        ),

        createElement(
            "strong",
            "",
            value
        )
    );

    return detail;
}

function renderServiceHistory() {
    serviceHistoryList.innerHTML = "";

    const selectedVehicle =
        vehicleFilter.value;

    const filteredHistory =
        selectedVehicle === "all"
            ? serviceHistory
            : serviceHistory.filter(
                (record) =>
                    String(record.vehicle_id) ===
                    selectedVehicle
            );

    totalServices.textContent =
        String(filteredHistory.length);

    const calculatedTotalCost =
        filteredHistory.reduce(
            (total, record) => {
                const cost =
                    record.actual_cost === null
                        ? 0
                        : Number(record.actual_cost);

                return total + cost;
            },
            0
        );

    totalCost.textContent =
        formatCost(calculatedTotalCost);

    if (filteredHistory.length === 0) {
        const emptyState = createElement(
            "div",
            "empty-state"
        );

        emptyState.append(
            createElement(
                "div",
                "empty-icon",
                "📋"
            ),

            createElement(
                "h2",
                "",
                "No service history"
            ),

            createElement(
                "p",
                "",
                "Complete a maintenance plan to create your first service record."
            )
        );

        serviceHistoryList.append(emptyState);
        return;
    }

    const timeline = createElement(
        "div",
        "history-timeline"
    );

    filteredHistory.forEach((record) => {
        const card = createElement(
            "article",
            "history-record"
        );

        const marker = createElement(
            "div",
            "history-marker",
            "✓"
        );

        const content = createElement(
            "div",
            "history-record-content"
        );

        const header = createElement(
            "div",
            "history-record-header"
        );

        const titleArea = createElement("div");

        titleArea.append(
            createElement(
                "p",
                "history-category",
                record.category || "Maintenance"
            ),

            createElement(
                "h3",
                "",
                record.service_name
            ),

            createElement(
                "p",
                "history-vehicle",
                getRecordVehicleName(record)
            )
        );

        const dateBadge = createElement(
            "div",
            "history-date-badge",
            formatDate(record.completed_at)
        );

        header.append(titleArea, dateBadge);

        const details = createElement(
            "div",
            "history-details"
        );

        details.append(
            createHistoryDetail(
                "Completed mileage",
                formatMileage(
                    record.completed_at_mileage
                )
            ),

            createHistoryDetail(
                "Estimated cost",
                formatCost(record.estimated_cost)
            ),

            createHistoryDetail(
                "Actual cost",
                formatCost(record.actual_cost)
            ),

            createHistoryDetail(
                "Service provider",
                record.service_provider ||
                    "Not specified"
            )
        );

        content.append(header, details);

        if (record.notes) {
            const notes = createElement(
                "div",
                "history-notes"
            );

            notes.append(
                createElement(
                    "span",
                    "history-detail-label",
                    "Notes"
                ),

                createElement(
                    "p",
                    "",
                    record.notes
                )
            );

            content.append(notes);
        }

        card.append(marker, content);
        timeline.append(card);
    });

    serviceHistoryList.append(timeline);
}

async function loadServiceHistoryPage() {
    try {
        const [
            userData,
            vehicleData,
            historyData
        ] = await Promise.all([
            window.apiRequest("/api/auth/me"),
            window.apiRequest("/api/vehicles"),
            window.apiRequest(
                "/api/service-history"
            )
        ]);

        accountName.textContent =
            userData.user.full_name;

        vehicles = vehicleData.vehicles;

        serviceHistory =
            historyData.serviceHistory;

        populateVehicleFilter();
        renderServiceHistory();
    } catch (error) {
        window.handlePageLoadError(
            error,
            "Service history could not be loaded."
        );
    }
}

vehicleFilter.addEventListener(
    "change",
    renderServiceHistory
);

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

loadServiceHistoryPage();
