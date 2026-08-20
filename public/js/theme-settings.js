(function initializeThemeSettings() {
    const themeButtons =
        document.querySelectorAll(
            "[data-theme-option]"
        );

    const themeMessage = document.querySelector(
        "#theme-selection-message"
    );

    if (
        !themeButtons.length ||
        !window.CarCareTheme
    ) {
        return;
    }

    function renderActiveTheme(theme) {
        themeButtons.forEach((button) => {
            const isActive =
                button.dataset.themeOption ===
                theme;

            button.classList.toggle(
                "active",
                isActive
            );
            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        });
    }

    function showThemeMessage(message) {
        if (!themeMessage) {
            return;
        }

        themeMessage.textContent = message;
        themeMessage.className =
            "form-message success";
    }

    const initialTheme =
        window.CarCareTheme.getTheme();

    renderActiveTheme(initialTheme);

    themeButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                const selectedTheme =
                    button.dataset.themeOption;

                const appliedTheme =
                    window.CarCareTheme.applyTheme(
                        selectedTheme
                    );

                renderActiveTheme(appliedTheme);
                showThemeMessage(
                    "Accent color saved for this device."
                );
            }
        );
    });

    document.addEventListener(
        "carcare:themechange",
        (event) => {
            renderActiveTheme(
                event.detail?.theme ||
                    window.CarCareTheme.DEFAULT_THEME
            );
        }
    );
})();
