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
                canvas: "#e9eef5",
                surface: "#fbfcfe",
                ink: "#142033",
                accent: {
                    DEFAULT: "#2355d8",
                    soft: "#dbe6ff",
                    strong: "#183ba1"
                },
                border: "#ced8e8",
                sand: "#edf3fb"
            },
            fontFamily: {
                sans: [
                    "\"Aptos\"",
                    "\"Segoe UI\"",
                    "system-ui",
                    "sans-serif"
                ],
                display: [
                    "\"Iowan Old Style\"",
                    "\"Palatino Linotype\"",
                    "\"Book Antiqua\"",
                    "Georgia",
                    "serif"
                ]
            },
            boxShadow: {
                panel: "0 22px 46px rgba(20, 32, 51, 0.10)"
            },
            borderRadius: {
                panel: "24px"
            }
        }
    },
    plugins: []
};
