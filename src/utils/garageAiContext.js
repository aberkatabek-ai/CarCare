function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}

function formatVehicleName(vehicle) {
    if (!vehicle) {
        return "Vehicle";
    }

    if (vehicle.nickname) {
        return vehicle.nickname;
    }

    return `${vehicle.brand} ${vehicle.model}`;
}

function summarizeVehicle({
    vehicle,
    maintenancePlans,
    serviceHistory,
    issues,
    documents,
    expenses,
    fuelEntries
}) {
    const activeIssues = issues.filter(
        (issue) => issue.status !== "repaired"
    );

    const overduePlans = maintenancePlans.filter(
        (plan) => plan.status === "overdue"
    );

    const dueSoonPlans = maintenancePlans.filter(
        (plan) => plan.status === "due_soon"
    );

    const urgentIssues = activeIssues.filter(
        (issue) => issue.risk_level === "red"
    );

    const watchIssues = activeIssues.filter(
        (issue) => issue.risk_level === "orange"
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

    const totalServiceCost = serviceHistory.reduce(
        (total, record) =>
            total + toNumber(record.actual_cost),
        0
    );

    const totalExpenseCost = expenses.reduce(
        (total, record) =>
            total + toNumber(record.amount),
        0
    );

    const totalFuelCost = fuelEntries.reduce(
        (total, record) =>
            total + toNumber(record.total_cost),
        0
    );

    const recentService = serviceHistory
        .slice()
        .sort(
            (firstRecord, secondRecord) =>
                new Date(secondRecord.completed_at) -
                new Date(firstRecord.completed_at)
        )[0] || null;

    const topAlerts = [];

    urgentIssues.forEach((issue) => {
        topAlerts.push(
            `Urgent issue: ${issue.issue_title}`
        );
    });

    overduePlans.forEach((plan) => {
        topAlerts.push(
            `Overdue maintenance: ${plan.name}`
        );
    });

    expiredDocuments.forEach((documentRecord) => {
        topAlerts.push(
            `Expired document: ${documentRecord.title}`
        );
    });

    return {
        id: vehicle.id,
        name: formatVehicleName(vehicle),
        brand: vehicle.brand,
        model: vehicle.model,
        modelYear: vehicle.model_year,
        currentMileage: toNumber(
            vehicle.current_mileage
        ),
        ownershipStatus:
            vehicle.ownership_status || "unknown",
        maintenance: {
            totalPlans: maintenancePlans.length,
            overdueCount: overduePlans.length,
            dueSoonCount: dueSoonPlans.length
        },
        mechanical: {
            openIssueCount: activeIssues.length,
            urgentIssueCount:
                urgentIssues.length,
            monitorIssueCount:
                watchIssues.length
        },
        documents: {
            trackedCount: documents.length,
            expiredCount:
                expiredDocuments.length,
            dueSoonCount:
                dueSoonDocuments.length
        },
        costs: {
            serviceTotal: totalServiceCost,
            expenseTotal: totalExpenseCost,
            fuelTotal: totalFuelCost,
            ownershipTotal:
                totalServiceCost +
                totalExpenseCost +
                totalFuelCost
        },
        recentService: recentService
            ? {
                name:
                    recentService.service_name,
                completedAt:
                    recentService.completed_at,
                actualCost: toNumber(
                    recentService.actual_cost
                )
            }
            : null,
        topAlerts: topAlerts.slice(0, 4)
    };
}

function buildGarageAiContext(data) {
    const vehicles = data.vehicles || [];
    const maintenancePlans =
        data.maintenancePlans || [];
    const serviceHistory =
        data.serviceHistory || [];
    const issues = data.issues || [];
    const documents = data.documents || [];
    const expenses = data.expenses || [];
    const fuelEntries = data.fuelEntries || [];
    const costSummary = data.costSummary || {};

    const activeVehicleSummaries =
        vehicles.map((vehicle) =>
            summarizeVehicle({
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
                issues: issues.filter(
                    (issue) =>
                        String(issue.vehicle_id) ===
                        String(vehicle.id)
                ),
                documents: documents.filter(
                    (documentRecord) =>
                        String(
                            documentRecord.vehicle_id
                        ) === String(vehicle.id)
                ),
                expenses: expenses.filter(
                    (expense) =>
                        String(expense.vehicle_id) ===
                        String(vehicle.id)
                ),
                fuelEntries: fuelEntries.filter(
                    (entry) =>
                        String(entry.vehicle_id) ===
                        String(vehicle.id)
                )
            })
        );

    const urgentItems = [];

    activeVehicleSummaries.forEach((vehicle) => {
        vehicle.topAlerts.forEach((alert) => {
            urgentItems.push(
                `${vehicle.name}: ${alert}`
            );
        });
    });

    const totalMaintenanceOverdue =
        activeVehicleSummaries.reduce(
            (total, vehicle) =>
                total +
                vehicle.maintenance.overdueCount,
            0
        );

    const totalOpenIssues =
        activeVehicleSummaries.reduce(
            (total, vehicle) =>
                total +
                vehicle.mechanical.openIssueCount,
            0
        );

    const totalExpiredDocuments =
        activeVehicleSummaries.reduce(
            (total, vehicle) =>
                total +
                vehicle.documents.expiredCount,
            0
        );

    return {
        generatedAt: new Date().toISOString(),
        overview: {
            activeVehicleCount: vehicles.length,
            overdueMaintenanceCount:
                totalMaintenanceOverdue,
            openIssueCount: totalOpenIssues,
            expiredDocumentCount:
                totalExpiredDocuments,
            totalOwnershipCost: toNumber(
                costSummary.totalOwnershipCost
            ),
            totalServiceCost: toNumber(
                costSummary.totalServiceCost
            ),
            totalExpenseCost: toNumber(
                costSummary.totalExpenseCost
            ),
            totalFuelCost: toNumber(
                costSummary.totalFuelCost
            )
        },
        urgentItems: urgentItems.slice(0, 8),
        vehicles: activeVehicleSummaries
    };
}

module.exports = {
    formatVehicleName,
    buildGarageAiContext
};
