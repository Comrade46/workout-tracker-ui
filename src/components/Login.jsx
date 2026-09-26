import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosConfig";
import { saveSession } from "../auth/session";
import { pendingWorkouts } from "../offline/workoutOutbox";


const Login = ({
    sessionMessage = "",
    clearSessionMessage = () => {}
}) => {

    const [usernameOrEmail, setUsernameOrEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    // Workouts saved on this phone that upload after login
    const [waitingWorkouts] =
        useState(() => pendingWorkouts().length);


    useEffect(() => {

        if (sessionMessage) {

            setError(sessionMessage);

            clearSessionMessage();

        }

    }, [sessionMessage, clearSessionMessage]);


    const handleLogin = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response = await api.post(
                "/auth/login",
                {
                    usernameOrEmail,
                    password
                }
            );


            saveSession(response.data);


            // Temporary password from the admin: choose a new one first.
            window.location.href =
                response.data.mustChangePassword
                    ? "/profile"
                    : "/dashboard";


        } catch (err) {

            setError(
                err.userMessage ||
                err.response?.data?.message ||
                "Invalid username or password."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div style={styles.page}>

            <div style={styles.card}>

                <h1 style={styles.title}>
                    Workout Tracker
                </h1>

                <p style={styles.subtitle}>
                    Login to continue
                </p>


                {error && (

                    <div style={styles.error}>
                        {error}
                    </div>

                )}


                {waitingWorkouts > 0 && (

                    <div style={styles.notice} role="status">
                        ⏳ {waitingWorkouts} workout
                        {waitingWorkouts === 1 ? " is" : "s are"} saved
                        on this phone and will upload after you log in.
                    </div>

                )}


                <form
                    onSubmit={handleLogin}
                    style={styles.form}
                >

                    <div style={styles.field}>

                        <label style={styles.label}>
                            Username or Email
                        </label>

                        <input
                            type="text"
                            placeholder="Enter username or email"
                            value={usernameOrEmail}
                            onChange={(e) =>
                                setUsernameOrEmail(
                                    e.target.value
                                )
                            }
                            required
                            disabled={loading}
                            style={styles.input}
                        />

                    </div>


                    <div style={styles.field}>

                        <label style={styles.label}>
                            Password
                        </label>

                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                            required
                            disabled={loading}
                            style={styles.input}
                        />

                        <Link
                            to="/forgot-password"
                            style={styles.forgotLink}
                        >
                            Forgot password?
                        </Link>

                    </div>


                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.loginButton,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading
                                ? "not-allowed"
                                : "pointer"
                        }}
                    >

                        {loading
                            ? "Logging in..."
                            : "Login"}

                    </button>

                </form>


                <p style={styles.registerText}>

                    Don't have an account?{" "}

                    <Link
                        to="/register"
                        style={styles.link}
                    >
                        Create an account
                    </Link>

                </p>


                <p style={styles.registerText}>

                    <Link
                        to="/install"
                        style={styles.link}
                    >
                        📲 Get the app on your phone or computer
                    </Link>

                </p>

            </div>

        </div>

    );

};


const styles = {

    page: {
        minHeight: "calc(100vh - 70px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px 20px",
        backgroundColor:
            "var(--wt-page-background)"
    },


    card: {
        width: "100%",
        maxWidth: "420px",
        padding: "32px",
        borderRadius: "16px",
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        boxShadow:
            "var(--wt-shadow)",
        color:
            "var(--wt-text-primary)"
    },


    title: {
        margin: "0",
        textAlign: "center",
        color:
            "var(--wt-text-primary)",
        fontSize: "30px"
    },


    subtitle: {
        textAlign: "center",
        marginTop: "8px",
        marginBottom: "25px",
        color:
            "var(--wt-text-secondary)"
    },


    error: {
        padding: "12px",
        marginBottom: "18px",
        borderRadius: "8px",
        backgroundColor:
            "var(--wt-danger-soft, #fee2e2)",
        color:
            "var(--wt-danger, #dc2626)",
        border:
            "1px solid var(--wt-danger-border, #fecaca)",
        fontSize: "14px"
    },


    form: {
        display: "flex",
        flexDirection: "column",
        gap: "18px"
    },


    field: {
        display: "flex",
        flexDirection: "column",
        gap: "7px"
    },


    label: {
        fontWeight: "600",
        color:
            "var(--wt-text-primary)"
    },


    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        borderRadius: "8px",
        border:
            "1px solid var(--wt-input-border)",
        backgroundColor:
            "var(--wt-input-background)",
        color:
            "var(--wt-input-text)",
        fontSize: "15px",
        outline: "none"
    },


    loginButton: {
        marginTop: "5px",
        padding: "12px",
        border: "none",
        borderRadius: "8px",
        backgroundColor:
            "var(--wt-button-background)",
        color:
            "var(--wt-button-text)",
        fontSize: "16px",
        fontWeight: "600"
    },


    registerText: {
        marginTop: "22px",
        textAlign: "center",
        color:
            "var(--wt-text-secondary)"
    },


    link: {
        color:
            "var(--wt-accent)",
        fontWeight: "600",
        textDecoration: "none"
    },


    forgotLink: {
        alignSelf: "flex-end",
        color:
            "var(--wt-accent)",
        fontSize: "14px",
        fontWeight: "600",
        textDecoration: "none"
    },


    notice: {
        padding: "12px",
        marginBottom: "18px",
        borderRadius: "8px",
        backgroundColor:
            "var(--wt-accent-soft)",
        color:
            "var(--wt-text-primary)",
        border:
            "1px solid var(--wt-accent)",
        fontSize: "14px"
    }

};


export default Login;