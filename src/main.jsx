import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initPwa } from "./pwa/pwaManager";
import { applyTheme, getStoredTheme } from "./theme/theme";
import "./theme/theme.css";

applyTheme(getStoredTheme());

// Start listening for install / update events before React renders,
// because beforeinstallprompt can fire very early.
initPwa();

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
