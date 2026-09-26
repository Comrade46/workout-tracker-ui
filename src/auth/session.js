// ==========================================
// LOGIN SESSION (token + account flags)
// ==========================================
// The login token lives in localStorage "token"; account flags from the
// server (admin, must change password) in "user".

const TOKEN_KEY = "token";
const USER_KEY = "user";

// Renew the token when the app is opened and it is older than this.
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

export function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

// Decoded token body ({ sub, iat, exp }) or null.
function tokenPayload(token = getToken()) {
    if (!token) return null;

    try {
        const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(part));
    } catch {
        return null;
    }
}

// Username of the logged-in user (from the token).
export function getUsername() {
    return tokenPayload()?.sub || null;
}

export function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch {
        return null;
    }
}

export function isAdmin() {
    return Boolean(getStoredUser()?.admin);
}

export function mustChangePassword() {
    return Boolean(getStoredUser()?.mustChangePassword);
}

// Save a login / token response from the server.
export function saveSession(data) {
    if (!data?.token) return;

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(
        USER_KEY,
        JSON.stringify({
            id: data.id,
            username: data.username,
            email: data.email,
            admin: Boolean(data.admin),
            mustChangePassword: Boolean(data.mustChangePassword)
        })
    );

    window.dispatchEvent(new CustomEvent("workoutTracker:sessionChanged"));
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("username");
}

/*
 * Tokens last 30 days. When the app is opened with a token older than a
 * day (or from before account flags existed) it asks for a fresh one, so
 * people who use the app stay logged in.
 */
export function shouldRenewToken() {
    const payload = tokenPayload();

    if (!payload) return false;

    const issuedAtMs = (payload.iat || 0) * 1000;

    return !getStoredUser() || Date.now() - issuedAtMs > RENEW_AFTER_MS;
}
