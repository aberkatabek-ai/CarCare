let refreshPromise = null;

function shouldAddJsonHeader(options) {
    return options.body !== undefined;
}

function isRefreshableRequest(url) {
    return ![
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/auth/logout",
        "/api/auth/forgot-password",
        "/api/auth/reset-password"
    ].includes(url);
}

async function parseApiResponse(response) {
    return response.json().catch(() => ({
        success: false,
        message:
            "The server returned an invalid response."
    }));
}

async function refreshAuthSession() {
    if (!refreshPromise) {
        refreshPromise = fetch(
            "/api/auth/refresh",
            {
                method: "POST",
                credentials: "same-origin"
            }
        )
            .then(async (response) => {
                const data =
                    await parseApiResponse(
                        response
                    );

                if (!response.ok) {
                    const error =
                        new Error(
                            data.message ||
                                "Session refresh failed."
                        );

                    error.status =
                        response.status;
                    throw error;
                }
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}

async function apiRequest(
    url,
    options = {}
) {
    const {
        retryOnUnauthorized = true,
        headers,
        ...fetchOptions
    } = options;

    const requestHeaders = {
        ...(shouldAddJsonHeader(options)
            ? {
                "Content-Type":
                    "application/json"
            }
            : {}),
        ...(headers || {})
    };

    const response = await fetch(url, {
        ...fetchOptions,
        credentials: "same-origin",
        headers: requestHeaders
    });

    const data =
        await parseApiResponse(response);

    if (
        response.status === 401 &&
        retryOnUnauthorized &&
        isRefreshableRequest(url)
    ) {
        try {
            await refreshAuthSession();

            return apiRequest(url, {
                ...options,
                retryOnUnauthorized: false
            });
        } catch (refreshError) {
            const error = new Error(
                data.message ||
                    refreshError.message ||
                    "Request failed."
            );

            error.status = 401;
            error.payload = data;

            throw error;
        }
    }

    if (!response.ok) {
        const error = new Error(
            data.message ||
            "Request failed."
        );

        error.status = response.status;
        error.payload = data;

        throw error;
    }

    return data;
}

function isUnauthorizedError(error) {
    return Number(error?.status) === 401;
}

function handlePageLoadError(
    error,
    fallbackMessage
) {
    console.error(error);

    if (isUnauthorizedError(error)) {
        window.location.href = "/login.html";
        return true;
    }

    if (fallbackMessage) {
        window.alert(
            `${fallbackMessage}\n\n${error.message}`
        );
    }

    return false;
}

const navigationItems = [
    {
        href: "/index.html",
        label: "Dashboard"
    },

    {
        href: "/maintenance.html",
        label: "Maintenance"
    },

    {
        href: "/health.html",
        label: "Health center"
    },

    {
        href: "/service-history.html",
        label: "Service history"
    },

    {
        href: "/documents.html",
        label: "Documents"
    },

    {
        href: "/settings.html",
        label: "Settings"
    },

    {
        href: "/costs.html",
        label: "Costs"
    }
];

function getCurrentPath() {
    const pathname =
        window.location.pathname;

    if (
        pathname === "/" ||
        pathname === ""
    ) {
        return "/index.html";
    }

    return pathname;
}

function enhanceBrandNavigation() {
    const brand =
        window.document.querySelector(
            ".dashboard-header .brand.compact"
        );

    if (!brand) {
        return;
    }

    const dashboardPath = "/index.html";
    const currentPath =
        getCurrentPath();
    const shouldNavigate =
        currentPath !== dashboardPath;

    brand.classList.toggle(
        "brand-link",
        shouldNavigate
    );

    if (!shouldNavigate) {
        brand.removeAttribute("role");
        brand.removeAttribute("tabindex");
        brand.removeAttribute("aria-label");
        return;
    }

    brand.setAttribute("role", "link");
    brand.setAttribute("tabindex", "0");
    brand.setAttribute(
        "aria-label",
        "Go to dashboard"
    );

    if (brand.dataset.dashboardBound) {
        return;
    }

    const navigateToDashboard = () => {
        window.location.href =
            dashboardPath;
    };

    brand.addEventListener(
        "click",
        navigateToDashboard
    );

    brand.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                navigateToDashboard();
            }
        }
    );

    brand.dataset.dashboardBound =
        "true";
}

function ensureMobileNavigationToggle() {
    const header =
        window.document.querySelector(
            ".dashboard-header"
        );

    const headerContent =
        window.document.querySelector(
            ".dashboard-header-content"
        );

    const headerActions =
        window.document.querySelector(
            ".header-actions"
        );

    if (
        !header ||
        !headerContent ||
        !headerActions
    ) {
        return;
    }

    let toggleButton =
        headerContent.querySelector(
            ".nav-toggle"
        );

    if (!toggleButton) {
        toggleButton =
            window.document.createElement(
                "button"
            );

        toggleButton.type = "button";
        toggleButton.className = "nav-toggle";
        toggleButton.setAttribute(
            "aria-controls",
            "header-actions"
        );

        headerActions.id =
            headerActions.id ||
            "header-actions";

        headerContent.appendChild(
            toggleButton
        );
    }

    function syncMenuState(isOpen) {
        header.classList.toggle(
            "menu-open",
            isOpen
        );

        toggleButton.textContent = isOpen
            ? "Close"
            : "Menu";

        toggleButton.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );

        toggleButton.setAttribute(
            "aria-label",
            isOpen
                ? "Close navigation menu"
                : "Open navigation menu"
        );
    }

    if (!toggleButton.dataset.bound) {
        toggleButton.addEventListener(
            "click",
            (event) => {
                event.stopPropagation();

                const isOpen =
                    !header.classList.contains(
                        "menu-open"
                    );

                syncMenuState(isOpen);
            }
        );

        headerActions.addEventListener(
            "click",
            (event) => {
                if (
                    event.target instanceof
                        window.HTMLAnchorElement &&
                    window.innerWidth <= 720
                ) {
                    syncMenuState(false);
                }
            }
        );

        window.document.addEventListener(
            "click",
            (event) => {
                if (
                    window.innerWidth > 720 ||
                    !header.classList.contains(
                        "menu-open"
                    )
                ) {
                    return;
                }

                if (
                    header.contains(event.target)
                ) {
                    return;
                }

                syncMenuState(false);
            }
        );

        window.document.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Escape") {
                    syncMenuState(false);
                }
            }
        );

        window.addEventListener(
            "resize",
            () => {
                if (window.innerWidth > 720) {
                    syncMenuState(false);
                }
            }
        );

        toggleButton.dataset.bound =
            "true";
    }

    syncMenuState(false);
}

function enhanceNavigation() {
    const headerActions =
        window.document.querySelector(
            ".header-actions"
        );

    if (!headerActions) {
        return;
    }

    const logoutButton =
        headerActions.querySelector(
            "#logout-button"
        );

    navigationItems.forEach(
        (navigationItem) => {
            let link =
                headerActions.querySelector(
                    `a[href="${navigationItem.href}"]`
                );

            if (!link) {
                link =
                    window.document
                        .createElement(
                            "a"
                        );
            }

            link.href =
                navigationItem.href;

            link.className =
                "nav-link";

            link.textContent =
                navigationItem.label;

            headerActions.insertBefore(
                link,
                logoutButton || null
            );
        }
    );

    const currentPath =
        getCurrentPath();

    headerActions
        .querySelectorAll(
            ".nav-link"
        )
        .forEach((link) => {
            const linkPath =
                link.getAttribute(
                    "href"
                );

            const isActive =
                linkPath ===
                currentPath;

            link.classList.toggle(
                "active",
                isActive
            );

            if (isActive) {
                link.setAttribute(
                    "aria-current",
                    "page"
                );
            } else {
                link.removeAttribute(
                    "aria-current"
                );
            }
        });

    enhanceBrandNavigation();
    ensureMobileNavigationToggle();
}

window.apiRequest = apiRequest;
window.isUnauthorizedError =
    isUnauthorizedError;
window.handlePageLoadError =
    handlePageLoadError;

if (
    window.document.readyState ===
    "loading"
) {
    window.document.addEventListener(
        "DOMContentLoaded",
        enhanceNavigation
    );
} else {
    enhanceNavigation();
}
