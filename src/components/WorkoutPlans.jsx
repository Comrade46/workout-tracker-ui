import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import "./WorkoutPlans.css";

function WorkoutPlans() {

    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    // =====================================================
    // FETCH WORKOUT PLANS
    // =====================================================

    useEffect(() => {
        fetchWorkoutPlans();
    }, []);

    const fetchWorkoutPlans = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get("/workout-plans");

            console.log("Workout Plans:", response.data);

            setWorkoutPlans(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "Error fetching workout plans:",
                error
            );

            if (error.response?.status === 401) {

                setError(
                    "Your session has expired. Please login again."
                );

            } else {

                setError(
                    "Unable to load workout plans."
                );
            }

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // START WORKOUT
    // =====================================================

    const startWorkout = (planId) => {

        navigate(`/workout-player/${planId}`);

    };

    // =====================================================
    // DIFFICULTY STYLE
    // =====================================================

    const getDifficultyStyle = (difficulty) => {

        const value =
            String(difficulty || "")
                .toLowerCase();

        if (value === "beginner") {

            return {
                backgroundColor:
                    "var(--wt-success-soft, #eaf8ee)",
                color:
                    "var(--wt-success, #218739)"
            };

        }

        if (value === "intermediate") {

            return {
                backgroundColor:
                    "var(--wt-warning-soft, #fff6dc)",
                color:
                    "var(--wt-warning, #a87500)"
            };

        }

        if (value === "advanced") {

            return {
                backgroundColor:
                    "var(--wt-danger-soft, #ffeaea)",
                color:
                    "var(--wt-danger, #c83232)"
            };

        }

        return {
            backgroundColor:
                "var(--wt-surface-secondary)",
            color:
                "var(--wt-text-primary)"
        };
    };

    const getDifficultyIcon = (difficulty) => {

        const value =
            String(difficulty || "")
                .toLowerCase();

        if (value === "beginner") {
            return "🟢";
        }

        if (value === "intermediate") {
            return "🟡";
        }

        if (value === "advanced") {
            return "🔴";
        }

        return "⚪";
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div style={styles.centerContainer}>

                <div style={styles.loadingIcon}>
                    💪
                </div>

                <h2 style={styles.loadingText}>
                    Loading workout plans...
                </h2>

                <p style={styles.centerSubtext}>
                    Preparing your training plans
                </p>

            </div>

        );

    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (

            <div style={styles.centerContainer}>

                <div style={styles.errorIcon}>
                    ⚠️
                </div>

                <h2 style={styles.errorTitle}>
                    {error}
                </h2>

                <button
                    type="button"
                    style={styles.button}
                    onClick={fetchWorkoutPlans}
                >
                    Try Again
                </button>

            </div>

        );

    }

    // =====================================================
    // MAIN PAGE
    // =====================================================

   return (
    <div
        className="wt-workout-plans-page"
        style={styles.page}
    >

            <div style={styles.container}>

                {/* =================================================
                    HEADER
                ================================================= */}

                <div style={styles.header}>

                    <div style={styles.headerContent}>

                        <p style={styles.eyebrow}>
                            TRAIN SMART
                        </p>

                        <h1 style={styles.title}>
                            Workout Plans
                        </h1>

                        <p style={styles.subtitle}>
                            Choose a workout plan and start
                            training at your own pace.
                        </p>

                    </div>

                    <div style={styles.headerBadge}>

                        <span style={styles.headerBadgeIcon}>
                            🏋️
                        </span>

                        <span>
                            {workoutPlans.length}{" "}
                            {workoutPlans.length === 1
                                ? "Plan"
                                : "Plans"}
                        </span>

                    </div>

                </div>

                {/* =================================================
                    EMPTY STATE
                ================================================= */}

                {workoutPlans.length === 0 ? (

                    <div style={styles.emptyContainer}>

                        <div style={styles.emptyIcon}>
                            🏋️
                        </div>

                        <h2 style={styles.emptyTitle}>
                            No workout plans found
                        </h2>

                        <p style={styles.emptyText}>
                            Create your first workout plan
                            to get started.
                        </p>

                    </div>

                ) : (

                    /* =================================================
                       WORKOUT PLAN GRID
                    ================================================= */

                    <div style={styles.grid}>

                        {workoutPlans.map(
                            (plan, index) => (

                                <div
                                    key={plan.id}
                                    style={styles.card}
                                >

                                    {/* ==========================
                                        CARD TOP
                                    ========================== */}

                                    <div style={styles.cardTop}>

                                        <div style={styles.planIcon}>

                                            {index % 4 === 0
                                                ? "🔥"
                                                : index % 4 === 1
                                                    ? "💪"
                                                    : index % 4 === 2
                                                        ? "⚡"
                                                        : "🏆"}

                                        </div>

                                        <span
                                            style={
                                                styles.planNumber
                                            }
                                        >
                                            PLAN {index + 1}
                                        </span>

                                    </div>

                                    {/* ==========================
                                        PLAN NAME
                                    ========================== */}

                                    <h2 style={styles.cardTitle}>
                                        {plan.name ||
                                            "Workout Plan"}
                                    </h2>

                                    {/* ==========================
                                        DESCRIPTION
                                    ========================== */}

                                    <p
                                        style={
                                            styles.description
                                        }
                                    >
                                        {plan.description ||
                                            "A great workout plan designed to help you improve your fitness."}
                                    </p>

                                    {/* ==========================
                                        INFORMATION
                                    ========================== */}

                                    <div
                                        style={
                                            styles.infoContainer
                                        }
                                    >

                                        {plan.category && (

                                            <span
                                                style={
                                                    styles.categoryBadge
                                                }
                                            >
                                                🏷️{" "}
                                                {plan.category}
                                            </span>

                                        )}

                                        {plan.difficulty && (

                                            <span
                                                style={{
                                                    ...styles.difficultyBadge,
                                                    ...getDifficultyStyle(
                                                        plan.difficulty
                                                    )
                                                }}
                                            >

                                                {getDifficultyIcon(
                                                    plan.difficulty
                                                )}{" "}

                                                {plan.difficulty}

                                            </span>

                                        )}

                                    </div>

                                    {/* ==========================
                                        PLAN ID / CREATED INFO
                                    ========================== */}

                                    <div style={styles.metaRow}>

                                        <span style={styles.metaText}>
                                            Plan ID: {plan.id}
                                        </span>

                                        {plan.createdAt && (

                                            <span
                                                style={
                                                    styles.metaText
                                                }
                                            >
                                                Created{" "}
                                                {new Date(
                                                    plan.createdAt
                                                ).toLocaleDateString()}
                                            </span>

                                        )}

                                    </div>

                                    {/* ==========================
                                        START BUTTON
                                    ========================== */}

                                    <button
                                        type="button"
                                        style={styles.startButton}
                                        onClick={() =>
                                            startWorkout(plan.id)
                                        }
                                    >

                                        <span>
                                            Start Workout
                                        </span>

                                        <span
                                            style={styles.arrow}
                                        >
                                            →
                                        </span>

                                    </button>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>

        </div>

    );
}

// =====================================================
// STYLES
// =====================================================

const styles = {

    page: {
        minHeight: "100vh",
        background:
            "var(--wt-page-background)",
        color:
            "var(--wt-text-primary)",
        padding: "45px 20px",
        transition:
            "background-color 0.25s ease, color 0.25s ease"
    },

    container: {
        maxWidth: "1200px",
        margin: "0 auto"
    },

    // =================================================
    // HEADER
    // =================================================

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "24px",
        marginBottom: "35px",
        flexWrap: "wrap"
    },

    headerContent: {
        minWidth: 0
    },

    eyebrow: {
        margin: "0 0 8px 0",
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "2px",
        color:
            "var(--wt-text-muted)"
    },

    title: {
        margin: "0",
        fontSize: "38px",
        fontWeight: "800",
        letterSpacing: "-1px",
        color:
            "var(--wt-text-primary)"
    },

    subtitle: {
        margin: "10px 0 0 0",
        color:
            "var(--wt-text-secondary)",
        fontSize: "16px",
        lineHeight: "1.6",
        maxWidth: "650px"
    },

    headerBadge: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor:
            "var(--wt-button-background)",
        color:
            "var(--wt-button-text)",
        padding: "11px 17px",
        borderRadius: "30px",
        fontSize: "14px",
        fontWeight: "700",
        border:
            "1px solid var(--wt-border)",
        whiteSpace: "nowrap"
    },

    headerBadgeIcon: {
        fontSize: "17px"
    },

    // =================================================
    // GRID
    // =================================================

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(290px, 1fr))",
        gap: "25px"
    },

    // =================================================
    // CARD
    // =================================================

    card: {
        position: "relative",
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)",
        borderRadius: "22px",
        padding: "26px",
        boxShadow:
            "var(--wt-shadow)",
        border:
            "1px solid var(--wt-border)",
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.25s ease",
        minWidth: 0
    },

    cardTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
    },

    planIcon: {
        width: "52px",
        height: "52px",
        borderRadius: "15px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "25px",
        border:
            "1px solid var(--wt-border)"
    },

    planNumber: {
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "1px",
        color:
            "var(--wt-text-muted)"
    },

    cardTitle: {
        margin: "0 0 12px 0",
        fontSize: "23px",
        fontWeight: "800",
        color:
            "var(--wt-text-primary)",
        lineHeight: "1.3"
    },

    description: {
        margin: "0 0 20px 0",
        color:
            "var(--wt-text-secondary)",
        lineHeight: "1.6",
        minHeight: "50px"
    },

    // =================================================
    // BADGES
    // =================================================

    infoContainer: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "15px"
    },

    categoryBadge: {
        backgroundColor:
            "var(--wt-accent-soft)",
        color:
            "var(--wt-accent)",
        padding: "7px 11px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700",
        border:
            "1px solid var(--wt-border)"
    },

    difficultyBadge: {
        padding: "7px 11px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700",
        border:
            "1px solid var(--wt-border)"
    },

    // =================================================
    // META
    // =================================================

    metaRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        marginBottom: "20px",
        paddingTop: "12px",
        borderTop:
            "1px solid var(--wt-border)"
    },

    metaText: {
        color:
            "var(--wt-text-muted)",
        fontSize: "12px"
    },

    // =================================================
    // START BUTTON
    // =================================================

    startButton: {
        width: "100%",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "13px",
        padding: "14px 18px",
        backgroundColor:
            "var(--wt-button-background)",
        color:
            "var(--wt-button-text)",
        fontSize: "15px",
        fontWeight: "700",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition:
            "opacity 0.2s ease, transform 0.2s ease"
    },

    arrow: {
        fontSize: "20px"
    },

    // =================================================
    // EMPTY
    // =================================================

    emptyContainer: {
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)",
        borderRadius: "22px",
        padding: "70px 30px",
        textAlign: "center",
        boxShadow:
            "var(--wt-shadow)",
        border:
            "1px solid var(--wt-border)"
    },

    emptyIcon: {
        fontSize: "55px",
        marginBottom: "15px"
    },

    emptyTitle: {
        margin: "0 0 10px 0",
        fontSize: "24px",
        color:
            "var(--wt-text-primary)"
    },

    emptyText: {
        margin: "0",
        color:
            "var(--wt-text-secondary)"
    },

    // =================================================
    // LOADING / ERROR
    // =================================================

    centerContainer: {
        minHeight: "70vh",
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "15px",
        color:
            "var(--wt-text-primary)",
        textAlign: "center"
    },

    loadingIcon: {
        fontSize: "45px"
    },

    loadingText: {
        color:
            "var(--wt-text-primary)",
        margin: 0
    },

    centerSubtext: {
        color:
            "var(--wt-text-secondary)",
        margin: 0
    },

    errorIcon: {
        fontSize: "45px"
    },

    errorTitle: {
        color:
            "var(--wt-text-primary)",
        textAlign: "center",
        maxWidth: "600px"
    },

    button: {
        border:
            "1px solid var(--wt-border)",
        borderRadius: "10px",
        padding: "12px 22px",
        backgroundColor:
            "var(--wt-button-background)",
        color:
            "var(--wt-button-text)",
        cursor: "pointer",
        fontWeight: "600"
    }
};

export default WorkoutPlans;