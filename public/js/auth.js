const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const messageElement = document.querySelector("#form-message");

function showMessage(message, type = "error") {
    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.className = `form-message ${type}`;
}

function setSubmitting(form, submitting) {
    const button = form.querySelector('button[type="submit"]');

    button.disabled = submitting;
    button.textContent = submitting
        ? "Please wait..."
        : button.dataset.defaultText;
}

if (loginForm) {
    const button = loginForm.querySelector('button[type="submit"]');
    button.dataset.defaultText = button.textContent;

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;

        showMessage("");
        setSubmitting(loginForm, true);

        try {
            await window.apiRequest("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password
                })
            });

            showMessage("Login successful.", "success");

            window.location.href = "/index.html";
        } catch (error) {
            showMessage(error.message);
        } finally {
            setSubmitting(loginForm, false);
        }
    });
}

if (registerForm) {
    const button = registerForm.querySelector('button[type="submit"]');
    button.dataset.defaultText = button.textContent;

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = registerForm.fullName.value.trim();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value;
        const passwordConfirmation =
            registerForm.passwordConfirmation.value;

        showMessage("");

        if (password !== passwordConfirmation) {
            showMessage("Passwords do not match.");
            return;
        }

        setSubmitting(registerForm, true);

        try {
            await window.apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    fullName,
                    email,
                    password
                })
            });

            showMessage(
                "Your account was created successfully.",
                "success"
            );

            window.location.href = "/index.html";
        } catch (error) {
            showMessage(error.message);
        } finally {
            setSubmitting(registerForm, false);
        }
    });
}