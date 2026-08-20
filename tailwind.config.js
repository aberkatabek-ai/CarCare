/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./public/**/*.html",
        "./public/**/*.js",
        "./src/**/*.js"
    ],
    theme: {
        extend: {
            colors: {
                canvas: "#e7ecef",
                surface: "#f8faf9",
                ink: "#142027",
                accent: {
                    DEFAULT: "#17323b",
                    soft: "#dbe6e4",
                    strong: "#0f232b"
                },
                border: "#c7d1d4",
                sand: "#e3e9e8"
            },
            fontFamily: {
                sans: [
                    "\"Aptos\"",
                    "\"Segoe UI\"",
                    "system-ui",
                    "sans-serif"
                ],
                display: [
                    "\"Aptos\"",
                    "\"Segoe UI\"",
                    "system-ui",
                    "sans-serif"
                ]
            },
            boxShadow: {
                panel: "0 24px 48px rgba(20, 32, 39, 0.10)"
            },
            borderRadius: {
                panel: "24px"
            }
        }
    },
    plugins: []
};
