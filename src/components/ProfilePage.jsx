import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BodyGoalsForm from "../progress/BodyGoalsForm";
import { BADGES, earnedBadges } from "../progress/achievements";
import ThemeToggle from "../theme/ThemeToggle";
import api from "../api/axiosConfig";
import { APP_VERSION } from "../config/appVersion";
import {
    clearSession,
    getStoredUser,
    mustChangePassword,
    saveSession
} from "../auth/session";
import { isSoundOn, setSoundOn, unlockAudio } from "../coach/workoutCoach";
import {
    pendingWorkouts,
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
    return (payload?.notes || "Workout").replace(/\s*\[(program|plan):[^\]]*\]\s*/g, "").trim() || "Workout";
}

function setCount(payload) {
    const count = payload?.sets?.length || 0;
    return `${count} set${count === 1 ? "" : "s"}`;
}

// ---------------------------------------------------------------
// Menu building blocks
// ---------------------------------------------------------------

function MenuSection({ title, children }) {
    return (
        <section className="wt-me-section" aria-label={title}>
            <h2 className="wt-me-section-title">{title}</h2>
            <div className="wt-me-group">{children}</div>
        </section>
    );
}

// A row that opens a panel under it when tapped.
function MenuRow({ id, icon, title, subtitle, badge, open, onToggle, children }) {
    const panelId = `wt-me-panel-${id}`;

    return (
        <div className={`wt-me-item${open ? " open" : ""}`} id={id}>
            <button
                type="button"
                className="wt-me-row"
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={panelId}
            >
                <span className="wt-me-icon" aria-hidden="true">{icon}</span>
                <span className="wt-me-text">
                    <span className="wt-me-title">{title}</span>
                    {subtitle && <span className="wt-me-subtitle">{subtitle}</span>}
                </span>
                {badge ? <span className="wt-acc-count">{badge}</span> : null}
                <span className="wt-me-chevron" aria-hidden="true">›</span>
            </button>

            {open && (
                <div className="wt-me-panel" id={panelId}>
                    {children}
                </div>
            )}
        </div>
    );
}

// A row that goes to another page.
function MenuLink({ icon, title, subtitle, to }) {
    return (
        <div className="wt-me-item">
            <Link to={to} className="wt-me-row">
                <span className="wt-me-icon" aria-hidden="true">{icon}</span>
                <span className="wt-me-text">
                    <span className="wt-me-title">{title}</span>
                    {subtitle && <span className="wt-me-subtitle">{subtitle}</span>}
                </span>
                <span className="wt-me-chevron" aria-hidden="true">›</span>
            </Link>
        </div>
    );
}

// A row with its own control on the right (switch, theme button, text).
function MenuSetting({ icon, title, subtitle, children }) {
    return (
        <div className="wt-me-item">
            <div className="wt-me-row static">
                <span className="wt-me-icon" aria-hidden="true">{icon}</span>
                <span className="wt-me-text">
                    <span className="wt-me-title">{title}</span>
                    {subtitle && <span className="wt-me-subtitle">{subtitle}</span>}
                </span>
                {children}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------
// Panels
// ---------------------------------------------------------------

// Workouts saved on this phone that are not on the server yet
function UploadQueue() {
    const { pending, syncing } = usePendingWorkouts();
    const [confirmDelete, setConfirmDelete] = useState(null);

    if (pending.length === 0) {
        return <div className="wt-acc-empty">All workouts are uploaded ✓</div>;
    }

    return (
        <>
            <div className="wt-acc-section-head">
                <p className="wt-acc-card-hint" style={{ margin: 0 }}>
                    Saved on this phone. They upload automatically when the internet and
                    server are available.
                </p>

                <button
                    type="button"
                    className="wt-acc-button small"
                    onClick={() => syncPendingWorkouts({ retryFailed: true })}
                    disabled={syncing}
                >
                    {syncing ? "Uploading…" : "Upload now"}
                </button>
            </div>

            <div className="wt-acc-list">
                {pending.map((entry) => (
                    <div key={entry.clientId} className="wt-acc-item">
                        <div className="wt-acc-item-main">
                            <div className="wt-acc-item-title">{workoutTitle(entry.payload)}</div>
                            <div className="wt-acc-meta">
                                {formatDate(entry.payload?.workoutDate)} · {setCount(entry.payload)} ·{" "}
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
        </>
    );
}

// Earned badges in colour, the rest greyed out with how to get them.
function BadgesPanel() {
    const [earned, setEarned] = useState(null);

    useEffect(() => {
        let cancelled = false;

        Promise.all([api.get("/workout-sessions"), api.get("/users/me/body").catch(() => null)])
            .then(([sessions, body]) => {
                if (cancelled) return;

                const workouts = [
                    ...(Array.isArray(sessions.data) ? sessions.data : []),
                    ...pendingWorkouts().map((entry) => entry.payload)
                ];
                setEarned(new Set(earnedBadges(workouts, body?.data?.profile?.weeklyGoal || undefined)));
            })
            .catch(() => {
                if (!cancelled) setEarned(new Set());
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (!earned) {
        return <div className="wt-acc-empty">Loading…</div>;
    }

    return (
        <>
            <p className="wt-acc-card-hint">
                {earned.size} of {BADGES.length} earned. Keep training to unlock the rest!
            </p>

            <div className="wt-me-badges">
                {BADGES.map((badge) => {
                    const has = earned.has(badge.id);

                    return (
                        <div key={badge.id} className={`wt-me-badge${has ? " earned" : ""}`}>
                            <span className="wt-me-badge-icon" aria-hidden="true">{has ? badge.icon : "🔒"}</span>
                            <strong>{badge.title}</strong>
                            <span>{has ? "Earned ✓" : badge.hint}</span>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

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
        <>
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
        </>
    );
}

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
        <>
            <p className="wt-acc-card-hint">
                Found a problem or have an idea? It goes straight to the app admin.
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
        </>
    );
}

// ---------------------------------------------------------------
// Page ("Me")
// ---------------------------------------------------------------
function ProfilePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [account, setAccount] = useState(getStoredUser());
    const [forced, setForced] = useState(mustChangePassword());
    const [soundOn, setSoundOnState] = useState(isSoundOn());
    const { pending } = usePendingWorkouts();

    // Which row is open. Links like /profile#goals open that row.
    const [openRow, setOpenRow] = useState(() => location.hash.slice(1) || null);

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

    useEffect(() => {
        const target = location.hash.slice(1);
        if (!target) return undefined;

        setOpenRow(target);
        const timer = window.setTimeout(() => {
            document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);

        return () => window.clearTimeout(timer);
    }, [location.hash]);

    const toggle = (row) => setOpenRow((current) => (current === row ? null : row));

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

    const toggleSound = () => {
        const next = !soundOn;
        setSoundOn(next);
        setSoundOnState(next);
        if (next) unlockAudio();
    };

    const username = account?.username || "";

    return (
        <div className="wt-acc-page">
            <div className="wt-acc-container">

                {/* Who is logged in */}
                <section className="wt-acc-card" aria-label="Account">
                    <div className="wt-acc-identity">
                        <div className="wt-acc-avatar" aria-hidden="true">
                            {username.slice(0, 1) || "?"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div className="wt-acc-name">
                                {username || "Your account"}
                                {account?.admin && <>{" "}<span className="wt-acc-badge">Admin</span></>}
                            </div>
                            {account?.email && <div className="wt-acc-meta">{account.email}</div>}
                            {account?.createdAt && (
                                <div className="wt-acc-meta">Member since {formatDate(account.createdAt)}</div>
                            )}
                        </div>
                    </div>
                </section>

                {forced ? (
                    <>
                        <div className="wt-acc-message warning" role="alert">
                            🔑 You logged in with a temporary password. Please choose your own
                            password to continue.
                        </div>

                        <section className="wt-acc-card" aria-label="Choose your new password">
                            <h2>🔒 Choose your new password</h2>
                            <ChangePassword forced onChanged={handlePasswordChanged} />
                        </section>
                    </>
                ) : (
                    <>
                        <MenuSection title="My body">
                            <MenuRow
                                id="goals"
                                icon="🎯"
                                title="Body & goals"
                                subtitle="Main goal, weekly goal, height, target weight"
                                open={openRow === "goals"}
                                onToggle={() => toggle("goals")}
                            >
                                <BodyGoalsForm bare />
                            </MenuRow>

                            <MenuLink icon="⚖️" title="Weight & BMI" subtitle="Log weight, see your chart" to="/body" />
                        </MenuSection>

                        <MenuSection title="Workouts">
                            <MenuSetting icon={soundOn ? "🔊" : "🔇"} title="Voice coach & sounds" subtitle="Announcements and countdown beeps">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={soundOn}
                                    aria-label="Voice coach and sounds"
                                    className={`wt-me-switch${soundOn ? " on" : ""}`}
                                    onClick={toggleSound}
                                >
                                    <span />
                                </button>
                            </MenuSetting>

                            <MenuRow
                                id="uploads"
                                icon="⏳"
                                title="Workouts waiting to upload"
                                subtitle={pending.length ? "Saved on this phone" : "Everything is uploaded"}
                                badge={pending.length || null}
                                open={openRow === "uploads"}
                                onToggle={() => toggle("uploads")}
                            >
                                <UploadQueue />
                            </MenuRow>

                            <MenuRow
                                id="badges"
                                icon="🏅"
                                title="Badges"
                                subtitle="Rewards for workouts and streaks"
                                open={openRow === "badges"}
                                onToggle={() => toggle("badges")}
                            >
                                <BadgesPanel />
                            </MenuRow>

                            <MenuLink icon="📅" title="Workout history" subtitle="Calendar and all past workouts" to="/workout-history" />
                        </MenuSection>

                        <MenuSection title="Account">
                            <MenuRow
                                id="password"
                                icon="🔒"
                                title="Change password"
                                open={openRow === "password"}
                                onToggle={() => toggle("password")}
                            >
                                <ChangePassword onChanged={handlePasswordChanged} />
                            </MenuRow>

                            {account?.admin && (
                                <MenuLink icon="🛡️" title="Admin" subtitle="Password requests, users, feedback" to="/admin" />
                            )}
                        </MenuSection>

                        <MenuSection title="App">
                            <MenuSetting icon="🎨" title="Theme" subtitle="Light or dark">
                                <ThemeToggle />
                            </MenuSetting>

                            <MenuLink icon="📲" title="Install or share the app" subtitle="Get it on another phone or computer" to="/install" />

                            <MenuRow
                                id="feedback"
                                icon="💬"
                                title="Send feedback"
                                open={openRow === "feedback"}
                                onToggle={() => toggle("feedback")}
                            >
                                <Feedback />
                            </MenuRow>

                            <MenuSetting icon="ℹ️" title="Version">
                                <span className="wt-me-value">{APP_VERSION}</span>
                            </MenuSetting>

                            <div className="wt-me-item">
                                <button type="button" className="wt-me-row danger" onClick={handleLogout}>
                                    <span className="wt-me-icon" aria-hidden="true">🚪</span>
                                    <span className="wt-me-text">
                                        <span className="wt-me-title">Log out</span>
                                    </span>
                                </button>
                            </div>
                        </MenuSection>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProfilePage;
