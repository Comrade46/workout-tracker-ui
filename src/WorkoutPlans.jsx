import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

function WorkoutPlans() {
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        fetchWorkoutPlans();
    }, []);

    const fetchWorkoutPlans = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/workout-plans");

            console.log("Workout Plans:", response.data);

            setWorkoutPlans(response.data);
        } catch (error) {
            console.error("Error fetching workout plans:", error);

            if (error.response?.status === 401) {
                setError("Your session has expired. Please login again.");
            } else {
                setError("Unable to load workout plans.");
            }
        } finally {
            setLoading(false);
        }
    };

    const startWorkout = (planId) => {
        navigate(`/workout-player/${planId}`);
    };

    if (loading) {
        return (
            <div style={styles.centerContainer}>
                <div style={styles.loadingIcon}>💪</div>
                <h2 style={styles.loadingText}>Loading workout plans...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.centerContainer}>
                <div style={styles.errorIcon}>⚠️</div>

                <h2 style={styles.errorTitle}>
                    {error}
                </h2>

                <button
                    style={styles.button}
                    onClick={fetchWorkoutPlans}
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>

                {/* HEADER */}
                <div style={styles.header}>
                    <div>
                        <p style={styles.eyebrow}>
                            TRAIN SMART
                        </p>

                        <h1 style={styles.title}>
                            Workout Plans
                        </h1>

                        <p style={styles.subtitle}>
                            Choose a workout and start training.
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

                {/* EMPTY STATE */}
                {workoutPlans.length === 0 ? (
                    <div style={styles.emptyContainer}>

                        <div style={styles.emptyIcon}>
                            🏋️
                        </div>

                        <h2 style={styles.emptyTitle}>
                            No workout plans found
                        </h2>

                        <p style={styles.emptyText}>
                            Create your first workout plan to get started.
                        </p>

                    </div>
                ) : (

                    /* WORKOUT PLAN GRID */
                    <div style={styles.grid}>

                        {workoutPlans.map((plan, index) => (

                            <div
                                key={plan.id}
                                style={styles.card}
                            >

                                {/* CARD TOP */}
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

                                    <span style={styles.planNumber}>
                                        PLAN {index + 1}
                                    </span>

                                </div>

                                {/* PLAN NAME */}
                                <h2 style={styles.cardTitle}>
                                    {plan.name}
                                </h2>

                                {/* DESCRIPTION */}
                                <p style={styles.description}>
                                    {plan.description ||
                                        "A great workout plan designed to help you improve your fitness."}
                                </p>

                                {/* INFORMATION */}
                                <div style={styles.infoContainer}>

                                    {plan.category && (
                                        <span style={styles.categoryBadge}>
                                            🏷️ {plan.category}
                                        </span>
                                    )}

                                    {plan.difficulty && (
                                        <span
                                            style={{
                                                ...styles.difficultyBadge,
                                                ...(String(plan.difficulty).toLowerCase() === "beginner"
                                                    ? styles.beginner
                                                    : String(plan.difficulty).toLowerCase() === "intermediate"
                                                        ? styles.intermediate
                                                        : styles.advanced)
                                            }}
                                        >
                                            {String(plan.difficulty).toLowerCase() === "beginner"
                                                ? "🟢"
                                                : String(plan.difficulty).toLowerCase() === "intermediate"
                                                    ? "🟡"
                                                    : "🔴"}{" "}
                                            {plan.difficulty}
                                        </span>
                                    )}

                                </div>

                                {/* START BUTTON */}
                                <button
                                    style={styles.startButton}
                                    onClick={() => startWorkout(plan.id)}
                                >
                                    <span>
                                        Start Workout
                                    </span>

                                    <span style={styles.arrow}>
                                        →
                                    </span>
                                </button>

                            </div>

                        ))}

                    </div>
                )}

            </div>
        </div>
    );
}

const styles = {

    page: {
        minHeight: "100vh",
        background:
            "linear-gradient(135deg, #f8f9fb 0%, #eef1f5 100%)",
        padding: "45px 20px"
    },

    container: {
        maxWidth: "1200px",
        margin: "0 auto"
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "20px",
        marginBottom: "35px",
        flexWrap: "wrap"
    },

    eyebrow: {
        margin: "0 0 8px 0",
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "2px",
        color: "#777"
    },

    title: {
        margin: "0",
        fontSize: "38px",
        fontWeight: "800",
        letterSpacing: "-1px",
        color: "#111"
    },

    subtitle: {
        margin: "10px 0 0 0",
        color: "#666",
        fontSize: "16px"
    },

    headerBadge: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "#111",
        color: "#fff",
        padding: "10px 16px",
        borderRadius: "30px",
        fontSize: "14px",
        fontWeight: "700"
    },

    headerBadgeIcon: {
        fontSize: "17px"
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(290px, 1fr))",
        gap: "25px"
    },

    card: {
        position: "relative",
        backgroundColor: "#fff",
        borderRadius: "22px",
        padding: "26px",
        boxShadow:
            "0 8px 30px rgba(0, 0, 0, 0.08)",
        border: "1px solid rgba(0,0,0,0.05)",
        transition: "transform 0.2s ease"
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
        backgroundColor: "#f2f2f2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "25px"
    },

    planNumber: {
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "1px",
        color: "#999"
    },

    cardTitle: {
        margin: "0 0 12px 0",
        fontSize: "23px",
        fontWeight: "750",
        color: "#111"
    },

    description: {
        margin: "0 0 20px 0",
        color: "#666",
        lineHeight: "1.6",
        minHeight: "50px"
    },

    infoContainer: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "22px"
    },

    categoryBadge: {
        backgroundColor: "#f1f1f1",
        color: "#333",
        padding: "7px 11px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700"
    },

    difficultyBadge: {
        padding: "7px 11px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700"
    },

    beginner: {
        backgroundColor: "#eaf8ee",
        color: "#218739"
    },

    intermediate: {
        backgroundColor: "#fff6dc",
        color: "#a87500"
    },

    advanced: {
        backgroundColor: "#ffeaea",
        color: "#c83232"
    },

    startButton: {
        width: "100%",
        border: "none",
        borderRadius: "13px",
        padding: "14px 18px",
        backgroundColor: "#111",
        color: "#fff",
        fontSize: "15px",
        fontWeight: "700",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
    },

    arrow: {
        fontSize: "20px"
    },

    emptyContainer: {
        backgroundColor: "#fff",
        borderRadius: "22px",
        padding: "70px 30px",
        textAlign: "center",
        boxShadow:
            "0 8px 30px rgba(0, 0, 0, 0.06)"
    },

    emptyIcon: {
        fontSize: "55px",
        marginBottom: "15px"
    },

    emptyTitle: {
        margin: "0 0 10px 0",
        fontSize: "24px"
    },

    emptyText: {
        margin: "0",
        color: "#777"
    },

    centerContainer: {
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "15px"
    },

    loadingIcon: {
        fontSize: "45px"
    },

    loadingText: {
        color: "#333"
    },

    errorIcon: {
        fontSize: "45px"
    },

    errorTitle: {
        color: "#444",
        textAlign: "center"
    },

    button: {
        border: "none",
        borderRadius: "10px",
        padding: "12px 22px",
        backgroundColor: "#111",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "600"
    }
};

export default WorkoutPlans;