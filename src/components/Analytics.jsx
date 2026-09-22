import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import "./Analytics.css";

function Analytics() {

    const navigate = useNavigate();

    const [summary, setSummary] = useState(null);
    const [prs, setPrs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // LOAD ANALYTICS
    // =====================================================

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {

        try {

            setLoading(true);
            setError("");

            const [summaryResponse, prsResponse] =
                await Promise.all([
                    api.get("/analytics/summary"),
                    api.get("/analytics/prs")
                ]);

            setSummary(
                summaryResponse.data || {}
            );

            setPrs(
                Array.isArray(prsResponse.data)
                    ? prsResponse.data
                    : []
            );

        } catch (error) {

            console.error(
                "Error loading analytics:",
                error
            );

            if (error.response?.status === 401) {

                setError(
                    "Your session has expired. Please login again."
                );

            } else {

                setError(
                    "Unable to load analytics."
                );

            }

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // VALUE HELPERS
    // =====================================================

    const getNumber = (...values) => {

        for (const value of values) {

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                const number = Number(value);

                if (!Number.isNaN(number)) {
                    return number;
                }
            }
        }

        return 0;
    };

    const getText = (...values) => {

        for (const value of values) {

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {
                return String(value);
            }
        }

        return "-";
    };

    // =====================================================
    // SUMMARY VALUES
    // =====================================================

    const totalWorkouts = getNumber(
        summary?.totalWorkouts,
        summary?.workoutCount,
        summary?.workouts
    );

    const totalMinutes = getNumber(
        summary?.totalMinutes,
        summary?.minutes,
        summary?.totalDuration
    );

    const totalSets = getNumber(
        summary?.totalSets,
        summary?.sets,
        summary?.setCount
    );

    const totalVolume = getNumber(
        summary?.totalVolume,
        summary?.volume
    );

    // =====================================================
    // FORMAT NUMBER
    // =====================================================

    const formatNumber = (value) => {

        return Number(value || 0).toLocaleString(
            undefined,
            {
                maximumFractionDigits: 2
            }
        );

    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div style={styles.center}>

                <div style={styles.loadingIcon}>
                    📊
                </div>

                <h2 style={styles.centerTitle}>
                    Loading analytics...
                </h2>

                <p style={styles.centerText}>
                    Preparing your workout statistics
                </p>

            </div>

        );

    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (

            <div style={styles.center}>

                <div style={styles.errorIcon}>
                    ⚠️
                </div>

                <h2 style={styles.centerTitle}>
                    {error}
                </h2>

                <button
                    type="button"
                    style={styles.primaryButton}
                    onClick={loadAnalytics}
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

        <div className="wt-analytics-page" style={styles.page}>

            <div style={styles.container}>

                {/* =================================================
                    HEADER
                ================================================= */}

                <div style={styles.header}>

                    <div>

                        <div style={styles.eyebrow}>
                            PERFORMANCE
                        </div>

                        <h1 style={styles.title}>
                            Analytics
                        </h1>

                        <p style={styles.subtitle}>
                            Understand your workout activity
                            and track your performance.
                        </p>

                    </div>

                    <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={() =>
                            navigate("/progress")
                        }
                    >
                        View Progress →
                    </button>

                </div>

                {/* =================================================
                    SUMMARY
                ================================================= */}

                <section>

                    <div style={styles.sectionHeader}>

                        <div>

                            <h2 style={styles.sectionTitle}>
                                Workout Overview
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Your overall training activity
                            </p>

                        </div>

                    </div>

                    <div style={styles.summaryGrid}>

                        {/* WORKOUTS */}

                        <div style={styles.statCard}>

                            <div
                                style={{
                                    ...styles.statIcon,
                                    backgroundColor:
                                        "var(--wt-accent-soft)"
                                }}
                            >
                                🏋️
                            </div>

                            <div style={styles.statContent}>

                                <span style={styles.statLabel}>
                                    Total Workouts
                                </span>

                                <strong style={styles.statValue}>
                                    {formatNumber(totalWorkouts)}
                                </strong>

                            </div>

                        </div>

                        {/* MINUTES */}

                        <div style={styles.statCard}>

                            <div
                                style={{
                                    ...styles.statIcon,
                                    backgroundColor:
                                        "var(--wt-surface-secondary)"
                                }}
                            >
                                ⏱️
                            </div>

                            <div style={styles.statContent}>

                                <span style={styles.statLabel}>
                                    Total Minutes
                                </span>

                                <strong style={styles.statValue}>
                                    {formatNumber(totalMinutes)}
                                </strong>

                            </div>

                        </div>

                        {/* SETS */}

                        <div style={styles.statCard}>

                            <div
                                style={{
                                    ...styles.statIcon,
                                    backgroundColor:
                                        "var(--wt-surface-secondary)"
                                }}
                            >
                                💪
                            </div>

                            <div style={styles.statContent}>

                                <span style={styles.statLabel}>
                                    Total Sets
                                </span>

                                <strong style={styles.statValue}>
                                    {formatNumber(totalSets)}
                                </strong>

                            </div>

                        </div>

                        {/* VOLUME */}

                        <div style={styles.statCard}>

                            <div
                                style={{
                                    ...styles.statIcon,
                                    backgroundColor:
                                        "var(--wt-accent-soft)"
                                }}
                            >
                                📈
                            </div>

                            <div style={styles.statContent}>

                                <span style={styles.statLabel}>
                                    Total Volume
                                </span>

                                <strong style={styles.statValue}>
                                    {formatNumber(totalVolume)}
                                </strong>

                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    PERSONAL RECORDS
                ================================================= */}

                <section style={styles.prSection}>

                    <div style={styles.sectionHeader}>

                        <div>

                            <h2 style={styles.sectionTitle}>
                                Personal Records
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Your recorded best performances
                            </p>

                        </div>

                    </div>

                    {prs.length === 0 ? (

                        <div style={styles.emptyCard}>

                            <div style={styles.emptyIcon}>
                                🏆
                            </div>

                            <h3 style={styles.emptyTitle}>
                                No personal records yet
                            </h3>

                            <p style={styles.emptyText}>
                                Complete workouts and record
                                sets to build your performance
                                history.
                            </p>

                            <button
                                type="button"
                                style={styles.primaryButton}
                                onClick={() =>
                                    navigate("/workout-plans")
                                }
                            >
                                Start a Workout
                            </button>

                        </div>

                    ) : (

                        <div style={styles.prGrid}>

                            {prs.map((pr, index) => {

                                const exerciseName =
                                    getText(
                                        pr.exerciseName,
                                        pr.name,
                                        pr.exercise
                                    );

                                const category =
                                    getText(
                                        pr.category
                                    );

                                const weight =
                                    getNumber(
                                        pr.weight,
                                        pr.maxWeight,
                                        pr.bestWeight
                                    );

                                const reps =
                                    getNumber(
                                        pr.reps,
                                        pr.maxReps,
                                        pr.bestReps
                                    );

                                const volume =
                                    getNumber(
                                        pr.volume,
                                        pr.maxVolume
                                    );

                                return (

                                    <div
                                        key={
                                            pr.exerciseId ||
                                            pr.id ||
                                            index
                                        }
                                        style={styles.prCard}
                                    >

                                        <div style={styles.prTop}>

                                            <div
                                                style={
                                                    styles.prIcon
                                                }
                                            >
                                                🏆
                                            </div>

                                            <span
                                                style={
                                                    styles.prNumber
                                                }
                                            >
                                                PR #{index + 1}
                                            </span>

                                        </div>

                                        <h3
                                            style={
                                                styles.prExercise
                                            }
                                        >
                                            {exerciseName}
                                        </h3>

                                        <span
                                            style={
                                                styles.categoryBadge
                                            }
                                        >
                                            {category}
                                        </span>

                                        <div
                                            style={
                                                styles.prStats
                                            }
                                        >

                                            <div
                                                style={
                                                    styles.prStat
                                                }
                                            >

                                                <strong>
                                                    {formatNumber(
                                                        weight
                                                    )}
                                                </strong>

                                                <span>
                                                    kg
                                                </span>

                                            </div>

                                            <div
                                                style={
                                                    styles.prStat
                                                }
                                            >

                                                <strong>
                                                    {formatNumber(
                                                        reps
                                                    )}
                                                </strong>

                                                <span>
                                                    reps
                                                </span>

                                            </div>

                                            <div
                                                style={
                                                    styles.prStat
                                                }
                                            >

                                                <strong>
                                                    {formatNumber(
                                                        volume
                                                    )}
                                                </strong>

                                                <span>
                                                    volume
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    )}

                </section>

                {/* =================================================
                    INFORMATION
                ================================================= */}

                <div style={styles.infoCard}>

                    <div style={styles.infoIcon}>
                        ℹ️
                    </div>

                    <div>

                        <strong style={styles.infoTitle}>
                            How volume is calculated
                        </strong>

                        <p style={styles.infoText}>
                            For recorded weight-training sets,
                            volume is calculated as weight × reps.
                            Bodyweight sets with zero external
                            weight can therefore have zero volume.
                        </p>

                    </div>

                </div>

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
        gap: "20px",
        marginBottom: "40px",
        flexWrap: "wrap"
    },

    eyebrow: {
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "2px",
        color:
            "var(--wt-text-muted)",
        marginBottom: "8px"
    },

    title: {
        margin: 0,
        fontSize: "38px",
        fontWeight: "800",
        color:
            "var(--wt-text-primary)"
    },

    subtitle: {
        margin: "10px 0 0",
        color:
            "var(--wt-text-secondary)",
        fontSize: "16px",
        lineHeight: "1.6",
        maxWidth: "650px"
    },

    // =================================================
    // BUTTONS
    // =================================================

    primaryButton: {
        border:
            "1px solid var(--wt-border)",
        borderRadius: "11px",
        padding: "12px 20px",
        backgroundColor:
            "var(--wt-button-background)",
        color:
            "var(--wt-button-text)",
        cursor: "pointer",
        fontWeight: "700"
    },

    secondaryButton: {
        border:
            "1px solid var(--wt-border)",
        borderRadius: "11px",
        padding: "12px 20px",
        backgroundColor:
            "var(--wt-secondary-button-background)",
        color:
            "var(--wt-secondary-button-text)",
        cursor: "pointer",
        fontWeight: "700"
    },

    // =================================================
    // SECTIONS
    // =================================================

    sectionHeader: {
        marginBottom: "18px"
    },

    sectionTitle: {
        margin: 0,
        color:
            "var(--wt-text-primary)",
        fontSize: "23px",
        fontWeight: "800"
    },

    sectionSubtitle: {
        margin: "5px 0 0",
        color:
            "var(--wt-text-secondary)",
        fontSize: "14px"
    },

    // =================================================
    // SUMMARY
    // =================================================

    summaryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px"
    },

    statCard: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "18px",
        padding: "22px",
        boxShadow:
            "var(--wt-shadow)"
    },

    statIcon: {
        width: "52px",
        height: "52px",
        borderRadius: "15px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        flexShrink: 0
    },

    statContent: {
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },

    statLabel: {
        color:
            "var(--wt-text-secondary)",
        fontSize: "13px",
        fontWeight: "600"
    },

    statValue: {
        color:
            "var(--wt-text-primary)",
        fontSize: "27px",
        fontWeight: "800"
    },

    // =================================================
    // PR
    // =================================================

    prSection: {
        marginTop: "45px"
    },

    prGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(270px, 1fr))",
        gap: "18px"
    },

    prCard: {
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "18px",
        padding: "22px",
        boxShadow:
            "var(--wt-shadow)"
    },

    prTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "15px"
    },

    prIcon: {
        width: "45px",
        height: "45px",
        borderRadius: "13px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
            "var(--wt-accent-soft)",
        fontSize: "21px"
    },

    prNumber: {
        color:
            "var(--wt-text-muted)",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "1px"
    },

    prExercise: {
        margin: "0 0 10px",
        color:
            "var(--wt-text-primary)",
        fontSize: "20px",
        fontWeight: "800"
    },

    categoryBadge: {
        display: "inline-block",
        backgroundColor:
            "var(--wt-accent-soft)",
        color:
            "var(--wt-accent)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "20px",
        padding: "6px 10px",
        fontSize: "12px",
        fontWeight: "700"
    },

    prStats: {
        display: "grid",
        gridTemplateColumns:
            "repeat(3, 1fr)",
        gap: "10px",
        marginTop: "20px"
    },

    prStat: {
        backgroundColor:
            "var(--wt-surface-secondary)",
        borderRadius: "11px",
        padding: "11px 7px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "3px"
    },

    // =================================================
    // EMPTY
    // =================================================

    emptyCard: {
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "20px",
        padding: "55px 25px",
        textAlign: "center",
        boxShadow:
            "var(--wt-shadow)"
    },

    emptyIcon: {
        fontSize: "48px",
        marginBottom: "10px"
    },

    emptyTitle: {
        margin: "0 0 8px",
        color:
            "var(--wt-text-primary)"
    },

    emptyText: {
        color:
            "var(--wt-text-secondary)",
        maxWidth: "520px",
        margin: "0 auto 20px",
        lineHeight: "1.6"
    },

    // =================================================
    // INFO
    // =================================================

    infoCard: {
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
        marginTop: "35px",
        padding: "18px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "15px"
    },

    infoIcon: {
        fontSize: "21px"
    },

    infoTitle: {
        color:
            "var(--wt-text-primary)"
    },

    infoText: {
        margin: "5px 0 0",
        color:
            "var(--wt-text-secondary)",
        fontSize: "13px",
        lineHeight: "1.6"
    },

    // =================================================
    // CENTER
    // =================================================

    center: {
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        textAlign: "center",
        padding: "30px",
        color:
            "var(--wt-text-primary)"
    },

    loadingIcon: {
        fontSize: "45px"
    },

    errorIcon: {
        fontSize: "45px"
    },

    centerTitle: {
        margin: 0,
        color:
            "var(--wt-text-primary)"
    },

    centerText: {
        margin: 0,
        color:
            "var(--wt-text-secondary)"
    }
};

export default Analytics;