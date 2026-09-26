import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosConfig";
import "./Account.css";

/*
 * "Forgot password?" - sends a request to the app admin, who gives the
 * user a temporary password (e.g. on WhatsApp). No email needed.
 */
function ForgotPassword() {
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSending(true);
        setError("");

        try {
            const response = await api.post("/auth/password-help", {
                usernameOrEmail: usernameOrEmail.trim(),
                message: message.trim() || null
            });

            setSent(response.data?.message || "Request sent.");
        } catch (requestError) {
            setError(requestError.userMessage || "The request could not be sent. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="wt-acc-auth-page">
            <div className="wt-acc-auth-card">
                <h1>Forgot password?</h1>

                {sent ? (
                    <>
                        <div className="wt-acc-message success" role="status">
                            ✅ {sent}
                        </div>

                        <p className="wt-acc-card-hint" style={{ margin: 0 }}>
                            When you get the temporary password, log in with it.
                            The app will then ask you to choose your own new password.
                        </p>

                        <Link to="/login" className="wt-acc-button">
                            Back to login
                        </Link>
                    </>
                ) : (
                    <>
                        <p className="wt-acc-card-hint" style={{ margin: 0, textAlign: "center" }}>
                            Send a request to the app admin. They will give you a
                            temporary password so you can log in again.
                        </p>

                        {error && <div className="wt-acc-message error" role="alert">{error}</div>}

                        <form className="wt-acc-form" onSubmit={handleSubmit}>
                            <div className="wt-acc-field">
                                <label htmlFor="wt-forgot-user">Username or email</label>
                                <input
                                    id="wt-forgot-user"
                                    className="wt-acc-input"
                                    value={usernameOrEmail}
                                    onChange={(event) => setUsernameOrEmail(event.target.value)}
                                    placeholder="Your username or email"
                                    autoComplete="username"
                                    maxLength={100}
                                    required
                                    disabled={sending}
                                />
                            </div>

                            <div className="wt-acc-field">
                                <label htmlFor="wt-forgot-message">Message for the admin (optional)</label>
                                <textarea
                                    id="wt-forgot-message"
                                    className="wt-acc-textarea"
                                    style={{ minHeight: 80 }}
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    placeholder="e.g. your name, so the admin knows who you are"
                                    maxLength={300}
                                    disabled={sending}
                                />
                                <span className="wt-acc-counter">{message.length}/300</span>
                            </div>

                            <button type="submit" className="wt-acc-button" disabled={sending}>
                                {sending ? "Sending…" : "Send request"}
                            </button>
                        </form>

                        <p className="wt-acc-center" style={{ margin: 0 }}>
                            <Link to="/login" className="wt-acc-link">← Back to login</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
