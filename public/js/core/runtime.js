(function initializeCarCareRuntime() {
    const root = (window.CarCare =
        window.CarCare || {});

    root.core = root.core || {};
    root.pages = root.pages || {};

    root.core.translate = (value) =>
        typeof window.translateAppText ===
        "function"
            ? window.translateAppText(value)
            : value;
})();
