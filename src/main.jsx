import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initPwa } from "./pwa/pwaManager";
import { API_BASE_URL } from "./api/axiosConfig";
import { wakeServer } from "./api/serverStatus";
import { applyTheme, getStoredTheme } from "./theme/theme";
import "./theme/theme.css";

applyTheme(getStoredTheme());

// Start listening for install / update events before React renders,
// because beforeinstallprompt can fire very early.
initPwa();

// Start waking the (possibly sleeping) backend right away.
wakeServer(API_BASE_URL);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
