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
const readinessScoreElement =
    document.querySelector(
        "#share-readiness-score"
    );
const readinessSummaryElement =
    document.querySelector(
        "#share-readiness-summary"
    );
const trustList = document.querySelector(
    "#share-trust-list"
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

function createInfoCard(label, value) {
    const card = createElement(
        "div",
        "share-detail-card"
    );

    card.append(
        createElement("span", "", label),
        createElement("strong", "", value)
    );

    return card;
}

function renderProfile(profile) {
    const today = new Date(
        "2026-08-10T00:00:00Z"
    );
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

    const expiredDocuments =
        profile.documents.filter((documentRecord) => {
            if (!documentRecord.expiry_date) {
                return false;
            }

            return new Date(
                `${documentRecord.expiry_date}T00:00:00Z`
            ) < today;
        });

    const dueSoonDocuments =
        profile.documents.filter((documentRecord) => {
            if (!documentRecord.expiry_date) {
                return false;
            }

            const expiryDate = new Date(
                `${documentRecord.expiry_date}T00:00:00Z`
            );
            const daysUntil = Math.round(
                (expiryDate - today) /
                (24 * 60 * 60 * 1000)
            );

            return (
                daysUntil >= 0 &&
                daysUntil <= 60
            );
        });

    let readiness = 10;
    const readinessNotes = [];

    if (openIssues.length > 0) {
        readiness -= 2.5;
        readinessNotes.push(
            `${openIssues.length} open issue`
        );
    }

    if (expiredDocuments.length > 0) {
        readiness -= 2;
        readinessNotes.push(
            `${expiredDocuments.length} expired document`
        );
    }

    if (profile.service_history.length === 0) {
        readiness -= 2;
        readinessNotes.push(
            "no service history"
        );
    }

    if (
        vehicle.ownership_status !== "verified"
    ) {
        readiness -= 1;
        readinessNotes.push(
            "ownership not verified"
        );
    }

    readiness = Math.max(
        0,
        Math.round(readiness * 10) / 10
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
    readinessScoreElement.textContent =
        `${readiness}/10`;
    readinessSummaryElement.textContent =
        readinessNotes.length === 0
            ? "Strong buyer-facing record with no obvious credibility blocker in the shared data."
            : `This shared profile still shows ${readinessNotes.slice(0, 2).join(" and ")}.`;

    detailGrid.innerHTML = "";
    [
        ["Model year", vehicle.model_year || "Not specified"],
        ["License plate", vehicle.license_plate || "Not specified"],
        ["Ownership", vehicle.ownership_status || "Unknown"],
        ["Status", vehicle.vehicle_status || "Unknown"],
        ["Service records", String(profile.service_history.length)],
        ["Shared on", formatDate(profile.exported_at)]
    ].forEach(([label, value]) => {
        detailGrid.append(
            createInfoCard(label, value)
        );
    });

    trustList.innerHTML = "";

    [
        profile.service_history.length > 0
            ? `${profile.service_history.length} service record${profile.service_history.length === 1 ? "" : "s"} are visible.`
            : "No service history is visible yet.",
        profile.documents.length > 0
            ? `${profile.documents.length} tracked document${profile.documents.length === 1 ? "" : "s"} are included.`
            : "No tracked documents are included yet.",
        dueSoonDocuments.length > 0
            ? `${dueSoonDocuments.length} document reminder${dueSoonDocuments.length === 1 ? "" : "s"} are approaching soon.`
            : "No document appears close to expiry in the shared profile.",
        openIssues.length > 0
            ? `${openIssues.length} open issue${openIssues.length === 1 ? "" : "s"} are still visible in the shared record.`
            : "No unresolved issue is visible in this shared view."
    ].forEach((text) => {
        const item = createElement(
            "article",
            "share-timeline-item"
        );

        item.append(
            createElement(
                "strong",
                "",
                text
            )
        );

        trustList.append(item);
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
