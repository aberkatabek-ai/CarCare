(function attachGarageInsights() {
    function clamp(value, minimum, maximum) {
        return Math.min(
            maximum,
            Math.max(minimum, value)
        );
    }

    function toNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function parseDate(value) {
        if (!value) {
            return null;
        }

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    function daysUntil(value, today) {
        const date = parseDate(value);

        if (!date) {
            return null;
        }

        const normalizedToday = new Date(
            `${today.toISOString().slice(0, 10)}T00:00:00Z`
        );
        const normalizedDate = new Date(
            `${date.toISOString().slice(0, 10)}T00:00:00Z`
        );

        return Math.round(
            (normalizedDate - normalizedToday) /
            (24 * 60 * 60 * 1000)
        );
    }

    function getVehicleName(vehicle) {
        if (!vehicle) {
            return "Vehicle";
        }

        if (vehicle.nickname) {
            return vehicle.nickname;
        }

        return `${vehicle.brand} ${vehicle.model}`;
    }

    function getMetricTone(score) {
        if (score >= 8.5) {
            return {
                key: "strong",
                label: "Strong"
            };
        }

        if (score >= 6.5) {
            return {
                key: "stable",
                label: "Stable"
            };
        }

        if (score >= 4.5) {
            return {
                key: "watch",
                label: "Watch"
            };
        }

        return {
            key: "risk",
            label: "At risk"
        };
    }

    function buildMetric(label, score, reasons, fallback) {
        const roundedScore =
            Math.round(clamp(score, 0, 10) * 10) / 10;
        const tone = getMetricTone(roundedScore);

        return {
            label,
            score: roundedScore,
            tone: tone.key,
            toneLabel: tone.label,
            summary:
                reasons.length > 0
                    ? reasons[0]
                    : fallback
        };
    }

    function createPriority(level, area, title, detail) {
        return {
            level,
            area,
            title,
            detail
        };
    }

    function levelWeight(level) {
        if (level === "critical") {
            return 0;
        }

        if (level === "warning") {
            return 1;
        }

        return 2;
    }

    function assessVehicle(input) {
        const vehicle = input.vehicle || {};
        const maintenancePlans =
            input.maintenancePlans || [];
        const serviceHistory =
            input.serviceHistory || [];
        const issues = input.issues || [];
        const documents = input.documents || [];
        const today = input.today || new Date();

        const currentMileage = toNumber(
            vehicle.current_mileage
        );
        const openIssues = issues.filter(
            (issue) => issue.status !== "repaired"
        );
        const redIssues = openIssues.filter(
            (issue) => issue.risk_level === "red"
        );
        const orangeIssues = openIssues.filter(
            (issue) => issue.risk_level === "orange"
        );
        const greenIssues = openIssues.filter(
            (issue) =>
                issue.risk_level !== "red" &&
                issue.risk_level !== "orange"
        );
        const overduePlans = maintenancePlans.filter(
            (plan) => plan.status === "overdue"
        );
        const dueSoonPlans = maintenancePlans.filter(
            (plan) => plan.status === "due_soon"
        );
        const criticalOverduePlans =
            overduePlans.filter(
                (plan) => plan.is_critical
            );
        const expiredDocuments = documents.filter(
            (documentRecord) =>
                documentRecord.renewal_status ===
                "expired"
        );
        const dueSoonDocuments = documents.filter(
            (documentRecord) =>
                documentRecord.renewal_status ===
                "due_soon"
        );

        let mechanicalScore = 10;
        const mechanicalReasons = [];

        if (redIssues.length > 0) {
            mechanicalScore -= redIssues.length * 4;
            mechanicalReasons.push(
                `${redIssues.length} urgent issue` +
                `${redIssues.length === 1 ? "" : "s"} open right now.`
            );
        }

        if (orangeIssues.length > 0) {
            mechanicalScore -=
                orangeIssues.length * 2.5;
            mechanicalReasons.push(
                `${orangeIssues.length} inspection-level issue` +
                `${orangeIssues.length === 1 ? "" : "s"} still active.`
            );
        }

        if (
            greenIssues.length > 0 &&
            redIssues.length === 0 &&
            orangeIssues.length === 0
        ) {
            mechanicalScore -=
                greenIssues.length * 1.25;
            mechanicalReasons.push(
                `${greenIssues.length} low-risk issue` +
                `${greenIssues.length === 1 ? "" : "s"} still being monitored.`
            );
        }

        if (criticalOverduePlans.length > 0) {
            mechanicalScore -=
                criticalOverduePlans.length * 1.5;
            mechanicalReasons.push(
                `${criticalOverduePlans.length} critical maintenance item` +
                `${criticalOverduePlans.length === 1 ? "" : "s"} overdue.`
            );
        }

        const latestService = serviceHistory
            .map((record) => parseDate(record.completed_at))
            .filter(Boolean)
            .sort((firstDate, secondDate) =>
                secondDate - firstDate
            )[0];

        if (!latestService && currentMileage >= 15000) {
            mechanicalScore -= 1.5;
            mechanicalReasons.push(
                "No completed service history is recorded for this mileage level."
            );
        } else if (
            latestService &&
            daysUntil(latestService, today) < -365
        ) {
            mechanicalScore -= 1;
            mechanicalReasons.push(
                "The latest completed service is more than a year old."
            );
        }

        let maintenanceScore = 10;
        const maintenanceReasons = [];

        if (overduePlans.length > 0) {
            maintenanceScore -= overduePlans.length * 2;
            maintenanceReasons.push(
                `${overduePlans.length} maintenance plan` +
                `${overduePlans.length === 1 ? "" : "s"} overdue.`
            );
        }

        if (dueSoonPlans.length > 0) {
            maintenanceScore -= Math.min(
                3,
                dueSoonPlans.length
            );
            maintenanceReasons.push(
                `${dueSoonPlans.length} maintenance item` +
                `${dueSoonPlans.length === 1 ? "" : "s"} coming up soon.`
            );
        }

        if (
            maintenancePlans.length === 0 &&
            currentMileage >= 8000
        ) {
            maintenanceScore -= 3;
            maintenanceReasons.push(
                "There are no active maintenance plans for this vehicle yet."
            );
        }

        if (
            serviceHistory.length === 0 &&
            currentMileage >= 12000
        ) {
            maintenanceScore -= 1;
            maintenanceReasons.push(
                "Service completion records are still empty."
            );
        }

        let documentScore = 10;
        const documentReasons = [];

        if (expiredDocuments.length > 0) {
            documentScore -=
                expiredDocuments.length * 3;
            documentReasons.push(
                `${expiredDocuments.length} document` +
                `${expiredDocuments.length === 1 ? "" : "s"} already expired.`
            );
        }

        if (dueSoonDocuments.length > 0) {
            documentScore -=
                dueSoonDocuments.length * 1.5;
            documentReasons.push(
                `${dueSoonDocuments.length} document` +
                `${dueSoonDocuments.length === 1 ? "" : "s"} due soon.`
            );
        }

        if (vehicle.ownership_status === "failed") {
            documentScore -= 2;
            documentReasons.push(
                "Ownership verification failed and should be retried."
            );
        } else if (
            vehicle.ownership_status === "unverified"
        ) {
            documentScore -= 1;
            documentReasons.push(
                "A plate is saved, but ownership is not verified yet."
            );
        }

        const priorities = [];

        redIssues.forEach((issue) => {
            priorities.push(
                createPriority(
                    "critical",
                    "Mechanical",
                    issue.issue_title || "Urgent issue",
                    "Avoid delaying diagnosis or repair on this vehicle."
                )
            );
        });

        criticalOverduePlans.forEach((plan) => {
            priorities.push(
                createPriority(
                    "critical",
                    "Maintenance",
                    `${plan.name} is overdue`,
                    "A critical maintenance item has passed its target."
                )
            );
        });

        expiredDocuments.forEach((documentRecord) => {
            priorities.push(
                createPriority(
                    "critical",
                    "Documents",
                    `${documentRecord.title} expired`,
                    "Renew this record to keep the vehicle fully ready."
                )
            );
        });

        orangeIssues.forEach((issue) => {
            priorities.push(
                createPriority(
                    "warning",
                    "Mechanical",
                    issue.issue_title || "Inspection needed",
                    "A non-critical issue is active and should be checked soon."
                )
            );
        });

        overduePlans
            .filter((plan) => !plan.is_critical)
            .forEach((plan) => {
                priorities.push(
                    createPriority(
                        "warning",
                        "Maintenance",
                        `${plan.name} is overdue`,
                        "This vehicle is past a planned service point."
                    )
                );
            });

        dueSoonPlans.forEach((plan) => {
            priorities.push(
                createPriority(
                    "warning",
                    "Maintenance",
                    `${plan.name} is due soon`,
                    "Plan this service before it becomes overdue."
                )
            );
        });

        dueSoonDocuments.forEach((documentRecord) => {
            const remainingDays = daysUntil(
                documentRecord.expiry_date,
                today
            );

            priorities.push(
                createPriority(
                    "warning",
                    "Documents",
                    `${documentRecord.title} is due soon`,
                    remainingDays === null
                        ? "Review the expiry date and renewal window."
                        : `Renewal is approaching in about ${remainingDays} day${remainingDays === 1 ? "" : "s"}.`
                )
            );
        });

        if (vehicle.ownership_status === "failed") {
            priorities.push(
                createPriority(
                    "warning",
                    "Documents",
                    "Ownership verification failed",
                    "Upload a clearer registration image or review the saved plate."
                )
            );
        } else if (
            vehicle.ownership_status === "unverified"
        ) {
            priorities.push(
                createPriority(
                    "info",
                    "Documents",
                    "Ownership still unverified",
                    "Run the registration check when you want a stronger vehicle record."
                )
            );
        }

        if (
            maintenancePlans.length === 0 &&
            currentMileage >= 8000
        ) {
            priorities.push(
                createPriority(
                    "info",
                    "Maintenance",
                    "No maintenance schedule yet",
                    "Create at least one recurring plan so the vehicle has a service baseline."
                )
            );
        }

        if (
            serviceHistory.length === 0 &&
            currentMileage >= 12000
        ) {
            priorities.push(
                createPriority(
                    "info",
                    "History",
                    "No completed services recorded",
                    "Adding past service records will make future insights more reliable."
                )
            );
        }

        priorities.sort(
            (firstPriority, secondPriority) =>
                levelWeight(firstPriority.level) -
                levelWeight(secondPriority.level)
        );

        return {
            vehicleId: vehicle.id,
            vehicleName: getVehicleName(vehicle),
            metrics: {
                mechanicalConfidence: buildMetric(
                    "Mechanical confidence",
                    mechanicalScore,
                    mechanicalReasons,
                    openIssues.length === 0
                        ? "No active issue is dragging the mechanical view down."
                        : "No major mechanical risk is currently recorded."
                ),
                maintenanceDiscipline: buildMetric(
                    "Maintenance discipline",
                    maintenanceScore,
                    maintenanceReasons,
                    maintenancePlans.length > 0
                        ? "The service schedule is currently under control."
                        : "No maintenance baseline exists yet, but nothing is overdue."
                ),
                documentReadiness: buildMetric(
                    "Document readiness",
                    documentScore,
                    documentReasons,
                    documents.length > 0
                        ? "Recorded documents look ready right now."
                        : "No document issue is currently reducing readiness."
                )
            },
            counts: {
                openIssues: openIssues.length,
                overduePlans: overduePlans.length,
                dueSoonPlans: dueSoonPlans.length,
                expiredDocuments:
                    expiredDocuments.length,
                dueSoonDocuments:
                    dueSoonDocuments.length
            },
            priorities
        };
    }

    function summarizeGarage(vehicleInsights) {
        if (!Array.isArray(vehicleInsights) ||
            vehicleInsights.length === 0) {
            return {
                metrics: {
                    mechanicalConfidence: buildMetric(
                        "Mechanical confidence",
                        10,
                        [],
                        "Add a vehicle to start reading garage signals."
                    ),
                    maintenanceDiscipline: buildMetric(
                        "Maintenance discipline",
                        10,
                        [],
                        "Maintenance discipline will appear after the first vehicle is added."
                    ),
                    documentReadiness: buildMetric(
                        "Document readiness",
                        10,
                        [],
                        "Document readiness will appear after you start tracking records."
                    )
                },
                priorities: []
            };
        }

        const metricKeys = [
            "mechanicalConfidence",
            "maintenanceDiscipline",
            "documentReadiness"
        ];
        const metrics = {};

        metricKeys.forEach((metricKey) => {
            const averageScore =
                vehicleInsights.reduce(
                    (total, insight) =>
                        total +
                        insight.metrics[metricKey].score,
                    0
                ) / vehicleInsights.length;

            const weakVehicles = vehicleInsights
                .filter(
                    (insight) =>
                        insight.metrics[metricKey].score <
                        6.5
                )
                .map((insight) => insight.vehicleName);

            const fallback =
                weakVehicles.length === 0
                    ? "Across the garage this area looks steady."
                    : `${weakVehicles[0]} needs the most attention here.`;

            metrics[metricKey] = buildMetric(
                vehicleInsights[0].metrics[metricKey]
                    .label,
                averageScore,
                weakVehicles.length === 0
                    ? []
                    : [fallback],
                fallback
            );
        });

        const priorities = vehicleInsights
            .flatMap((insight) =>
                insight.priorities.map((priority) => ({
                    ...priority,
                    vehicleName: insight.vehicleName,
                    detail:
                        `${insight.vehicleName}: ` +
                        priority.detail
                }))
            )
            .sort(
                (firstPriority, secondPriority) =>
                    levelWeight(firstPriority.level) -
                    levelWeight(secondPriority.level)
            )
            .slice(0, 6);

        return {
            metrics,
            priorities
        };
    }

    window.garageInsights = {
        assessVehicle,
        summarizeGarage
    };
})();
