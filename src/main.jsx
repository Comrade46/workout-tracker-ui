import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerSW } from "virtual:pwa-register";
import { applyTheme, getStoredTheme } from "./theme/theme";
import "./theme/theme.css";

applyTheme(getStoredTheme());

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// PWA service worker registration.
// vite-plugin-pwa generates and manages the service worker during production builds.
if (import.meta.env.PROD) {
    registerSW({
        immediate: true,
    });
}