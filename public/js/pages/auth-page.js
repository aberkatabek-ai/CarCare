(function initializeAuthPageModule() {
    const carCare = (window.CarCare =
        window.CarCare || {});
    carCare.pages = carCare.pages || {};

    carCare.pages.initAuthPage = () => {
        const loginForm =
            document.querySelector(
                "#login-form"
            );
        const registerForm =
            document.querySelector(
                "#register-form"
            );
        const messageElement =
            document.querySelector(
                "#form-message"
            );
        const t =
            carCare.core.translate ||
            ((value) => value);
        const passwordValidation =
            carCare.core
                .passwordValidation;

        if (!passwordValidation) {
            throw new Error(
                "Password validation module is not available."
            );
        }

        const {
            requirementsMessage,
            getPasswordValidationError,
            attachPasswordToggles
        } = passwordValidation;

        function showMessage(
            message,
            type = "error"
        ) {
            if (!messageElement) {
                return;
            }

            messageElement.textContent =
                message;
            messageElement.className =
                `form-message ${type}`;
        }

        function setSubmitting(
            form,
            submitting
        ) {
            const button =
                form.querySelector(
                    'button[type="submit"]'
                );

            button.disabled = submitting;
            button.textContent =
                submitting
                    ? t("Please wait...")
                    : button.dataset.defaultText;
        }

        attachPasswordToggles();

        if (loginForm) {
            const button =
                loginForm.querySelector(
                    'button[type="submit"]'
                );
            button.dataset.defaultText =
                t("Log in");

            loginForm.addEventListener(
                "submit",
                async (event) => {
                    event.preventDefault();

                    const email =
                        loginForm.email.value.trim();
                    const password =
                        loginForm.password.value;

                    showMessage("");
                    setSubmitting(
                        loginForm,
                        true
                    );

                    try {
                        await window.apiRequest(
                            "/api/auth/login",
                            {
                                method: "POST",
                                body: JSON.stringify(
                                    {
                                        email,
                                        password
                                    }
                                )
                            }
                        );

                        showMessage(
                            t(
                                "Login successful."
                            ),
                            "success"
                        );

                        window.location.href =
                            "/";
                    } catch (error) {
                        showMessage(
                            error.message
                        );
                    } finally {
                        setSubmitting(
                            loginForm,
                            false
                        );
                    }
                }
            );
        }

        if (registerForm) {
            const button =
                registerForm.querySelector(
                    'button[type="submit"]'
                );
            button.dataset.defaultText =
                t("Create account");

            registerForm.addEventListener(
                "submit",
                async (event) => {
                    event.preventDefault();

                    const fullName =
                        registerForm.fullName.value.trim();
                    const email =
                        registerForm.email.value.trim();
                    const password =
                        registerForm.password.value;
                    const passwordConfirmation =
                        registerForm.passwordConfirmation.value;

                    showMessage("");

                    if (
                        password !==
                        passwordConfirmation
                    ) {
                        showMessage(
                            t(
                                "Passwords do not match."
                            )
                        );
                        return;
                    }

                    const passwordError =
                        getPasswordValidationError(
                            password
                        );

                    if (passwordError) {
                        showMessage(
                            `${t(passwordError)} ${t(requirementsMessage)}`
                        );
                        return;
                    }

                    setSubmitting(
                        registerForm,
                        true
                    );

                    try {
                        await window.apiRequest(
                            "/api/auth/register",
                            {
                                method: "POST",
                                body: JSON.stringify(
                                    {
                                        fullName,
                                        email,
                                        password
                                    }
                                )
                            }
                        );

                        showMessage(
                            t(
                                "Your account was created successfully."
                            ),
                            "success"
                        );

                        window.location.href =
                            "/";
                    } catch (error) {
                        showMessage(
                            error.message
                        );
                    } finally {
                        setSubmitting(
                            registerForm,
                            false
                        );
                    }
                }
            );
        }
    };
})();
