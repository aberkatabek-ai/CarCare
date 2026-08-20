(function bootstrapAuthPage() {
    function initialize() {
        window.CarCare?.pages?.initAuthPage?.();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
        return;
    }

    initialize();
})();
