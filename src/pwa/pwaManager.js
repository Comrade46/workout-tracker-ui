// ==========================================
// WORKOUT TRACKER - PWA MANAGER
// ==========================================
// One place for:
//   - "Install app" availability (beforeinstallprompt)
//   - installed / standalone detection
//   - service worker registration and updates
//   - remote version check against /version.json
//
// React reads the state through usePwa() (src/pwa/usePwa.js).

import { registerSW } from "virtual:pwa-register";
import { APP_VERSION } from "../config/appVersion";
import { isNewerVersion } from "./version";

const VERSION_CHECK_INTERVAL_MS = 30 * 60 * 1000;
const UPDATE_WAIT_TIMEOUT_MS = 15 * 1000;

let state = {
    canInstall: false,
    isInstalled: false,
    updateAvailable: false,
    latestVersion: null,
    updating: false
};

const listeners = new Set();

let deferredInstallPrompt = null;
let updateServiceWorker = null;
let registration = null;
let newWorkerWaiting = false;
let initialized = false;

function setState(patch) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getSnapshot() {
    return state;
}

// ------------------------------------------
// Installed / standalone detection
// ------------------------------------------

function isRunningStandalone() {
    return (
        window.matchMedia?.("(display-mode: standalone)").matches ||
        // iOS Safari
        window.navigator.standalone === true
    );
}

// ------------------------------------------
// Remote version check
// ------------------------------------------

async function checkRemoteVersion() {
    try {
        const response = await fetch(
            `/version.json?t=${Date.now()}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        if (!isNewerVersion(data.version, APP_VERSION)) {
            return;
        }

        setState({
            updateAvailable: true,
            latestVersion: data.version
        });

        // Start downloading the new service worker in the background
        // so the update is ready when the user clicks the icon.
        registration?.update().catch(() => {});
    } catch {
        // Offline or version file unavailable: try again later.
    }
}

// ------------------------------------------
// Initialisation (called once from main.jsx)
// ------------------------------------------

export function initPwa() {
    if (initialized) {
        return;
    }

    initialized = true;

    setState({ isInstalled: isRunningStandalone() });

    // Chrome / Edge / Android fire this when the app can be installed.
    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;

        setState({ canInstall: !isRunningStandalone() });
    });

    window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;
        setState({ canInstall: false, isInstalled: true });
    });

    window
        .matchMedia?.("(display-mode: standalone)")
        .addEventListener?.("change", (event) => {
            if (event.matches) {
                setState({ isInstalled: true, canInstall: false });
            }
        });

    // Service worker only exists in production builds.
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
        updateServiceWorker = registerSW({
            immediate: true,

            // A new version has been downloaded and is waiting.
            onNeedRefresh() {
                newWorkerWaiting = true;
                setState({ updateAvailable: true });
            },

            onRegisteredSW(_swUrl, swRegistration) {
                registration = swRegistration || null;
            },

            onRegisterError(error) {
                console.warn("Service worker registration failed:", error);
            }
        });
    }

    checkRemoteVersion();

    setInterval(checkRemoteVersion, VERSION_CHECK_INTERVAL_MS);

    // Check again whenever the user comes back to the app.
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            checkRemoteVersion();
        }
    });
}

// ------------------------------------------
// Actions
// ------------------------------------------

export async function promptInstall() {
    if (!deferredInstallPrompt) {
        return;
    }

    const promptEvent = deferredInstallPrompt;

    // The browser allows each prompt to be used only once.
    deferredInstallPrompt = null;
    setState({ canInstall: false });

    promptEvent.prompt();

    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
        setState({ isInstalled: true });
    }
}

function waitForNewWorker(timeoutMs) {
    return new Promise((resolve) => {
        const startedAt = Date.now();

        const timer = setInterval(() => {
            if (newWorkerWaiting || Date.now() - startedAt > timeoutMs) {
                clearInterval(timer);
                resolve(newWorkerWaiting);
            }
        }, 250);
    });
}

export async function applyUpdate() {
    if (state.updating) {
        return;
    }

    setState({ updating: true });

    // Development build or no service worker support: a reload is enough.
    if (!updateServiceWorker) {
        window.location.reload();
        return;
    }

    try {
        // version.json is newer but the new worker has not arrived yet.
        if (!newWorkerWaiting) {
            await registration?.update();
            await waitForNewWorker(UPDATE_WAIT_TIMEOUT_MS);
        }

        if (newWorkerWaiting) {
            // Activates the waiting worker; the page reloads once it
            // takes control and serves the new version.
            await updateServiceWorker(true);

            // Safety net if the reload event never arrives.
            setTimeout(() => window.location.reload(), 5000);
            return;
        }
    } catch (error) {
        console.warn("Update failed, reloading instead:", error);
    }

    window.location.reload();
}
