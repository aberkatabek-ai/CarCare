(function initializePasswordValidationModule() {
    const carCare = (window.CarCare =
        window.CarCare || {});
    carCare.core = carCare.core || {};

    const requirementsMessage =
        "Use at least 8 characters, including uppercase, lowercase, a number, and a special character, with no spaces.";

    function getPasswordValidationError(
        password,
        label = "Password"
    ) {
        if (password.length < 8) {
            return `${label} must contain at least 8 characters.`;
        }

        if (/\s/.test(password)) {
            return `${label} cannot contain spaces.`;
        }

        if (!/[A-Z]/.test(password)) {
            return `${label} must contain at least one uppercase letter.`;
        }

        if (!/[a-z]/.test(password)) {
            return `${label} must contain at least one lowercase letter.`;
        }

        if (!/\d/.test(password)) {
            return `${label} must contain at least one number.`;
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            return `${label} must contain at least one special character.`;
        }

        return null;
    }

    function attachPasswordToggles(
        root = document
    ) {
        const t =
            carCare.core.translate ||
            ((value) => value);

        root.querySelectorAll(
            "[data-password-toggle]"
        ).forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    const wrapper =
                        button.closest(
                            ".password-input-wrapper"
                        );
                    const input =
                        wrapper?.querySelector(
                            'input[type="password"], input[type="text"]'
                        );

                    if (!input) {
                        return;
                    }

                    const shouldShow =
                        input.type ===
                        "password";

                    input.type = shouldShow
                        ? "text"
                        : "password";

                    button.textContent =
                        shouldShow
                            ? t("Hide")
                            : t("Show");

                    button.setAttribute(
                        "aria-label",
                        shouldShow
                            ? t(
                                "Hide password"
                            )
                            : t(
                                "Show password"
                            )
                    );

                    button.setAttribute(
                        "aria-pressed",
                        shouldShow
                            ? "true"
                            : "false"
                    );
                }
            );
        });
    }

    carCare.core.passwordValidation = {
        requirementsMessage,
        getPasswordValidationError,
        attachPasswordToggles
    };
})();
