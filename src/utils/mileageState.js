function normalizeMileage(value) {
    const mileage = Number(value);

    if (
        !Number.isFinite(mileage) ||
        mileage < 0
    ) {
        return null;
    }

    return mileage;
}

function calculateVehicleCurrentMileage({
    mileageHistoryReadings = [],
    fuelReadings = [],
    expenseReadings = [],
    serviceReadings = [],
    maintenanceReadings = []
}) {
    const candidates = [
        ...mileageHistoryReadings,
        ...fuelReadings,
        ...expenseReadings,
        ...serviceReadings,
        ...maintenanceReadings
    ]
        .map(normalizeMileage)
        .filter((value) => value !== null);

    if (candidates.length === 0) {
        return 0;
    }

    return Math.max(...candidates);
}

function shouldRejectBackdatedMileageEntry({
    entryDate,
    latestEventDate,
    currentMileage,
    nextMileage
}) {
    return (
        typeof latestEventDate === "string" &&
        entryDate < latestEventDate &&
        Number(nextMileage) > Number(currentMileage)
    );
}

module.exports = {
    calculateVehicleCurrentMileage,
    shouldRejectBackdatedMileageEntry
};
