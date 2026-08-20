(function bootstrapForgotPasswordPage() {
    function initialize() {
        window.CarCare?.pages?.initForgotPasswordPage?.();
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
