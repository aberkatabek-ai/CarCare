(function initializeCarCareTheme() {
    const STORAGE_KEY = "carcare.accentTheme";
    const DEFAULT_THEME = "graphite";
    const SUPPORTED_THEMES = [
        "graphite",
        "blue",
        "green",
        "red"
    ];

    function normalizeTheme(theme) {
        return SUPPORTED_THEMES.includes(theme)
            ? theme
            : DEFAULT_THEME;
    }

    function getStoredTheme() {
        try {
            return normalizeTheme(
                window.localStorage.getItem(
                    STORAGE_KEY
                )
            );
        } catch (error) {
            return DEFAULT_THEME;
        }
    }

    function applyTheme(theme) {
        const normalizedTheme =
            normalizeTheme(theme);

        document.documentElement.setAttribute(
            "data-accent-theme",
            normalizedTheme
        );

        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                normalizedTheme
            );
        } catch (error) {
            /* noop */
        }

        document.dispatchEvent(
            new CustomEvent(
                "carcare:themechange",
                {
                    detail: {
                        theme: normalizedTheme
                    }
                }
            )
        );

        return normalizedTheme;
    }

    const initialTheme = getStoredTheme();

    document.documentElement.setAttribute(
        "data-accent-theme",
        initialTheme
    );

    window.CarCareTheme = {
        STORAGE_KEY,
        DEFAULT_THEME,
        SUPPORTED_THEMES,
        getTheme: getStoredTheme,
        applyTheme
    };
})();
