
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import PendingSyncBanner from "./PendingSyncBanner";
import WeeklyGoalCard from "../progress/WeeklyGoalCard";
import BodyCard from "../progress/BodyCard";
import ContinueCard from "../progress/ContinueCard";
import useBody from "../progress/useBody";
import { allWorkouts } from "../progress/motivation";
import { usePendingWorkouts } from "../offline/workoutOutbox";
import "./Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("User");
    const [analytics, setAnalytics] = useState(null);
    const [exerciseCount, setExerciseCount] = useState(0);
    const [recentWorkouts, setRecentWorkouts] = useState([]);
    const [allSessions, setAllSessions] = useState([]);

    // Weight log + goals, and workouts still waiting on this phone
    const body = useBody();
    const { pending } = usePendingWorkouts();
    const workouts = allWorkouts(allSessions, pending);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            // ==============================
            // GET USERNAME FROM JWT
            // ==============================
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const decoded = jwtDecode(token);

                setUsername(
                    decoded.sub ||
                    decoded.username ||
                    decoded.name ||
                    "User"
                );
            } catch (tokenError) {
                console.error("JWT decode error:", tokenError);
                setUsername("User");
            }

            // ==============================
            // ANALYTICS, EXERCISES, WORKOUTS
            // ==============================
            // Requested together: one wait instead of three.
            const [analyticsResult, exercisesResult, historyResult] =
                await Promise.allSettled([
                    api.get("/analytics/summary"),
                    api.get("/exercises"),
                    api.get("/workout-sessions")
                ]);

            setAnalytics(
                analyticsResult.status === "fulfilled"
                    ? analyticsResult.value.data
                    : null
            );

            setExerciseCount(
                exercisesResult.status === "fulfilled" &&
                    Array.isArray(exercisesResult.value.data)
                    ? exercisesResult.value.data.length
                    : 0
            );

            const history =
                historyResult.status === "fulfilled" &&
                Array.isArray(historyResult.value.data)
                    ? historyResult.value.data
                    : [];

            setAllSessions(history);

            const sorted = [...history]
                .sort((a, b) => {
                    const dateA = new Date(
                        a.workoutDate ||
                        a.createdAt ||
                        0
                    );

                    const dateB = new Date(
                        b.workoutDate ||
                        b.createdAt ||
                        0
                    );

                    return dateB - dateA;
                })
                .slice(0, 5);

            setRecentWorkouts(sorted);

            [analyticsResult, exercisesResult, historyResult]
                .filter((result) => result.status === "rejected")
                .forEach((result) =>
                    console.error("Dashboard loading error:", result.reason)
                );
        } catch (dashboardError) {
            console.error(
                "Dashboard error:",
                dashboardError
            );

            if (
                dashboardError.response?.status === 401
            ) {
                setError(
                    "Your session has expired. Please login again."
                );
            } else {
                setError(
                    "Unable to load dashboard."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // ==============================
    // HELPERS
    // ==============================

    const getValue = (value) => {
        if (
            value === null ||
            value === undefined
        ) {
            return 0;
        }

        return value;
    };

    const formatDate = (workout) => {
        if (workout.workoutDate) {
            return workout.workoutDate;
        }

        if (workout.createdAt) {
            return new Date(
                workout.createdAt
            ).toLocaleDateString();
        }

        return "Unknown date";
    };

    const formatVolume = (value) => {
        const number = Number(value || 0);

        if (Number.isInteger(number)) {
            return number;
        }

        return number.toFixed(2);
    };

    // ==============================
    // LOADING
    // ==============================

    if (loading) {
        return (
            <div className="dashboard-page" style={styles.page}>
                <div style={styles.loading}>
                    <div style={styles.spinner}>
                        ⏳
                    </div>

                    <h2 style={styles.loadingTitle}>
                        Loading Dashboard...
                    </h2>

                    <p style={styles.secondaryText}>
                        Please wait
                    </p>
                </div>
            </div>
        );
    }

    // ==============================
    // ERROR
    // ==============================

    if (error) {
        return (
            <div className="dashboard-page" style={styles.page}>
                <PendingSyncBanner />

                <div className="dashboard-error-box" style={styles.errorBox}>
                    <h2 style={styles.errorTitle}>
                        Dashboard Error
                    </h2>

                    <p style={styles.secondaryText}>
                        {error}
                    </p>

                    <button
                        onClick={() => navigate("/login")}
                        className="dashboard-primary-button" style={styles.primaryButton}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // ==============================
    // DASHBOARD
    // ==============================

    return (
        <div className="dashboard-page" style={styles.page}>
            <div className="dashboard-container" style={styles.container}>

                {/* Workouts saved on this phone, not uploaded yet */}
                <PendingSyncBanner />

                {/* =========================
                    HEADER
                ========================= */}

                <div className="dashboard-header" style={styles.header}>
                    <div>
                        <p style={styles.welcome}>
                            Welcome back 👋
                        </p>

                        <h1 className="dashboard-title" style={styles.title}>
                            {username}
                        </h1>

                        <p style={styles.secondaryText}>
                            Track your workouts and monitor
                            your fitness progress.
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            navigate("/programs")
                        }
                        className="dashboard-primary-button" style={styles.primaryButton}
                    >
                        Start Workout
                    </button>
                </div>

                {/* =========================
                    CONTINUE YOUR PLAN
                ========================= */}

                <ContinueCard
                    workouts={workouts}
                    fitnessGoal={body.profile.fitnessGoal}
                />

                {/* =========================
                    THIS WEEK + BODY
                ========================= */}

                <div className="wt-pr-grid">
                    <WeeklyGoalCard
                        workouts={workouts}
                        weeklyGoal={body.profile.weeklyGoal}
                        weights={body.weights}
                    />

                    <BodyCard body={body} />
                </div>

                {/* =========================
                    STAT CARDS
                ========================= */}

                <div className="dashboard-stats-grid" style={styles.statsGrid}>

                    <div className="dashboard-stat-card" style={styles.card}>
                        <div style={styles.cardIcon}>
                            🏋️
                        </div>

                        <p style={styles.cardLabel}>
                            Total Workouts
                        </p>

                        <h2 style={styles.cardValue}>
                            {getValue(
                                analytics?.totalWorkouts
                            )}
                        </h2>
                    </div>

                    <div className="dashboard-stat-card" style={styles.card}>
                        <div style={styles.cardIcon}>
                            ⏱️
                        </div>

                        <p style={styles.cardLabel}>
                            Total Minutes
                        </p>

                        <h2 style={styles.cardValue}>
                            {getValue(
                                analytics?.totalDurationMinutes
                            )}
                        </h2>
                    </div>

                    <div className="dashboard-stat-card" style={styles.card}>
                        <div style={styles.cardIcon}>
                            📊
                        </div>

                        <p style={styles.cardLabel}>
                            Total Sets
                        </p>

                        <h2 style={styles.cardValue}>
                            {getValue(
                                analytics?.totalSetsCompleted
                            )}
                        </h2>
                    </div>

                    <div className="dashboard-stat-card" style={styles.card}>
                        <div style={styles.cardIcon}>
                            💪
                        </div>

                        <p style={styles.cardLabel}>
                            Total Volume
                        </p>

                        <h2 style={styles.cardValue}>
                            {formatVolume(
                                analytics?.totalVolumeLifted
                            )}
                        </h2>
                    </div>

                    <div className="dashboard-stat-card" style={styles.card}>
                        <div style={styles.cardIcon}>
                            🏃
                        </div>

                        <p style={styles.cardLabel}>
                            Exercises
                        </p>

                        <h2 style={styles.cardValue}>
                            {exerciseCount}
                        </h2>
                    </div>

                </div>

                {/* =========================
                    QUICK ACTIONS
                ========================= */}

                <div className="dashboard-section" style={styles.section}>
                    <h2 style={styles.sectionTitle}>
                        Quick Access
                    </h2>

                    <div className="dashboard-quick-grid" style={styles.quickGrid}>

                        <button
                            onClick={() =>
                                navigate("/programs")
                            }
                            className="dashboard-quick-card" style={styles.quickCard}
                        >
                            <span style={styles.quickIcon}>
                                🏆
                            </span>

                            <strong>
                                Programs
                            </strong>

                            <span style={styles.quickText}>
                                30-day challenge, splits and focus workouts
                            </span>
                        </button>

                        <button
                            onClick={() =>
                                navigate("/workout-plans")
                            }
                            className="dashboard-quick-card" style={styles.quickCard}
                        >
                            <span style={styles.quickIcon}>
                                🏋️
                            </span>

                            <strong>
                                Workout Plans
                            </strong>

                            <span style={styles.quickText}>
                                Choose a workout plan
                            </span>
                        </button>

                        <button
                            onClick={() =>
                                navigate("/exercises")
                            }
                            className="dashboard-quick-card" style={styles.quickCard}
                        >
                            <span style={styles.quickIcon}>
                                📚
                            </span>

                            <strong>
                                Exercise Library
                            </strong>

                            <span style={styles.quickText}>
                                Browse all exercises
                            </span>
                        </button>

                        <button
                            onClick={() =>
                                navigate("/workout-history")
                            }
                            className="dashboard-quick-card" style={styles.quickCard}
                        >
                            <span style={styles.quickIcon}>
                                📅
                            </span>

                            <strong>
                                Workout History
                            </strong>

                            <span style={styles.quickText}>
                                View completed workouts
                            </span>
                        </button>

                        <button
                            onClick={() =>
                                navigate("/analytics")
                            }
                            className="dashboard-quick-card" style={styles.quickCard}
                        >
                            <span style={styles.quickIcon}>
                                📈
                            </span>

                            <strong>
                                Analytics
                            </strong>

                            <span style={styles.quickText}>
                                Track your performance
                            </span>
                        </button>

                    </div>
                </div>

                {/* =========================
                    RECENT WORKOUTS
                ========================= */}

                <div className="dashboard-section" style={styles.section}>

                    <div className="dashboard-section-header" style={styles.sectionHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>
                                Recent Workouts
                            </h2>

                            <p style={styles.secondaryText}>
                                Your latest completed workouts
                            </p>
                        </div>

                        <button
                            onClick={() =>
                                navigate("/workout-history")
                            }
                            className="dashboard-secondary-button" style={styles.secondaryButton}
                        >
                            View All
                        </button>
                    </div>

                    {recentWorkouts.length === 0 ? (

                        <div className="dashboard-empty-box" style={styles.emptyBox}>
                            <div style={styles.emptyIcon}>
                                🏃
                            </div>

                            <h3 style={styles.emptyTitle}>
                                No workouts yet
                            </h3>

                            <p style={styles.secondaryText}>
                                Start your first workout
                                to see your history here.
                            </p>

                            <button
                                onClick={() =>
                                    navigate("/workout-plans")
                                }
                                className="dashboard-primary-button" style={styles.primaryButton}
                            >
                                Start Your First Workout
                            </button>
                        </div>

                    ) : (

                        <div className="dashboard-workout-list" style={styles.workoutList}>

                            {recentWorkouts.map(
                                (workout) => (
                                    <div
                                        key={workout.id}
                                        className="dashboard-workout-card"
                                        style={styles.workoutCard}
                                    >
                                        <div>
                                            <h3
                                                style={
                                                    styles.workoutTitle
                                                }
                                            >
                                                Workout #
                                                {workout.id}
                                            </h3>

                                            <p
                                                style={
                                                    styles.secondaryText
                                                }
                                            >
                                                {formatDate(
                                                    workout
                                                )}
                                            </p>
                                        </div>

                                        <div
                                            style={
                                                styles.workoutStats
                                            }
                                        >
                                            <span>
                                                ⏱{" "}
                                                {getValue(
                                                    workout.durationMinutes
                                                )}{" "}
                                                min
                                            </span>

                                            <span>
                                                📊{" "}
                                                {getValue(
                                                    workout.totalSets
                                                )}{" "}
                                                sets
                                            </span>

                                            <span>
                                                💪{" "}
                                                {formatVolume(
                                                    workout.totalVolume
                                                )}{" "}
                                                volume
                                            </span>
                                        </div>
                                    </div>
                                )
                            )}

                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}

// =====================================================
// THEME-AWARE STYLES
// =====================================================

const styles = {

    page: {
        minHeight: "calc(100vh - 70px)",
        backgroundColor:
            "var(--wt-page-background)",
        color:
            "var(--wt-text-primary)",
        padding: "30px 20px",
        boxSizing: "border-box"
    },

    container: {
        maxWidth: "1200px",
        margin: "0 auto"
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
        marginBottom: "30px"
    },

    welcome: {
        margin: "0 0 5px",
        color: "var(--wt-accent, #2563eb)",
        fontWeight: "700"
    },

    title: {
        margin: "0 0 8px",
        fontSize: "36px",
        color: "var(--wt-text-primary)"
    },

    secondaryText: {
        margin: "5px 0",
        color: "var(--wt-text-secondary)",
        lineHeight: "1.5"
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
        gap: "18px",
        marginBottom: "35px"
    },

    card: {
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "14px",
        padding: "22px",
        boxShadow:
            "var(--wt-shadow, 0 4px 14px rgba(0,0,0,0.08))",
        textAlign: "center"
    },

    cardIcon: {
        fontSize: "28px",
        marginBottom: "8px"
    },

    cardLabel: {
        margin: "0 0 8px",
        color: "var(--wt-text-secondary)",
        fontSize: "14px",
        fontWeight: "600"
    },

    cardValue: {
        margin: 0,
        color: "var(--wt-text-primary)",
        fontSize: "30px"
    },

    section: {
        marginBottom: "35px"
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap",
        marginBottom: "18px"
    },

    sectionTitle: {
        margin: 0,
        color: "var(--wt-text-primary)",
        fontSize: "24px"
    },

    quickGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px"
    },

    quickCard: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "8px",
        padding: "22px",
        borderRadius: "14px",
        border:
            "1px solid var(--wt-border)",
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)",
        cursor: "pointer",
        textAlign: "left",
        boxShadow:
            "var(--wt-shadow, 0 4px 14px rgba(0,0,0,0.08))"
    },

    quickIcon: {
        fontSize: "28px"
    },

    quickText: {
        color: "var(--wt-text-secondary)",
        fontSize: "13px"
    },

    primaryButton: {
        border: "none",
        borderRadius: "10px",
        padding: "12px 18px",
        backgroundColor:
            "var(--wt-accent, #2563eb)",
        color: "var(--wt-on-accent)",
        fontWeight: "700",
        cursor: "pointer"
    },

    secondaryButton: {
        border:
            "1px solid var(--wt-border)",
        borderRadius: "10px",
        padding: "10px 16px",
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)",
        fontWeight: "600",
        cursor: "pointer"
    },

    workoutList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },

    workoutCard: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
        padding: "18px 20px",
        borderRadius: "12px",
        border:
            "1px solid var(--wt-border)",
        backgroundColor:
            "var(--wt-surface)"
    },

    workoutTitle: {
        margin: "0 0 5px",
        color:
            "var(--wt-text-primary)"
    },

    workoutStats: {
        display: "flex",
        gap: "15px",
        flexWrap: "wrap",
        color:
            "var(--wt-text-secondary)",
        fontSize: "14px"
    },

    emptyBox: {
        textAlign: "center",
        padding: "50px 20px",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "14px",
        backgroundColor:
            "var(--wt-surface)"
    },

    emptyIcon: {
        fontSize: "45px",
        marginBottom: "10px"
    },

    emptyTitle: {
        margin: "0 0 8px",
        color:
            "var(--wt-text-primary)"
    },

    loading: {
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
    },

    spinner: {
        fontSize: "35px"
    },

    loadingTitle: {
        color:
            "var(--wt-text-primary)"
    },

    errorBox: {
        maxWidth: "500px",
        margin: "80px auto",
        padding: "30px",
        textAlign: "center",
        borderRadius: "14px",
        border:
            "1px solid var(--wt-border)",
        backgroundColor:
            "var(--wt-surface)"
    },

    errorTitle: {
        color: "var(--wt-danger)"
    }
};

export default Dashboard;

