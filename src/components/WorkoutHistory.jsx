import { useEffect, useState } from "react";
import { cleanProgramNotes } from "../data/programs";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import PendingSyncBanner from "./PendingSyncBanner";
import WorkoutCalendar from "../progress/WorkoutCalendar";
import useBody from "../progress/useBody";
import { allWorkouts, estimateCalories, weightOn } from "../progress/motivation";
import { usePendingWorkouts } from "../offline/workoutOutbox";
import "./WorkoutHistory.css";

function WorkoutHistory() {
    // Weight log (for calorie estimates) and workouts waiting on this phone
    const body = useBody();
    const { pending } = usePendingWorkouts();

    const navigate = useNavigate();

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSession, setSelectedSession] =
        useState(null);

    useEffect(() => {
        loadWorkoutHistory();
    }, []);

    // =====================================================
    // GET SESSION SORT DATE
    // Latest workout should always appear first.
    // =====================================================

    const getSessionTimestamp = (session) => {
        const possibleDates = [
            session?.createdAt,
            session?.workoutDateTime,
            session?.workoutDate,
            session?.date,
            session?.sessionDate
        ];

        for (const value of possibleDates) {
            if (!value) {
                continue;
            }

            const timestamp = new Date(value).getTime();

            if (Number.isFinite(timestamp)) {
                return timestamp;
            }
        }

        return 0;
    };

    // =====================================================
    // SORT SESSIONS
    // Newest / latest workout first.
    // If dates are equal, newer ID comes first.
    // =====================================================

    const sortSessionsLatestFirst = (sessionList) => {
        return [...sessionList].sort((a, b) => {
            const timestampA =
                getSessionTimestamp(a);

            const timestampB =
                getSessionTimestamp(b);

            if (timestampA !== timestampB) {
                return timestampB - timestampA;
            }

            return (
                Number(b?.id || 0) -
                Number(a?.id || 0)
            );
        });
    };

    // =====================================================
    // LOAD WORKOUT HISTORY
    // =====================================================

    const loadWorkoutHistory = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await api.get("/workout-sessions");

            console.log(
                "Workout History:",
                response.data
            );

            const workoutSessions =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            const sortedSessions =
                sortSessionsLatestFirst(
                    workoutSessions
                );

            setSessions(sortedSessions);
        } catch (requestError) {
            console.error(
                "Error loading workout history:",
                requestError
            );

            if (
                requestError.response?.status ===
                401
            ) {
                setError(
                    "Your session has expired. Please login again."
                );
            } else {
                const backendMessage =
                    requestError.response?.data
                        ?.message ||
                    requestError.response?.data
                        ?.error;

                setError(
                    backendMessage ||
                        "Unable to load workout history."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // OPEN DETAILS
    // =====================================================

    const openDetails = (session) => {
        setSelectedSession(session);
    };

    // =====================================================
    // CLOSE DETAILS
    // =====================================================

    const closeDetails = () => {
        setSelectedSession(null);
    };

    // =====================================================
    // ESC KEY
    // =====================================================

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (
                event.key === "Escape" &&
                selectedSession
            ) {
                closeDetails();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [selectedSession]);

    // =====================================================
    // FORMAT VOLUME
    // =====================================================

    const formatVolume = (value) => {
        const number = Number(value || 0);

        if (Number.isInteger(number)) {
            return number;
        }

        return number.toFixed(2);
    };

    // =====================================================
    // FORMAT TIME
    // =====================================================

    const formatDuration = (seconds) => {
        const totalSeconds = Number(seconds || 0);

        if (totalSeconds <= 0) {
            return "0 sec";
        }

        const minutes =
            Math.floor(totalSeconds / 60);

        const remainingSeconds =
            totalSeconds % 60;

        if (minutes > 0) {
            return `${minutes} min ${remainingSeconds} sec`;
        }

        return `${remainingSeconds} sec`;
    };

    // =====================================================
    // CHECK TIME-BASED SET
    // =====================================================

    const isTimeBasedSet = (set) => {
        return (
            Number(set?.durationSeconds || 0) >
            0
        );
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div
                className="wt-workout-history-page"
                style={styles.center}
            >
                <PendingSyncBanner />

                <div style={styles.loadingIcon}>
                    🏋️
                </div>

                <h2 style={styles.centerTitle}>
                    Loading workout history...
                </h2>

                <p style={styles.muted}>
                    Please wait.
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
                <PendingSyncBanner />

                <div style={styles.errorIcon}>
                    ⚠️
                </div>

                <h2 style={styles.centerTitle}>
                    Unable to load workout history
                </h2>

                <p style={styles.errorText}>
                    {error}
                </p>

                <button
                    type="button"
                    style={styles.primaryButton}
                    onClick={loadWorkoutHistory}
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
            className="wt-workout-history-page"
            style={styles.page}
        >
            <div style={styles.container}>

                {/* Workouts saved on this phone, not uploaded yet */}
                <PendingSyncBanner />

                {/* HEADER */}

                <div style={styles.header}>
                    <div>
                        <div style={styles.eyebrow}>
                            YOUR FITNESS JOURNEY
                        </div>

                        <h1 style={styles.title}>
                            Workout History
                        </h1>

                        <p style={styles.subtitle}>
                            Track your completed workouts
                            and review your progress.
                        </p>
                    </div>

                    <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        ← Dashboard
                    </button>
                </div>

                {/* CALENDAR */}

                <WorkoutCalendar
                    workouts={allWorkouts(sessions, pending)}
                    weights={body.weights}
                />

                {/* EMPTY STATE */}

                {sessions.length === 0 ? (
                    <div style={styles.emptyCard}>
                        <div style={styles.emptyIcon}>
                            🏃
                        </div>

                        <h2 style={styles.emptyTitle}>
                            No workouts yet
                        </h2>

                        <p style={styles.muted}>
                            Complete your first workout
                            to see it here.
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
                            Browse Workout Plans
                        </button>
                    </div>
                ) : (
                    <div style={styles.list}>
                        {sessions.map((session) => {
                            return (
                                <div
                                    key={session.id}
                                    style={styles.card}
                                >

                                    {/* CARD HEADER */}

                                    <div
                                        style={
                                            styles.cardHeader
                                        }
                                    >
                                        <div>
                                            <div
                                                style={
                                                    styles.date
                                                }
                                            >
                                                📅{" "}
                                                {
                                                    session.workoutDate
                                                }
                                            </div>

                                            <h2
                                                style={
                                                    styles.cardTitle
                                                }
                                            >
                                                {cleanProgramNotes(session.notes) ||
                                                    "Workout Session"}
                                            </h2>
                                        </div>

                                        <div
                                            style={
                                                styles.sessionBadge
                                            }
                                        >
                                            ✓ Completed
                                        </div>
                                    </div>

                                    {/* STATS */}

                                    <div
                                        style={
                                            styles.stats
                                        }
                                    >

                                        <div
                                            style={
                                                styles.stat
                                            }
                                        >
                                            <span
                                                style={
                                                    styles.statIcon
                                                }
                                            >
                                                ⏱️
                                            </span>

                                            <div
                                                style={
                                                    styles.statContent
                                                }
                                            >
                                                <strong>
                                                    {session.durationMinutes ??
                                                        0}{" "}
                                                    min
                                                </strong>

                                                <small>
                                                    Duration
                                                </small>
                                            </div>
                                        </div>

                                        <div
                                            style={
                                                styles.stat
                                            }
                                        >
                                            <span
                                                style={
                                                    styles.statIcon
                                                }
                                            >
                                                💪
                                            </span>

                                            <div
                                                style={
                                                    styles.statContent
                                                }
                                            >
                                                <strong>
                                                    {session.totalSets ??
                                                        0}
                                                </strong>

                                                <small>
                                                    Sets
                                                </small>
                                            </div>
                                        </div>

                                        <div
                                            style={
                                                styles.stat
                                            }
                                        >
                                            <span
                                                style={
                                                    styles.statIcon
                                                }
                                            >
                                                🏋️
                                            </span>

                                            <div
                                                style={
                                                    styles.statContent
                                                }
                                            >
                                                <strong>
                                                    {formatVolume(
                                                        session.totalVolume
                                                    )}
                                                </strong>

                                                <small>
                                                    Volume
                                                </small>
                                            </div>
                                        </div>

                                        {estimateCalories(
                                            session.durationMinutes,
                                            weightOn(body.weights, session.workoutDate)
                                        ) && (
                                            <div
                                                style={styles.stat}
                                                title="Estimate from workout time and your body weight"
                                            >
                                                <span style={styles.statIcon}>
                                                    ⚡
                                                </span>

                                                <div style={styles.statContent}>
                                                    <strong>
                                                        ≈ {estimateCalories(
                                                            session.durationMinutes,
                                                            weightOn(body.weights, session.workoutDate)
                                                        )}
                                                    </strong>

                                                    <small>
                                                        kcal
                                                    </small>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            style={
                                                styles.viewButton
                                            }
                                            onClick={() =>
                                                openDetails(
                                                    session
                                                )
                                            }
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* =================================================
                    DETAILS MODAL
                ================================================= */}

                {selectedSession && (
                    <div
                        style={styles.overlay}
                        onClick={closeDetails}
                    >
                        <div
                            style={styles.modal}
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            {/* MODAL HEADER */}

                            <div
                                style={
                                    styles.modalHeader
                                }
                            >
                                <div>
                                    <div
                                        style={
                                            styles.date
                                        }
                                    >
                                        📅{" "}
                                        {
                                            selectedSession.workoutDate
                                        }
                                    </div>

                                    <h2
                                        style={
                                            styles.modalTitle
                                        }
                                    >
                                        Workout Details
                                    </h2>

                                    <p
                                        style={
                                            styles.modalNotes
                                        }
                                    >
                                        {cleanProgramNotes(selectedSession.notes) ||
                                            "Completed Workout"}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    style={
                                        styles.closeButton
                                    }
                                    onClick={
                                        closeDetails
                                    }
                                    aria-label="Close workout details"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* DETAIL STATS */}

                            <div
                                style={
                                    styles.detailStats
                                }
                            >
                                <div
                                    style={
                                        styles.detailStat
                                    }
                                >
                                    <strong>
                                        {
                                            selectedSession.durationMinutes ??
                                            0
                                        }
                                    </strong>

                                    <span>
                                        Minutes
                                    </span>
                                </div>

                                <div
                                    style={
                                        styles.detailStat
                                    }
                                >
                                    <strong>
                                        {
                                            selectedSession.totalSets ??
                                            0
                                        }
                                    </strong>

                                    <span>
                                        Sets
                                    </span>
                                </div>

                                <div
                                    style={
                                        styles.detailStat
                                    }
                                >
                                    <strong>
                                        {formatVolume(
                                            selectedSession.totalVolume
                                        )}
                                    </strong>

                                    <span>
                                        Volume
                                    </span>
                                </div>
                            </div>

                            {/* EXERCISES */}

                            <h3
                                style={
                                    styles.exerciseHeading
                                }
                            >
                                Exercises & Sets
                            </h3>

                            {Array.isArray(
                                selectedSession.sets
                            ) &&
                            selectedSession.sets.length >
                                0 ? (
                                <div
                                    style={
                                        styles.setList
                                    }
                                >
                                    {selectedSession.sets.map(
                                        (
                                            set,
                                            index
                                        ) => {
                                            const timeBased =
                                                isTimeBasedSet(
                                                    set
                                                );

                                            return (
                                                <div
                                                    key={
                                                        set.id ||
                                                        index
                                                    }
                                                    style={
                                                        styles.setCard
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.exerciseInfo
                                                        }
                                                    >
                                                        <strong
                                                            style={
                                                                styles.exerciseName
                                                            }
                                                        >
                                                            {set.exerciseName ||
                                                                "Unknown Exercise"}
                                                        </strong>

                                                        <span
                                                            style={
                                                                styles.category
                                                            }
                                                        >
                                                            {set.category ||
                                                                "General"}
                                                        </span>
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.setInfo
                                                        }
                                                    >
                                                        <span
                                                            style={
                                                                styles.typeBadge
                                                            }
                                                        >
                                                            {timeBased
                                                                ? "TIME"
                                                                : "REPS"}
                                                        </span>

                                                        <span>
                                                            <strong>
                                                                Set
                                                            </strong>{" "}
                                                            {set.setNumber ??
                                                                "-"}
                                                        </span>

                                                        {timeBased ? (
                                                            <span>
                                                                <strong>
                                                                    Duration
                                                                </strong>{" "}
                                                                {formatDuration(
                                                                    set.durationSeconds
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <span>
                                                                    <strong>
                                                                        Reps
                                                                    </strong>{" "}
                                                                    {set.reps ??
                                                                        0}
                                                                </span>

                                                                <span>
                                                                    <strong>
                                                                        Weight
                                                                    </strong>{" "}
                                                                    {set.weight ??
                                                                        0}{" "}
                                                                    kg
                                                                </span>

                                                                <span>
                                                                    <strong>
                                                                        RPE
                                                                    </strong>{" "}
                                                                    {set.rpe ??
                                                                        "-"}
                                                                </span>

                                                                <span>
                                                                    <strong>
                                                                        Volume
                                                                    </strong>{" "}
                                                                    {formatVolume(
                                                                        set.volume
                                                                    )}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            ) : (
                                <div
                                    style={
                                        styles.noSets
                                    }
                                >
                                    <div
                                        style={
                                            styles.noSetsIcon
                                        }
                                    >
                                        📝
                                    </div>

                                    <strong
                                        style={
                                            styles.noSetsTitle
                                        }
                                    >
                                        No exercise sets
                                        recorded
                                    </strong>

                                    <p
                                        style={
                                            styles.noSetsText
                                        }
                                    >
                                        This workout was
                                        completed without
                                        recording individual
                                        exercise sets.
                                    </p>
                                </div>
                            )}

                            <button
                                type="button"
                                style={
                                    styles.modalCloseButton
                                }
                                onClick={closeDetails}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
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
        padding: "40px 20px",
        boxSizing: "border-box"
    },

    container: {
        maxWidth: "1100px",
        margin: "0 auto"
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        marginBottom: "30px",
        flexWrap: "wrap"
    },

    eyebrow: {
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "2px",
        color: "var(--wt-accent)",
        marginBottom: "8px"
    },

    title: {
        margin: 0,
        fontSize: "38px",
        fontWeight: "800",
        color: "var(--wt-text-primary)"
    },

    subtitle: {
        marginTop: "8px",
        color: "var(--wt-text-secondary)",
        fontSize: "16px",
        lineHeight: 1.5
    },

    date: {
        color: "var(--wt-text-muted)",
        fontSize: "13px",
        fontWeight: "600"
    },

    cardTitle: {
        margin: "8px 0 0",
        fontSize: "20px",
        color: "var(--wt-text-primary)"
    },

    list: {
        display: "flex",
        flexDirection: "column",
        gap: "18px"
    },

    card: {
        backgroundColor:
            "var(--wt-surface)",
        borderRadius: "18px",
        padding: "22px",
        border:
            "1px solid var(--wt-border)",
        boxShadow:
            "var(--wt-shadow)"
    },

    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "15px",
        flexWrap: "wrap"
    },

    sessionBadge: {
        backgroundColor:
            "var(--wt-success-soft, #dcfce7)",
        color:
            "var(--wt-success, #15803d)",
        padding: "7px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700"
    },

    stats: {
        display: "flex",
        alignItems: "center",
        gap: "25px",
        marginTop: "22px",
        paddingTop: "18px",
        borderTop:
            "1px solid var(--wt-border)",
        flexWrap: "wrap"
    },

    stat: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },

    statIcon: {
        fontSize: "20px"
    },

    statContent: {
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        color: "var(--wt-text-primary)"
    },

    statContentSmall: {
        color: "var(--wt-text-muted)",
        fontSize: "12px"
    },

    viewButton: {
        marginLeft: "auto",
        border: "none",
        borderRadius: "10px",
        padding: "11px 18px",
        backgroundColor:
            "var(--wt-accent)",
        color: "var(--wt-on-accent)",
        cursor: "pointer",
        fontWeight: "700"
    },

    primaryButton: {
        border: "none",
        borderRadius: "10px",
        padding: "12px 22px",
        backgroundColor:
            "var(--wt-accent)",
        color: "var(--wt-on-accent)",
        cursor: "pointer",
        fontWeight: "700"
    },

    secondaryButton: {
        border:
            "1px solid var(--wt-border)",
        borderRadius: "10px",
        padding: "12px 20px",
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)",
        cursor: "pointer",
        fontWeight: "600"
    },

    emptyCard: {
        backgroundColor:
            "var(--wt-surface)",
        borderRadius: "20px",
        padding: "60px 30px",
        textAlign: "center",
        border:
            "1px solid var(--wt-border)",
        boxShadow:
            "var(--wt-shadow)"
    },

    emptyIcon: {
        fontSize: "50px",
        marginBottom: "10px"
    },

    emptyTitle: {
        color:
            "var(--wt-text-primary)"
    },

    muted: {
        color:
            "var(--wt-text-secondary)"
    },

    center: {
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "20px",
        backgroundColor:
            "var(--wt-page-background)",
        color:
            "var(--wt-text-primary)",
        boxSizing: "border-box"
    },

    centerTitle: {
        color:
            "var(--wt-text-primary)",
        margin: 0
    },

    loadingIcon: {
        fontSize: "45px"
    },

    errorIcon: {
        fontSize: "45px"
    },

    errorText: {
        color:
            "var(--wt-danger, #dc2626)",
        textAlign: "center",
        maxWidth: "600px"
    },

    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor:
            "rgba(0,0,0,0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        zIndex: 1000,
        boxSizing: "border-box"
    },

    modal: {
        width: "100%",
        maxWidth: "750px",
        maxHeight: "85vh",
        overflowY: "auto",
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)",
        borderRadius: "20px",
        padding: "28px",
        border:
            "1px solid var(--wt-border)",
        boxShadow:
            "0 15px 50px rgba(0,0,0,0.35)",
        boxSizing: "border-box"
    },

    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px"
    },

    modalTitle: {
        margin: "8px 0 0",
        fontSize: "26px",
        color:
            "var(--wt-text-primary)"
    },

    modalNotes: {
        marginTop: "8px",
        color:
            "var(--wt-text-secondary)",
        fontSize: "14px"
    },

    closeButton: {
        border: "none",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-primary)",
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        cursor: "pointer",
        fontSize: "16px",
        flexShrink: 0
    },

    detailStats: {
        display: "grid",
        gridTemplateColumns:
            "repeat(3, 1fr)",
        gap: "12px",
        marginTop: "25px"
    },

    detailStat: {
        backgroundColor:
            "var(--wt-surface-secondary)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "12px",
        padding: "15px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        color:
            "var(--wt-text-primary)"
    },

    exerciseHeading: {
        marginTop: "30px",
        marginBottom: "15px",
        color:
            "var(--wt-text-primary)"
    },

    setList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px"
    },

    setCard: {
        backgroundColor:
            "var(--wt-surface-secondary)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "12px",
        padding: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap"
    },

    exerciseInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },

    exerciseName: {
        color:
            "var(--wt-text-primary)"
    },

    category: {
        color:
            "var(--wt-text-muted)",
        fontSize: "12px"
    },

    setInfo: {
        display: "flex",
        gap: "12px",
        color:
            "var(--wt-text-secondary)",
        fontSize: "13px",
        flexWrap: "wrap",
        alignItems: "center"
    },

    typeBadge: {
        padding: "5px 9px",
        borderRadius: "12px",
        backgroundColor:
            "var(--wt-accent-soft, #dbeafe)",
        color:
            "var(--wt-accent)",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "0.5px"
    },

    noSets: {
        backgroundColor:
            "var(--wt-surface-secondary)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "12px",
        padding: "25px",
        color:
            "var(--wt-text-secondary)",
        textAlign: "center"
    },

    noSetsIcon: {
        fontSize: "35px",
        marginBottom: "10px"
    },

    noSetsTitle: {
        color:
            "var(--wt-text-primary)"
    },

    noSetsText: {
        color:
            "var(--wt-text-secondary)"
    },

    modalCloseButton: {
        width: "100%",
        marginTop: "25px",
        border: "none",
        borderRadius: "10px",
        padding: "13px",
        backgroundColor:
            "var(--wt-accent)",
        color: "var(--wt-on-accent)",
        cursor: "pointer",
        fontWeight: "700"
    }
};

export default WorkoutHistory;