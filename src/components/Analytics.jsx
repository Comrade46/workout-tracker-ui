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

            setSummary(summaryResponse.data || {});

            setPrs(
                Array.isArray(prsResponse.data)
                    ? prsResponse.data
                    : []
            );
        } catch (requestError) {
            console.error(
                "Error loading analytics:",
                requestError
            );

            if (requestError.response?.status === 401) {
                setError(
                    "Your session has expired. Please login again."
                );
            } else {
                setError(
                    requestError.response?.data?.message ||
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
    // FORMATTERS
    // =====================================================

    const formatNumber = (value) => {
        return Number(value || 0).toLocaleString(
            undefined,
            {
                maximumFractionDigits: 2
            }
        );
    };

    const formatDuration = (seconds) => {
        const totalSeconds = Math.max(
            0,
            Math.round(Number(seconds || 0))
        );

        const minutes = Math.floor(
            totalSeconds / 60
        );

        const remainingSeconds =
            totalSeconds % 60;

        if (minutes === 0) {
            return `${remainingSeconds}s`;
        }

        if (remainingSeconds === 0) {
            return `${minutes} min`;
        }

        return `${minutes}m ${remainingSeconds}s`;
    };

    const getTrackingType = (pr) => {
        const value = String(
            pr?.trackingType || ""
        ).toUpperCase();

        if (value === "TIME") {
            return "TIME";
        }

        return "REPS";
    };

    // =====================================================
    // SUMMARY VALUES
    // =====================================================

    const totalWorkouts = getNumber(
        summary?.totalWorkouts,
        summary?.workoutCount,
        summary?.workouts
    );

    /*
     * Backend currently returns:
     *
     * totalDurationMinutes
     *
     * Keep old property names as fallbacks so
     * existing responses continue working.
     */
    const totalMinutes = getNumber(
        summary?.totalDurationMinutes,
        summary?.totalMinutes,
        summary?.minutes,
        summary?.totalDuration
    );

    const totalSets = getNumber(
        summary?.totalSetsCompleted,
        summary?.totalSets,
        summary?.sets,
        summary?.setCount
    );

    const totalVolume = getNumber(
        summary?.totalVolumeLifted,
        summary?.totalVolume,
        summary?.volume
    );

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
        <div
            className="wt-analytics-page"
            style={styles.page}
        >
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
                    OVERVIEW
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
                                    {formatNumber(
                                        totalWorkouts
                                    )}
                                </strong>
                            </div>
                        </div>

                        {/* TIME */}

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
                                    Training Time
                                </span>

                                <strong style={styles.statValue}>
                                    {formatNumber(
                                        totalMinutes
                                    )}{" "}
                                    min
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
                                    {formatNumber(
                                        totalSets
                                    )}
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
                                    Weight Volume
                                </span>

                                <strong style={styles.statValue}>
                                    {formatNumber(
                                        totalVolume
                                    )}{" "}
                                    kg
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
                                    navigate(
                                        "/workout-plans"
                                    )
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

                                const trackingType =
                                    getTrackingType(pr);

                                const weight =
                                    getNumber(
                                        pr.maxWeight,
                                        pr.weight,
                                        pr.bestWeight
                                    );

                                const reps =
                                    getNumber(
                                        pr.maxRepsAtMaxWeight,
                                        pr.reps,
                                        pr.maxReps,
                                        pr.bestReps
                                    );

                                const volume =
                                    getNumber(
                                        pr.volume,
                                        pr.maxVolume
                                    );

                                const duration =
                                    getNumber(
                                        pr.bestDurationSeconds,
                                        pr.durationSeconds,
                                        pr.duration
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

                                        {/* PR HEADER */}

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
                                                PR #
                                                {index + 1}
                                            </span>
                                        </div>

                                        <h3
                                            style={
                                                styles.prExercise
                                            }
                                        >
                                            {exerciseName}
                                        </h3>

                                        <div
                                            style={
                                                styles.badgeRow
                                            }
                                        >
                                            <span
                                                style={
                                                    styles.categoryBadge
                                                }
                                            >
                                                {category}
                                            </span>

                                            <span
                                                style={
                                                    trackingType ===
                                                    "TIME"
                                                        ? styles.timeBadge
                                                        : styles.repsBadge
                                                }
                                            >
                                                {trackingType}
                                            </span>
                                        </div>

                                        {/* TIME PR */}

                                        {trackingType ===
                                        "TIME" ? (
                                            <div
                                                style={
                                                    styles.timePrBox
                                                }
                                            >
                                                <span
                                                    style={
                                                        styles.timePrIcon
                                                    }
                                                >
                                                    ⏱️
                                                </span>

                                                <div>
                                                    <strong
                                                        style={
                                                            styles.timePrValue
                                                        }
                                                    >
                                                        {formatDuration(
                                                            duration
                                                        )}
                                                    </strong>

                                                    <span
                                                        style={
                                                            styles.timePrLabel
                                                        }
                                                    >
                                                        Best Duration
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            /* REPS PR */

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
                                        )}

                                        {pr.achievedDate && (
                                            <div
                                                style={
                                                    styles.achievedDate
                                                }
                                            >
                                                Achieved{" "}
                                                {
                                                    pr.achievedDate
                                                }
                                            </div>
                                        )}
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
                            How your analytics work
                        </strong>

                        <p style={styles.infoText}>
                            REPS exercises use weight × reps
                            for training volume and personal
                            records. TIME exercises use their
                            longest recorded duration as the
                            personal record. TIME sets are not
                            included in weight volume.
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

    badgeRow: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        flexWrap: "wrap"
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

    repsBadge: {
        display: "inline-block",
        backgroundColor:
            "var(--wt-success-soft)",
        color:
            "var(--wt-success, #15803d)",
        borderRadius: "20px",
        padding: "6px 10px",
        fontSize: "11px",
        fontWeight: "800"
    },

    timeBadge: {
        display: "inline-block",
        backgroundColor:
            "var(--wt-accent-soft)",
        color:
            "var(--wt-accent)",
        borderRadius: "20px",
        padding: "6px 10px",
        fontSize: "11px",
        fontWeight: "800"
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
        gap: "3px",
        color:
            "var(--wt-text-primary)"
    },

    timePrBox: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginTop: "20px",
        padding: "18px",
        borderRadius: "14px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        border:
            "1px solid var(--wt-border)"
    },

    timePrIcon: {
        fontSize: "28px"
    },

    timePrValue: {
        display: "block",
        color:
            "var(--wt-text-primary)",
        fontSize: "25px",
        fontWeight: "800"
    },

    timePrLabel: {
        display: "block",
        marginTop: "3px",
        color:
            "var(--wt-text-secondary)",
        fontSize: "12px"
    },

    achievedDate: {
        marginTop: "15px",
        color:
            "var(--wt-text-muted)",
        fontSize: "12px"
    },

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