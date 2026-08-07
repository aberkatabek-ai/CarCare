function normalizeLicensePlate(value) {
    if (typeof value !== "string") {
        return {
            displayValue: null,
            key: null
        };
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return {
            displayValue: null,
            key: null
        };
    }

    const displayValue = trimmedValue
        .replace(/\s+/g, " ")
        .toUpperCase();

    const key = displayValue.replace(
        /[^A-Z0-9]/g,
        ""
    );

    return {
        displayValue,
        key: key || null
    };
}

module.exports = {
    normalizeLicensePlate
};
