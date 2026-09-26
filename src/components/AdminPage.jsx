import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axiosConfig";
import "./Account.css";

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Result box after a reset: the temporary password to pass on.
function TemporaryPassword({ result, onClose }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(result.temporaryPassword);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="wt-acc-message success" role="status">
            <div>
                Temporary password for <strong>{result.username}</strong>:
            </div>
            <div className="wt-acc-temp-password">{result.temporaryPassword}</div>
            <div style={{ margin: "4px 0 10px" }}>
                Send it to them (e.g. on WhatsApp). After logging in with it, the
                app asks them to choose their own password. It is shown only now.
            </div>
            <div className="wt-acc-actions">
                <button type="button" className="wt-acc-button small" onClick={copy}>
                    {copied ? "✓ Copied" : "Copy"}
                </button>
                <button type="button" className="wt-acc-button small secondary" onClick={onClose}>
                    Done
                </button>
            </div>
        </div>
    );
}

function AdminPage() {
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [confirmUserId, setConfirmUserId] = useState(null);
    const [busy, setBusy] = useState(false);
    const [tempResult, setTempResult] = useState(null);
    const [showDone, setShowDone] = useState(false);

    const load = useCallback(async () => {
        setError("");

        try {
            const [requestList, userList, feedbackList] = await Promise.all([
                api.get("/admin/password-requests"),
                api.get("/admin/users"),
                api.get("/admin/feedback")
            ]);

            setRequests(requestList.data || []);
            setUsers(userList.data || []);
            setFeedback(feedbackList.data || []);
        } catch (requestError) {
            setError(requestError.userMessage || "Admin data could not be loaded.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const resetPassword = async (userId) => {
        setBusy(true);
        setError("");

        try {
            const response = await api.post(`/admin/users/${userId}/temporary-password`);
            setTempResult(response.data);
            setConfirmUserId(null);
            await load();
        } catch (requestError) {
            setError(requestError.userMessage || "The password could not be reset.");
        } finally {
            setBusy(false);
        }
    };

    const dismissRequest = async (requestId) => {
        setBusy(true);

        try {
            await api.post(`/admin/password-requests/${requestId}/dismiss`);
            await load();
        } catch (requestError) {
            setError(requestError.userMessage || "The request could not be closed.");
        } finally {
            setBusy(false);
        }
    };

    const setResolved = async (item, resolved) => {
        setFeedback((list) => list.map((f) => (f.id === item.id ? { ...f, resolved } : f)));

        try {
            await api.put(`/admin/feedback/${item.id}`, { resolved });
        } catch (requestError) {
            setError(requestError.userMessage || "Feedback could not be updated.");
            await load();
        }
    };

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase();

        return term
            ? users.filter(
                  (user) =>
                      user.username.toLowerCase().includes(term) ||
                      (user.email || "").toLowerCase().includes(term)
              )
            : users;
    }, [users, search]);

    const openFeedback = feedback.filter((item) => !item.resolved);
    const visibleFeedback = showDone ? feedback : openFeedback;

    const resetButton = (userId, label = "Reset password") =>
        confirmUserId === userId ? (
            <div className="wt-acc-actions">
                <button
                    type="button"
                    className="wt-acc-button small danger"
                    onClick={() => resetPassword(userId)}
                    disabled={busy}
                >
                    Yes, reset
                </button>
                <button
                    type="button"
                    className="wt-acc-button small secondary"
                    onClick={() => setConfirmUserId(null)}
                    disabled={busy}
                >
                    Cancel
                </button>
            </div>
        ) : (
            <button
                type="button"
                className="wt-acc-button small"
                onClick={() => setConfirmUserId(userId)}
                disabled={busy}
            >
                {label}
            </button>
        );

    return (
        <div className="wt-acc-page">
            <div className="wt-acc-container">
                <div>
                    <h1 className="wt-acc-title">🛡️ Admin</h1>
                    <p className="wt-acc-subtitle">
                        Password help, users and feedback. Only you can see this page.
                    </p>
                </div>

                {error && <div className="wt-acc-message error" role="alert">{error}</div>}
                {tempResult && <TemporaryPassword result={tempResult} onClose={() => setTempResult(null)} />}

                {loading ? (
                    <div className="wt-acc-card wt-acc-empty" role="status">Loading…</div>
                ) : (
                    <>
                        {/* Forgot-password requests */}
                        <section className="wt-acc-card" aria-labelledby="wt-admin-requests">
                            <h2 id="wt-admin-requests">
                                🔑 Password requests
                                {requests.length > 0 && <span className="wt-acc-count">{requests.length}</span>}
                            </h2>
                            <p className="wt-acc-card-hint">
                                People who tapped "Forgot password?". Make sure it is really
                                them (e.g. ask on WhatsApp) before sending a temporary password.
                            </p>

                            {requests.length === 0 ? (
                                <div className="wt-acc-empty">No open requests.</div>
                            ) : (
                                <div className="wt-acc-list">
                                    {requests.map((request) => (
                                        <div key={request.id} className="wt-acc-item">
                                            <div className="wt-acc-item-main">
                                                <div className="wt-acc-item-title">{request.username}</div>
                                                <div className="wt-acc-meta">
                                                    {request.email} · {formatDateTime(request.createdAt)}
                                                </div>
                                                {request.message && (
                                                    <div className="wt-acc-item-text">"{request.message}"</div>
                                                )}
                                            </div>

                                            <div className="wt-acc-actions">
                                                {resetButton(request.userId, "Create temporary password")}
                                                {confirmUserId !== request.userId && (
                                                    <button
                                                        type="button"
                                                        className="wt-acc-button small secondary"
                                                        onClick={() => dismissRequest(request.id)}
                                                        disabled={busy}
                                                    >
                                                        Dismiss
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Feedback */}
                        <section className="wt-acc-card" aria-labelledby="wt-admin-feedback">
                            <div className="wt-acc-section-head">
                                <h2 id="wt-admin-feedback">
                                    💬 Feedback
                                    {openFeedback.length > 0 && <span className="wt-acc-count">{openFeedback.length}</span>}
                                </h2>

                                {feedback.length > openFeedback.length && (
                                    <button
                                        type="button"
                                        className="wt-acc-button small secondary"
                                        onClick={() => setShowDone((value) => !value)}
                                    >
                                        {showDone ? "Hide done" : `Show done (${feedback.length - openFeedback.length})`}
                                    </button>
                                )}
                            </div>

                            {visibleFeedback.length === 0 ? (
                                <div className="wt-acc-empty">No new feedback.</div>
                            ) : (
                                <div className="wt-acc-list">
                                    {visibleFeedback.map((item) => (
                                        <div key={item.id} className={`wt-acc-item${item.resolved ? " done" : ""}`}>
                                            <div className="wt-acc-item-main">
                                                <div className="wt-acc-item-title">{item.username}</div>
                                                <div className="wt-acc-meta">
                                                    {formatDateTime(item.createdAt)}
                                                    {item.appVersion && ` · v${item.appVersion}`}
                                                    {item.page && ` · ${item.page}`}
                                                </div>
                                                <div className="wt-acc-item-text">{item.message}</div>
                                            </div>

                                            <button
                                                type="button"
                                                className="wt-acc-button small secondary"
                                                onClick={() => setResolved(item, !item.resolved)}
                                            >
                                                {item.resolved ? "Reopen" : "✓ Mark done"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Users */}
                        <section className="wt-acc-card" aria-labelledby="wt-admin-users">
                            <div className="wt-acc-section-head">
                                <h2 id="wt-admin-users">
                                    👥 Users <span className="wt-acc-count">{users.length}</span>
                                </h2>
                            </div>

                            <input
                                type="search"
                                className="wt-acc-input"
                                placeholder="Search by username or email"
                                aria-label="Search users"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                style={{ marginBottom: 12 }}
                            />

                            <div className="wt-acc-list">
                                {filteredUsers.map((user) => (
                                    <div key={user.id} className="wt-acc-item">
                                        <div className="wt-acc-item-main">
                                            <div className="wt-acc-item-title">
                                                {user.username}
                                                {user.admin && <span className="wt-acc-badge">Admin</span>}
                                                {user.mustChangePassword && (
                                                    <span className="wt-acc-badge">Temporary password</span>
                                                )}
                                            </div>
                                            <div className="wt-acc-meta">{user.email}</div>
                                            <div className="wt-acc-meta">
                                                Joined {formatDate(user.createdAt)} · {user.workoutCount ?? 0} workouts
                                                {user.lastWorkoutDate && ` · last ${formatDate(user.lastWorkoutDate)}`}
                                            </div>
                                        </div>

                                        {resetButton(user.id)}
                                    </div>
                                ))}

                                {filteredUsers.length === 0 && (
                                    <div className="wt-acc-empty">No users match "{search}".</div>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminPage;
