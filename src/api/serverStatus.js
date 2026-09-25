// ==========================================
// WORKOUT TRACKER - SERVER STATUS
// ==========================================
// The backend runs on Render's free plan, which puts it to sleep after
// ~15 minutes without traffic. The first request then takes 1-2 minutes
// while it starts up.
//
// This module:
//   - counts requests that are taking unusually long, so a small
//     "waking up the server" indicator can be shown (ServerWakeIndicator)
//   - pings /health as soon as the app opens, so the server is already
//     starting while the user is still on the login page.

const SLOW_REQUEST_AFTER_MS = 4000;

let state = {
    slowRequests: 0
};

const listeners = new Set();

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

/*
 * Call when a request starts. Returns a function to call when it
 * finishes (success or error).
 */
export function trackRequest() {
    let markedSlow = false;

    const timer = setTimeout(() => {
        markedSlow = true;
        setState({ slowRequests: state.slowRequests + 1 });
    }, SLOW_REQUEST_AFTER_MS);

    return () => {
        clearTimeout(timer);

        if (markedSlow) {
            setState({
                slowRequests: Math.max(0, state.slowRequests - 1)
            });
        }
    };
}

/*
 * Start waking the backend immediately. Uses fetch (not the shared axios
 * instance) so it never triggers session-expiry handling.
 */
export function wakeServer(apiBaseUrl) {
    const finished = trackRequest();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);

    fetch(`${apiBaseUrl}/health`, {
        cache: "no-store",
        signal: controller.signal
    })
        .catch(() => {
            // Real requests will report problems; nothing to do here.
        })
        .finally(() => {
            clearTimeout(timeout);
            finished();
        });
}
