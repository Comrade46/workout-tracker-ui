import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import { APP_VERSION, APP_VERSION_LABEL } from "../config/appVersion";
import {
    clearSession,
    getStoredUser,
    mustChangePassword,
    saveSession
} from "../auth/session";
import {
    removePendingWorkout,
    syncPendingWorkouts,
    usePendingWorkouts
} from "../offline/workoutOutbox";
import "./Account.css";

function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// Program marker "[program:...]" is for the app, not for people.
function workoutTitle(payload) {
    return (payload?.notes || "Workout").replace(/\s*\[program:[^\]]*\]\s*/g, "").trim() || "Workout";
}

function setCount(payload) {
    const count = payload?.sets?.length || 0;
    return `${count} set${count === 1 ? "" : "s"}`;
}

// ---------------------------------------------------------------
// Workouts saved on this phone that are not on the server yet
// ---------------------------------------------------------------
function UploadQueue() {
    const { pending, syncing } = usePendingWorkouts();
    const [confirmDelete, setConfirmDelete] = useState(null);

    if (pending.length === 0) {
        return null;
    }

    return (
        <section className="wt-acc-card" id="uploads" aria-labelledby="wt-uploads-title">
            <div className="wt-acc-section-head">
                <h2 id="wt-uploads-title">
                    ⏳ Workouts waiting to upload
                    <span className="wt-acc-count">{pending.length}</span>
                </h2>

                <button
                    type="button"
                    className="wt-acc-button small"
                    onClick={() => syncPendingWorkouts({ retryFailed: true })}
                    disabled={syncing}
                >
                    {syncing ? "Uploading…" : "Upload now"}
                </button>
            </div>

            <p className="wt-acc-card-hint">
                These are saved on this phone and upload automatically when the
                internet and server are available.
            </p>

            <div className="wt-acc-list">
                {pending.map((entry) => (
                    <div key={entry.clientId} className="wt-acc-item">
                        <div className="wt-acc-item-main">
                            <div className="wt-acc-item-title">{workoutTitle(entry.payload)}</div>
                            <div className="wt-acc-meta">
                                {formatDate(entry.payload?.workoutDate)} ·{" "}
                                {setCount(entry.payload)} ·{" "}
                                {entry.status === "failed" ? "⚠️ could not upload" : "waiting"}
                            </div>
                            {entry.error && entry.status === "failed" && (
                                <div className="wt-acc-item-text">{entry.error}</div>
                            )}
                        </div>

                        {entry.status === "failed" && (
                            confirmDelete === entry.clientId ? (
                                <div className="wt-acc-actions">
                                    <button
                                        type="button"
                                        className="wt-acc-button small danger"
                                        onClick={() => removePendingWorkout(entry.clientId)}
                                    >
                                        Yes, delete it
                                    </button>
                                    <button
                                        type="button"
                                        className="wt-acc-button small secondary"
                                        onClick={() => setConfirmDelete(null)}
                                    >
                                        Keep
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="wt-acc-button small secondary"
                                    onClick={() => setConfirmDelete(entry.clientId)}
                                >
                                    Delete
                                </button>
                            )
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------
// Change password
// ---------------------------------------------------------------
function ChangePassword({ forced, onChanged }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (newPassword.length < 6) {
            setError("The new password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("The two new passwords do not match.");
            return;
        }

        setSaving(true);

        try {
            const response = await api.put("/users/me/password", { currentPassword, newPassword });

            saveSession(response.data);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setSuccess("Password changed. Other phones and computers were logged out.");
            onChanged?.();
        } catch (requestError) {
            setError(requestError.userMessage || "The password could not be changed.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="wt-acc-card" aria-labelledby="wt-password-title">
            <h2 id="wt-password-title">🔒 {forced ? "Choose your new password" : "Change password"}</h2>
            <p className="wt-acc-card-hint">
                {forced
                    ? "Enter the temporary password you received, then your own new password."
                    : "At least 6 characters. You stay logged in on this device."}
            </p>

            {error && <div className="wt-acc-message error" role="alert" style={{ marginBottom: 14 }}>{error}</div>}
            {success && <div className="wt-acc-message success" role="status" style={{ marginBottom: 14 }}>✅ {success}</div>}

            <form className="wt-acc-form" onSubmit={handleSubmit}>
                <div className="wt-acc-field">
                    <label htmlFor="wt-current-password">
                        {forced ? "Temporary password" : "Current password"}
                    </label>
                    <input
                        id="wt-current-password"
                        type="password"
                        className="wt-acc-input"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                        disabled={saving}
                    />
                </div>

                <div className="wt-acc-field">
                    <label htmlFor="wt-new-password">New password</label>
                    <input
                        id="wt-new-password"
                        type="password"
                        className="wt-acc-input"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        maxLength={100}
                        required
                        disabled={saving}
                    />
                </div>

                <div className="wt-acc-field">
                    <label htmlFor="wt-confirm-password">Repeat new password</label>
                    <input
                        id="wt-confirm-password"
                        type="password"
                        className="wt-acc-input"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        maxLength={100}
                        required
                        disabled={saving}
                    />
                </div>

                <div className="wt-acc-actions">
                    <button type="submit" className="wt-acc-button" disabled={saving}>
                        {saving ? "Saving…" : "Save new password"}
                    </button>
                </div>
            </form>
        </section>
    );
}

// ---------------------------------------------------------------
// Send feedback
// ---------------------------------------------------------------
function Feedback() {
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSent("");
        setSending(true);

        try {
            const response = await api.post("/feedback", {
                message: message.trim(),
                appVersion: APP_VERSION,
                page: window.location.pathname,
                device: navigator.userAgent.slice(0, 300)
            });

            setMessage("");
            setSent(response.data?.message || "Thank you! Your feedback was sent.");
        } catch (requestError) {
            setError(requestError.userMessage || "Feedback could not be sent. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <section className="wt-acc-card" id="feedback" aria-labelledby="wt-feedback-title">
            <h2 id="wt-feedback-title">💬 Send feedback</h2>
            <p className="wt-acc-card-hint">
                Found a problem or have an idea? Tell us - it goes straight to the app admin.
            </p>

            {error && <div className="wt-acc-message error" role="alert" style={{ marginBottom: 14 }}>{error}</div>}
            {sent && <div className="wt-acc-message success" role="status" style={{ marginBottom: 14 }}>✅ {sent}</div>}

            <form className="wt-acc-form" onSubmit={handleSubmit}>
                <div className="wt-acc-field">
                    <label htmlFor="wt-feedback-message">Your message</label>
                    <textarea
                        id="wt-feedback-message"
                        className="wt-acc-textarea"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="What happened, or what would you like to see?"
                        maxLength={2000}
                        required
                        disabled={sending}
                    />
                    <span className="wt-acc-counter">{message.length}/2000</span>
                </div>

                <div className="wt-acc-actions">
                    <button
                        type="submit"
                        className="wt-acc-button"
                        disabled={sending || message.trim().length === 0}
                    >
                        {sending ? "Sending…" : "Send feedback"}
                    </button>
                </div>
            </form>
        </section>
    );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------
function ProfilePage() {
    const navigate = useNavigate();
    const [account, setAccount] = useState(getStoredUser());
    const [forced, setForced] = useState(mustChangePassword());

    useEffect(() => {
        let cancelled = false;

        api.get("/users/me")
            .then((response) => {
                if (!cancelled) setAccount(response.data);
            })
            .catch(() => {
                // Offline: the saved account details are shown instead.
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const handleLogout = () => {
        clearSession();
        navigate("/login", { replace: true });
    };

    const handlePasswordChanged = () => {
        if (forced) {
            setForced(false);
            navigate("/dashboard", { replace: true });
        }
    };

    const username = account?.username || "";

    return (
        <div className="wt-acc-page">
            <div className="wt-acc-container">
                <div>
                    <h1 className="wt-acc-title">👤 Profile</h1>
                    <p className="wt-acc-subtitle">Your account, password and feedback.</p>
                </div>

                {forced && (
                    <div className="wt-acc-message warning" role="alert">
                        🔑 You logged in with a temporary password. Please choose your own
                        password to continue.
                    </div>
                )}

                <section className="wt-acc-card" aria-label="Account">
                    <div className="wt-acc-identity">
                        <div className="wt-acc-avatar" aria-hidden="true">
                            {username.slice(0, 1) || "?"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div className="wt-acc-name">
                                {username || "Your account"}
                                {account?.admin && <span className="wt-acc-badge">Admin</span>}
                            </div>
                            {account?.email && <div className="wt-acc-meta">{account.email}</div>}
                            {account?.createdAt && (
                                <div className="wt-acc-meta">Member since {formatDate(account.createdAt)}</div>
                            )}
                        </div>
                    </div>
                </section>

                <ChangePassword forced={forced} onChanged={handlePasswordChanged} />

                {!forced && (
                    <>
                        <UploadQueue />
                        <Feedback />

                        <section className="wt-acc-card" aria-label="App">
                            <div className="wt-acc-section-head" style={{ marginBottom: 0 }}>
                                <div>
                                    <h2>📱 App</h2>
                                    <div className="wt-acc-meta">
                                        Workout Tracker · {APP_VERSION_LABEL}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="wt-acc-button secondary"
                                    onClick={handleLogout}
                                >
                                    Log out
                                </button>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProfilePage;
