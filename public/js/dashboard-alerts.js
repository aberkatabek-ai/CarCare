(() => {
    "use strict";

    const alertList = document.querySelector(
        "#smart-alert-list"
    );

    const alertCount = document.querySelector(
        "#smart-alert-count"
    );

    const criticalAlertCount =
        document.querySelector(
            "#critical-smart-alert-count"
        );

    const warningAlertCount =
        document.querySelector(
            "#warning-smart-alert-count"
        );

    const informationAlertCount =
        document.querySelector(
            "#information-smart-alert-count"
        );

    const refreshButton = document.querySelector(
        "#refresh-smart-alerts"
    );

    if (
        !alertList ||
        !alertCount ||
        !refreshButton
    ) {
        return;
    }

    const alertLevelPriority = {
        critical: 0,
        warning: 1,
        information: 2
    };

    function createElement(
        tagName,
        className,
        text
    ) {
        const element =
            document.createElement(tagName);

        if (className) {
            element.className = className;
        }

        if (text !== undefined) {
            element.textContent = text;
        }

        return element;
    }

    function formatMileage(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return null;
        }

        return (
            `${Number(value).toLocaleString(
                window.getAppIntlLocale()
            )} km`
        );
    }

    function formatDate(value) {
        if (!value) {
            return null;
        }

        const normalizedValue =
            String(value).slice(0, 10);

        const date = new Date(
            `${normalizedValue}T00:00:00`
        );

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return date.toLocaleDateString(
            window.getAppIntlLocale(),
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }

    function getVehicleName(item) {
        if (item.nickname) {
            return (
                `${item.nickname} — ` +
                `${item.brand} ${item.model}`
            );
        }

        if (item.brand && item.model) {
            return (
                `${item.brand} ${item.model}`
            );
        }

        return "Vehicle";
    }

    function getMaintenanceDeadline(plan) {
        const deadlineParts = [];

        const mileage = formatMileage(
            plan.next_due_mileage
        );

        const date = formatDate(
            plan.next_due_date
        );

        if (mileage) {
            deadlineParts.push(mileage);
        }

        if (date) {
            deadlineParts.push(date);
        }

        if (deadlineParts.length === 0) {
            return "Service is waiting for a baseline.";
        }

        return (
            `Next due: ` +
            `${deadlineParts.join(" • ")}`
        );
    }

    function getDocumentDeadline(documentRecord) {
        const remainingDays = Number(
            documentRecord.days_remaining
        );

        const expiryDate = formatDate(
            documentRecord.expiry_date
        );

        if (
            documentRecord.renewal_status ===
            "expired"
        ) {
            const expiredDays = Math.abs(
                remainingDays
            );

            if (expiredDays === 0) {
                return "The document expires today.";
            }

            if (expiredDays === 1) {
                return (
                    `Expired 1 day ago` +
                    `${expiryDate ? ` • ${expiryDate}` : ""}`
                );
            }

            return (
                `Expired ${expiredDays} days ago` +
                `${expiryDate ? ` • ${expiryDate}` : ""}`
            );
        }

        if (remainingDays === 0) {
            return "The document expires today.";
        }

        if (remainingDays === 1) {
            return (
                `1 day remaining` +
                `${expiryDate ? ` • ${expiryDate}` : ""}`
            );
        }

        return (
            `${remainingDays} days remaining` +
            `${expiryDate ? ` • ${expiryDate}` : ""}`
        );
    }

    function buildMaintenanceAlerts(plans) {
        return plans
            .filter(
                (plan) =>
                    plan.status === "overdue" ||
                    plan.status === "due_soon"
            )
            .map((plan) => {
                const isOverdue =
                    plan.status === "overdue";

                return {
                    id: `maintenance-${plan.id}`,
                    level: isOverdue
                        ? "critical"
                        : "warning",
                    urgency: isOverdue ? -500 : 20,
                    source: "Maintenance",
                    sourceIcon: "M",
                    title: plan.name,
                    vehicle: getVehicleName(plan),
                    message: isOverdue
                        ? `Maintenance is overdue. ${getMaintenanceDeadline(plan)}`
                        : `Maintenance is approaching. ${getMaintenanceDeadline(plan)}`,
                    href: "/maintenance.html",
                    actionLabel: "View plan"
                };
            });
    }

    function buildIssueAlerts(issues) {
        return issues
            .filter(
                (issue) =>
                    issue.status !== "repaired"
            )
            .map((issue) => {
                let level = "information";
                let urgency = 100;
                let message =
                    "Keep monitoring this reported symptom.";

                if (issue.status === "diagnosed") {
                    level =
                        issue.risk_level === "red"
                            ? "critical"
                            : "warning";

                    urgency =
                        issue.risk_level === "red"
                            ? -900
                            : 10;

                    message =
                        "The vehicle has been inspected and a diagnosis was recorded. Repair is still pending.";
                } else if (
                    issue.risk_level === "red"
                ) {
                    level = "critical";
                    urgency = -1000;
                    message =
                        "Urgent attention is recommended. Avoid driving until the vehicle is inspected.";
                } else if (
                    issue.risk_level === "orange"
                ) {
                    level = "warning";
                    urgency = 5;
                    message =
                        "An inspection should be arranged soon.";
                }

                return {
                    id: `issue-${issue.id}`,
                    level,
                    urgency,
                    source: "Health",
                    sourceIcon: "H",
                    title: issue.issue_title,
                    vehicle: getVehicleName(issue),
                    message,
                    href: "/health.html",
                    actionLabel: "View issue"
                };
            });
    }

    function buildDocumentAlerts(documentRecords) {
        return documentRecords
            .filter(
                (documentRecord) =>
                    documentRecord.vehicle_status !==
                        "sold" &&
                    documentRecord.vehicle_status !==
                        "archived" &&
                    (
                    documentRecord
                        .renewal_status ===
                        "expired" ||
                    documentRecord
                        .renewal_status ===
                        "due_soon"
                    )
            )
            .map((documentRecord) => {
                const isExpired =
                    documentRecord
                        .renewal_status ===
                    "expired";

                return {
                    id: `document-${documentRecord.id}`,
                    level: isExpired
                        ? "critical"
                        : "warning",
                    urgency: Number(
                        documentRecord.days_remaining
                    ),
                    source: "Documents",
                    sourceIcon: "D",
                    title: documentRecord.title,
                    vehicle: getVehicleName(
                        documentRecord
                    ),
                    message:
                        getDocumentDeadline(
                            documentRecord
                        ),
                    href: "/documents.html",
                    actionLabel: "View document"
                };
            });
    }

    function sortAlerts(alerts) {
        return [...alerts].sort(
            (firstAlert, secondAlert) => {
                const levelDifference =
                    alertLevelPriority[
                        firstAlert.level
                    ] -
                    alertLevelPriority[
                        secondAlert.level
                    ];

                if (levelDifference !== 0) {
                    return levelDifference;
                }

                return (
                    firstAlert.urgency -
                    secondAlert.urgency
                );
            }
        );
    }

    function updateStatistics(alerts) {
        const criticalAlerts = alerts.filter(
            (alert) =>
                alert.level === "critical"
        );

        const warningAlerts = alerts.filter(
            (alert) =>
                alert.level === "warning"
        );

        const informationAlerts = alerts.filter(
            (alert) =>
                alert.level === "information"
        );

        alertCount.textContent =
            alerts.length === 1
                ? "1 alert"
                : `${alerts.length} alerts`;

        criticalAlertCount.textContent =
            String(criticalAlerts.length);

        warningAlertCount.textContent =
            String(warningAlerts.length);

        informationAlertCount.textContent =
            String(informationAlerts.length);
    }

    function createEmptyState() {
        const emptyState = createElement(
            "div",
            "smart-alert-empty"
        );

        emptyState.append(
            createElement(
                "div",
                "smart-alert-empty-icon",
                "✓"
            ),

            createElement(
                "strong",
                "",
                "Your garage is up to date"
            ),

            createElement(
                "p",
                "",
                "There are no overdue services, urgent issues or upcoming document renewals."
            )
        );

        return emptyState;
    }

    function renderAlerts(alerts) {
        alertList.innerHTML = "";

        updateStatistics(alerts);

        if (alerts.length === 0) {
            alertList.append(
                createEmptyState()
            );

            return;
        }

        alerts.forEach((alert) => {
            const item = createElement(
                "article",
                `smart-alert-item ${alert.level}`
            );

            const icon = createElement(
                "div",
                "smart-alert-source-icon",
                alert.sourceIcon
            );

            const content = createElement(
                "div",
                "smart-alert-content"
            );

            const contentTop = createElement(
                "div",
                "smart-alert-content-top"
            );

            contentTop.append(
                createElement(
                    "span",
                    "smart-alert-source-label",
                    alert.source
                ),

                createElement(
                    "h3",
                    "",
                    alert.title
                )
            );

            const description = createElement(
                "p"
            );

            const vehicleName = createElement(
                "span",
                "smart-alert-vehicle",
                alert.vehicle
            );

            const separator =
                document.createTextNode(" • ");

            const message =
                document.createTextNode(
                    alert.message
                );

            description.append(
                vehicleName,
                separator,
                message
            );

            content.append(
                contentTop,
                description
            );

            const action = createElement(
                "a",
                "smart-alert-action",
                alert.actionLabel
            );

            action.href = alert.href;

            item.append(
                icon,
                content,
                action
            );

            alertList.append(item);
        });
    }

    function renderLoadingState() {
        alertList.innerHTML = "";

        alertList.append(
            createElement(
                "div",
                "smart-alert-loading",
                "Analysing maintenance, health and document records..."
            )
        );
    }

    function renderErrorState() {
        alertList.innerHTML = "";

        alertList.append(
            createElement(
                "div",
                "smart-alert-error",
                "Smart alerts could not be loaded. Check the terminal and try again."
            )
        );
    }

    async function loadSmartAlerts() {
        renderLoadingState();

        refreshButton.disabled = true;
        refreshButton.textContent =
            "Refreshing...";

        try {
            const results =
                await Promise.allSettled([
                    window.apiRequest(
                        "/api/vehicles"
                    ),

                    window.apiRequest(
                        "/api/maintenance-plans"
                    ),

                    window.apiRequest(
                        "/api/issues"
                    ),

                    window.apiRequest(
                        "/api/documents"
                    )
                ]);

            const successfulRequestCount =
                results.filter(
                    (result) =>
                        result.status ===
                        "fulfilled"
                ).length;

            if (successfulRequestCount === 0) {
                throw new Error(
                    "Every smart alert request failed."
                );
            }

            const activeVehicles =
                results[0].status ===
                "fulfilled"
                    ? results[0].value
                        .vehicles || []
                    : [];

            const activeVehicleIds = new Set(
                activeVehicles.map((vehicle) =>
                    String(vehicle.id)
                )
            );

            const maintenancePlans =
                results[1].status ===
                "fulfilled"
                    ? results[1].value
                        .maintenancePlans || []
                    : [];

            const issues =
                results[2].status ===
                "fulfilled"
                    ? results[2].value
                        .issues || []
                    : [];

            const documentRecords =
                results[3].status ===
                "fulfilled"
                    ? results[3].value
                        .documents || []
                    : [];

            results.forEach((result) => {
                if (
                    result.status === "rejected"
                ) {
                    console.error(
                        result.reason
                    );
                }
            });

            const alerts = sortAlerts([
                ...buildMaintenanceAlerts(
                    maintenancePlans
                ),

                ...buildIssueAlerts(
                    issues.filter((issue) =>
                        activeVehicleIds.has(
                            String(issue.vehicle_id)
                        )
                    )
                ),

                ...buildDocumentAlerts(
                    documentRecords.filter(
                        (documentRecord) =>
                            activeVehicleIds.has(
                                String(
                                    documentRecord.vehicle_id
                                )
                            )
                    )
                )
            ]);

            renderAlerts(alerts);
        } catch (error) {
            console.error(error);
            renderErrorState();
        } finally {
            refreshButton.disabled = false;
            refreshButton.textContent =
                "Refresh";
        }
    }

    refreshButton.addEventListener(
        "click",
        loadSmartAlerts
    );

    window.addEventListener(
        "focus",
        () => {
            loadSmartAlerts();
        }
    );

    loadSmartAlerts();
})();
