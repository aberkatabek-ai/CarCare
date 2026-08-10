const loadingState = document.querySelector(
    "#share-loading"
);
const errorState = document.querySelector(
    "#share-error"
);
const errorMessage = document.querySelector(
    "#share-error-message"
);
const content = document.querySelector(
    "#share-content"
);
const titleElement = document.querySelector(
    "#share-vehicle-title"
);
const subtitleElement = document.querySelector(
    "#share-vehicle-subtitle"
);
const mileageElement = document.querySelector(
    "#share-mileage"
);
const serviceCountElement =
    document.querySelector(
        "#share-service-count"
    );
const documentCountElement =
    document.querySelector(
        "#share-document-count"
    );
const openIssueCountElement =
    document.querySelector(
        "#share-open-issue-count"
    );
const costTotalElement = document.querySelector(
    "#share-cost-total"
);
const detailGrid = document.querySelector(
    "#share-detail-grid"
);
const timelineList = document.querySelector(
    "#share-timeline-list"
);

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
    if (!value) {
        return "Not recorded";
    }

    return new Date(value).toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function formatMileage(value) {
    return `${Number(value || 0).toLocaleString(
        "en-US"
    )} km`;
}

function formatCost(value) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 2
    }).format(Number(value) || 0);
}

function showError(message) {
    loadingState.hidden = true;
    content.hidden = true;
    errorState.hidden = false;
    errorMessage.textContent = message;
}

function renderProfile(profile) {
    const vehicle = profile.vehicle;
    const vehicleName =
        vehicle.nickname ||
        `${vehicle.brand} ${vehicle.model}`;
    const openIssues = profile.issues.filter(
        (issue) => issue.status !== "repaired"
    );
    const totalCost =
        profile.service_history.reduce(
            (total, record) =>
                total + Number(record.actual_cost || 0),
            0
        ) +
        profile.fuel_history.reduce(
            (total, record) =>
                total + Number(record.total_cost || 0),
            0
        ) +
        profile.expenses.reduce(
            (total, record) =>
                total + Number(record.amount || 0),
            0
        );

    document.title =
        `${vehicleName} | Shared Vehicle Profile`;

    titleElement.textContent = vehicleName;
    subtitleElement.textContent =
        vehicle.nickname
            ? `${vehicle.brand} ${vehicle.model}`
            : "Shared read-only summary";
    mileageElement.textContent = formatMileage(
        vehicle.current_mileage
    );
    serviceCountElement.textContent = String(
        profile.service_history.length
    );
    documentCountElement.textContent = String(
        profile.documents.length
    );
    openIssueCountElement.textContent = String(
        openIssues.length
    );
    costTotalElement.textContent =
        formatCost(totalCost);

    detailGrid.innerHTML = "";
    [
        ["Model year", vehicle.model_year || "Not specified"],
        ["License plate", vehicle.license_plate || "Not specified"],
        ["Ownership", vehicle.ownership_status || "Unknown"],
        ["Status", vehicle.vehicle_status || "Unknown"],
        ["First recorded", formatDate(vehicle.created_at)],
        ["Shared on", formatDate(profile.exported_at)]
    ].forEach(([label, value]) => {
        const card = createElement(
            "div",
            "share-detail-card"
        );

        card.append(
            createElement("span", "", label),
            createElement("strong", "", value)
        );

        detailGrid.append(card);
    });

    const events = [];

    profile.service_history.slice(0, 3).forEach((record) => {
        events.push({
            type: "Service",
            title: record.service_name,
            meta: formatDate(record.completed_at)
        });
    });

    profile.documents.slice(0, 2).forEach((record) => {
        events.push({
            type: "Document",
            title: record.title,
            meta: formatDate(record.expiry_date)
        });
    });

    profile.issues.slice(0, 2).forEach((record) => {
        events.push({
            type: "Issue",
            title: record.issue_title,
            meta: record.status
        });
    });

    timelineList.innerHTML = "";

    if (events.length === 0) {
        timelineList.append(
            createElement(
                "div",
                "share-timeline-item",
                "No shared activity is available yet."
            )
        );
    } else {
        events.forEach((event) => {
            const item = createElement(
                "article",
                "share-timeline-item"
            );

            item.append(
                createElement(
                    "span",
                    "",
                    event.type
                ),
                createElement(
                    "strong",
                    "",
                    event.title
                ),
                createElement(
                    "span",
                    "",
                    event.meta
                )
            );

            timelineList.append(item);
        });
    }

    loadingState.hidden = true;
    errorState.hidden = true;
    content.hidden = false;
}

async function loadSharedProfile() {
    const token = new URLSearchParams(
        window.location.search
    ).get("token");

    if (!token) {
        showError(
            "This shared vehicle profile link is incomplete."
        );
        return;
    }

    try {
        const response = await fetch(
            `/api/public/vehicle-share/${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                    "The shared vehicle profile could not be loaded."
            );
        }

        renderProfile(data.profile);
    } catch (error) {
        showError(error.message);
    }
}

loadSharedProfile();
