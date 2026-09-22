import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import "./ProgressTracking.css";

function ProgressTracking() {

    const navigate = useNavigate();

    const [workouts, setWorkouts] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // LOAD WORKOUT HISTORY
    // =====================================================

    useEffect(() => {
        loadWorkouts();
    }, []);

    const loadWorkouts = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await api.get("/workout-sessions");

            setWorkouts(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "Error loading progress:",
                error
            );

            if (error.response?.status === 401) {

                setError(
                    "Your session has expired. Please login again."
                );

            } else {

                setError(
                    "Unable to load progress data."
                );

            }

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // FLATTEN SET DATA
    // =====================================================

    const allSets = useMemo(() => {

        const result = [];

        workouts.forEach((workout) => {

            if (!Array.isArray(workout.sets)) {
                return;
            }

            workout.sets.forEach((set) => {

                result.push({

                    ...set,

                    workoutId:
                        workout.id,

                    workoutDate:
                        workout.workoutDate,

                    durationMinutes:
                        workout.durationMinutes

                });

            });

        });

        return result;

    }, [workouts]);

    // =====================================================
    // EXERCISE LIST
    // =====================================================

    const exercises = useMemo(() => {

        const map = new Map();

        allSets.forEach((set) => {

            const name =
                set.exerciseName ||
                set.exercise ||
                "Unknown Exercise";

            const id =
                set.exerciseId ||
                name;

            if (!map.has(String(id))) {

                map.set(
                    String(id),
                    {
                        id: String(id),
                        name,
                        category:
                            set.category || ""
                    }
                );

            }

        });

        return Array.from(map.values())
            .sort((a, b) =>
                a.name.localeCompare(b.name)
            );

    }, [allSets]);

    // =====================================================
    // DEFAULT EXERCISE
    // =====================================================

    useEffect(() => {

        if (
            !selectedExercise &&
            exercises.length > 0
        ) {

            setSelectedExercise(
                exercises[0].id
            );

        }

    }, [exercises, selectedExercise]);

    // =====================================================
    // SELECTED SETS
    // =====================================================

    const selectedSets = useMemo(() => {

        if (!selectedExercise) {
            return [];
        }

        const selected =
            exercises.find(
                (exercise) =>
                    exercise.id === selectedExercise
            );

        if (!selected) {
            return [];
        }

        return allSets
            .filter((set) => {

                const name =
                    set.exerciseName ||
                    set.exercise ||
                    "Unknown Exercise";

                const id =
                    set.exerciseId ||
                    name;

                return (
                    String(id) ===
                    String(selectedExercise)
                );

            })
            .sort((a, b) => {

                const dateA =
                    new Date(
                        a.workoutDate || 0
                    ).getTime();

                const dateB =
                    new Date(
                        b.workoutDate || 0
                    ).getTime();

                return dateA - dateB;

            });

    }, [
        allSets,
        exercises,
        selectedExercise
    ]);

    // =====================================================
    // SUMMARY
    // =====================================================

    const totalSets =
        selectedSets.length;

    const totalReps =
        selectedSets.reduce(
            (sum, set) =>
                sum + Number(set.reps || 0),
            0
        );

    const totalVolume =
        selectedSets.reduce(
            (sum, set) =>
                sum +
                Number(set.volume ?? 0),
            0
        );

    const maxWeight =
        selectedSets.reduce(
            (max, set) =>
                Math.max(
                    max,
                    Number(set.weight || 0)
                ),
            0
        );

    // =====================================================
    // WORKOUT PERFORMANCE
    // =====================================================

    const workoutPerformance = useMemo(() => {

        const grouped = {};

        selectedSets.forEach((set) => {

            const key =
                set.workoutId ||
                set.workoutDate;

            if (!grouped[key]) {

                grouped[key] = {

                    workoutId:
                        set.workoutId,

                    workoutDate:
                        set.workoutDate,

                    sets: 0,

                    reps: 0,

                    volume: 0,

                    maxWeight: 0

                };

            }

            grouped[key].sets += 1;

            grouped[key].reps +=
                Number(set.reps || 0);

            grouped[key].volume +=
                Number(set.volume ?? 0);

            grouped[key].maxWeight =
                Math.max(
                    grouped[key].maxWeight,
                    Number(set.weight || 0)
                );

        });

        return Object.values(grouped)
            .sort((a, b) =>
                new Date(a.workoutDate || 0) -
                new Date(b.workoutDate || 0)
            );

    }, [selectedSets]);

    // =====================================================
    // LATEST / PREVIOUS
    // =====================================================

    const latestWorkout =
        workoutPerformance.length > 0
            ? workoutPerformance[
                workoutPerformance.length - 1
            ]
            : null;

    const previousWorkout =
        workoutPerformance.length > 1
            ? workoutPerformance[
                workoutPerformance.length - 2
            ]
            : null;

    const getDifference = (
        latest,
        previous
    ) => {

        if (!previous) {
            return null;
        }

        return Number(latest) -
            Number(previous);

    };

    const formatDifference = (value) => {

        if (value === null) {
            return "No previous workout";
        }

        if (value > 0) {
            return `+${value}`;
        }

        return String(value);

    };

    // =====================================================
    // HELPERS
    // =====================================================

    const formatNumber = (value) => {

        return Number(value || 0).toLocaleString(
            undefined,
            {
                maximumFractionDigits: 2
            }
        );

    };

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        const parsed =
            new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return String(date);
        }

        return parsed.toLocaleDateString(
            undefined,
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div style={styles.center}>

                <div style={styles.centerIcon}>
                    📈
                </div>

                <h2 style={styles.centerTitle}>
                    Loading progress...
                </h2>

                <p style={styles.centerText}>
                    Analyzing your workout history
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

                <div style={styles.centerIcon}>
                    ⚠️
                </div>

                <h2 style={styles.centerTitle}>
                    {error}
                </h2>

                <button
                    type="button"
                    style={styles.primaryButton}
                    onClick={loadWorkouts}
                >
                    Try Again
                </button>

            </div>

        );

    }

    // =====================================================
    // EMPTY
    // =====================================================

    if (workouts.length === 0) {

        return (

            <div className="wt-progress-page" style={styles.page}>

                <div style={styles.container}>

                    <div style={styles.header}>

                        <div>

                            <div style={styles.eyebrow}>
                                PERFORMANCE
                            </div>

                            <h1 style={styles.title}>
                                Progress Tracking
                            </h1>

                            <p style={styles.subtitle}>
                                Track how your workout
                                performance changes over time.
                            </p>

                        </div>

                    </div>

                    <div style={styles.emptyCard}>

                        <div style={styles.emptyIcon}>
                            📈
                        </div>

                        <h2 style={styles.emptyTitle}>
                            No workout data yet
                        </h2>

                        <p style={styles.emptyText}>
                            Complete a workout and record
                            your sets to start tracking
                            your progress.
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

                </div>

            </div>

        );

    }

    // =====================================================
    // MAIN
    // =====================================================

    return (

        <div style={styles.page}>

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
                            Progress Tracking
                        </h1>

                        <p style={styles.subtitle}>
                            Track your exercise performance
                            and training progress.
                        </p>

                    </div>

                    <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={() =>
                            navigate("/analytics")
                        }
                    >
                        ← Analytics
                    </button>

                </div>

                {/* =================================================
                    EXERCISE SELECTOR
                ================================================= */}

                <div style={styles.selectorCard}>

                    <div>

                        <label
                            htmlFor="exerciseSelector"
                            style={styles.label}
                        >
                            Select Exercise
                        </label>

                        <p style={styles.selectorHint}>
                            Choose an exercise to view
                            detailed progress.
                        </p>

                    </div>

                    <select
                        id="exerciseSelector"
                        value={selectedExercise}
                        onChange={(event) =>
                            setSelectedExercise(
                                event.target.value
                            )
                        }
                        style={styles.select}
                    >

                        {exercises.map(
                            (exercise) => (

                                <option
                                    key={exercise.id}
                                    value={exercise.id}
                                >
                                    {exercise.name}
                                    {exercise.category
                                        ? ` — ${exercise.category}`
                                        : ""}
                                </option>

                            )
                        )}

                    </select>

                </div>

                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <div style={styles.summaryGrid}>

                    <StatCard
                        icon="📋"
                        label="Recorded Sets"
                        value={formatNumber(totalSets)}
                    />

                    <StatCard
                        icon="🔢"
                        label="Total Reps"
                        value={formatNumber(totalReps)}
                    />

                    <StatCard
                        icon="📦"
                        label="Total Volume"
                        value={formatNumber(totalVolume)}
                        suffix=" kg"
                    />

                    <StatCard
                        icon="🏋️"
                        label="Max Weight"
                        value={formatNumber(maxWeight)}
                        suffix=" kg"
                    />

                </div>

                {/* =================================================
                    LATEST VS PREVIOUS
                ================================================= */}

                <section style={styles.section}>

                    <div style={styles.sectionHeader}>

                        <div>

                            <h2 style={styles.sectionTitle}>
                                Latest Performance
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Latest workout compared with
                                the previous workout.
                            </p>

                        </div>

                    </div>

                    {latestWorkout ? (

                        <div style={styles.comparisonGrid}>

                            <ComparisonCard
                                label="Sets"
                                latest={
                                    latestWorkout.sets
                                }
                                previous={
                                    previousWorkout?.sets
                                }
                                suffix=""
                                formatNumber={
                                    formatNumber
                                }
                                getDifference={
                                    getDifference
                                }
                                formatDifference={
                                    formatDifference
                                }
                            />

                            <ComparisonCard
                                label="Reps"
                                latest={
                                    latestWorkout.reps
                                }
                                previous={
                                    previousWorkout?.reps
                                }
                                suffix=""
                                formatNumber={
                                    formatNumber
                                }
                                getDifference={
                                    getDifference
                                }
                                formatDifference={
                                    formatDifference
                                }
                            />

                            <ComparisonCard
                                label="Volume"
                                latest={
                                    latestWorkout.volume
                                }
                                previous={
                                    previousWorkout?.volume
                                }
                                suffix=" kg"
                                formatNumber={
                                    formatNumber
                                }
                                getDifference={
                                    getDifference
                                }
                                formatDifference={
                                    formatDifference
                                }
                            />

                            <ComparisonCard
                                label="Max Weight"
                                latest={
                                    latestWorkout.maxWeight
                                }
                                previous={
                                    previousWorkout?.maxWeight
                                }
                                suffix=" kg"
                                formatNumber={
                                    formatNumber
                                }
                                getDifference={
                                    getDifference
                                }
                                formatDifference={
                                    formatDifference
                                }
                            />

                        </div>

                    ) : (

                        <div style={styles.emptySmall}>
                            No performance data available.
                        </div>

                    )}

                </section>

                {/* =================================================
                    PERFORMANCE HISTORY
                ================================================= */}

                <section style={styles.section}>

                    <div style={styles.sectionHeader}>

                        <div>

                            <h2 style={styles.sectionTitle}>
                                Performance History
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Workout-by-workout performance
                                for the selected exercise.
                            </p>

                        </div>

                    </div>

                    {workoutPerformance.length === 0 ? (

                        <div style={styles.emptySmall}>
                            No recorded sets for this exercise.
                        </div>

                    ) : (

                        <div style={styles.tableCard}>

                            <div style={styles.tableWrapper}>

                                <table
                                    style={styles.table}
                                >

                                    <thead>

                                        <tr>

                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                Date
                                            </th>

                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                Sets
                                            </th>

                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                Reps
                                            </th>

                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                Volume
                                            </th>

                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                Max Weight
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {workoutPerformance
                                            .slice()
                                            .reverse()
                                            .map(
                                                (
                                                    workout,
                                                    index
                                                ) => (

                                                    <tr
                                                        key={
                                                            workout.workoutId ||
                                                            `${workout.workoutDate}-${index}`
                                                        }
                                                    >

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                formatDate(
                                                                    workout.workoutDate
                                                                )
                                                            }
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                formatNumber(
                                                                    workout.sets
                                                                )
                                                            }
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                formatNumber(
                                                                    workout.reps
                                                                )
                                                            }
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                formatNumber(
                                                                    workout.volume
                                                                )
                                                            }{" "}
                                                            kg
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                formatNumber(
                                                                    workout.maxWeight
                                                                )
                                                            }{" "}
                                                            kg
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                    </tbody>

                                </table>

                            </div>

                        </div>

                    )}

                </section>

                {/* =================================================
                    SET HISTORY
                ================================================= */}

                <section style={styles.section}>

                    <div style={styles.sectionHeader}>

                        <div>

                            <h2 style={styles.sectionTitle}>
                                Set History
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Every recorded set for the
                                selected exercise.
                            </p>

                        </div>

                    </div>

                    {selectedSets.length === 0 ? (

                        <div style={styles.emptySmall}>
                            No sets recorded.
                        </div>

                    ) : (

                        <div style={styles.tableCard}>

                            <div style={styles.tableWrapper}>

                                <table
                                    style={styles.table}
                                >

                                    <thead>

                                        <tr>

                                            <th style={styles.th}>
                                                Date
                                            </th>

                                            <th style={styles.th}>
                                                Set
                                            </th>

                                            <th style={styles.th}>
                                                Reps
                                            </th>

                                            <th style={styles.th}>
                                                Weight
                                            </th>

                                            <th style={styles.th}>
                                                RPE
                                            </th>

                                            <th style={styles.th}>
                                                Volume
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {selectedSets
                                            .slice()
                                            .reverse()
                                            .map(
                                                (
                                                    set,
                                                    index
                                                ) => (

                                                    <tr
                                                        key={
                                                            set.id ||
                                                            `${set.workoutId}-${set.setNumber}-${index}`
                                                        }
                                                    >

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                formatDate(
                                                                    set.workoutDate
                                                                )
                                                            }
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            Set{" "}
                                                            {
                                                                set.setNumber ||
                                                                index + 1
                                                            }
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                formatNumber(
                                                                    set.reps
                                                                )
                                                            }
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                formatNumber(
                                                                    set.weight
                                                                )
                                                            }{" "}
                                                            kg
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                set.rpe ??
                                                                "-"
                                                            }
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                formatNumber(
                                                                    set.volume
                                                                )
                                                            }{" "}
                                                            kg
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                    </tbody>

                                </table>

                            </div>

                        </div>

                    )}

                </section>

            </div>

        </div>

    );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
    icon,
    label,
    value,
    suffix = ""
}) {

    return (

        <div style={styles.statCard}>

            <div style={styles.statIcon}>
                {icon}
            </div>

            <div style={styles.statContent}>

                <span style={styles.statLabel}>
                    {label}
                </span>

                <strong style={styles.statValue}>
                    {value}
                    {suffix}
                </strong>

            </div>

        </div>

    );
}

// =====================================================
// COMPARISON CARD
// =====================================================

function ComparisonCard({
    label,
    latest,
    previous,
    suffix,
    formatNumber,
    getDifference,
    formatDifference
}) {

    const difference =
        previous === undefined
            ? null
            : getDifference(
                latest,
                previous
            );

    return (

        <div style={styles.comparisonCard}>

            <span style={styles.comparisonLabel}>
                {label}
            </span>

            <strong style={styles.comparisonValue}>
                {formatNumber(latest)}
                {suffix}
            </strong>

            {previous !== undefined ? (

                <span
                    style={{
                        ...styles.difference,
                        color:
                            difference > 0
                                ? "var(--wt-success, #218739)"
                                : difference < 0
                                    ? "var(--wt-danger, #c83232)"
                                    : "var(--wt-text-muted)"
                    }}
                >
                    {formatDifference(difference)}
                    {suffix}
                </span>

            ) : (

                <span style={styles.noPrevious}>
                    First recorded workout
                </span>

            )}

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
        padding: "45px 20px"
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
        flexWrap: "wrap",
        marginBottom: "35px"
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
        lineHeight: "1.6",
        fontSize: "16px"
    },

    // =================================================
    // SELECTOR
    // =================================================

    selectorCard: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "18px",
        padding: "20px",
        marginBottom: "22px",
        boxShadow:
            "var(--wt-shadow)"
    },

    label: {
        display: "block",
        color:
            "var(--wt-text-primary)",
        fontSize: "15px",
        fontWeight: "800",
        marginBottom: "4px"
    },

    selectorHint: {
        margin: 0,
        color:
            "var(--wt-text-secondary)",
        fontSize: "13px"
    },

    select: {
        minWidth: "280px",
        maxWidth: "100%",
        padding: "12px 14px",
        borderRadius: "10px",
        border:
            "1px solid var(--wt-input-border)",
        backgroundColor:
            "var(--wt-input-background)",
        color:
            "var(--wt-input-text)",
        fontSize: "14px",
        fontWeight: "600",
        outline: "none"
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
        gap: "15px",
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "18px",
        padding: "21px",
        boxShadow:
            "var(--wt-shadow)"
    },

    statIcon: {
        width: "50px",
        height: "50px",
        borderRadius: "14px",
        backgroundColor:
            "var(--wt-accent-soft)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
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
        fontSize: "25px",
        fontWeight: "800"
    },

    // =================================================
    // SECTION
    // =================================================

    section: {
        marginTop: "40px"
    },

    sectionHeader: {
        marginBottom: "17px"
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
    // COMPARISON
    // =================================================

    comparisonGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "16px"
    },

    comparisonCard: {
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "17px",
        padding: "20px",
        boxShadow:
            "var(--wt-shadow)"
    },

    comparisonLabel: {
        display: "block",
        color:
            "var(--wt-text-secondary)",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "8px"
    },

    comparisonValue: {
        display: "block",
        color:
            "var(--wt-text-primary)",
        fontSize: "25px",
        fontWeight: "800"
    },

    difference: {
        display: "block",
        marginTop: "8px",
        fontSize: "13px",
        fontWeight: "700"
    },

    noPrevious: {
        display: "block",
        marginTop: "8px",
        color:
            "var(--wt-text-muted)",
        fontSize: "12px"
    },

    // =================================================
    // TABLE
    // =================================================

    tableCard: {
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow:
            "var(--wt-shadow)"
    },

    tableWrapper: {
        width: "100%",
        overflowX: "auto"
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: "650px"
    },

    th: {
        padding: "15px",
        textAlign: "left",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-secondary)",
        fontSize: "12px",
        fontWeight: "800",
        borderBottom:
            "1px solid var(--wt-border)",
        whiteSpace: "nowrap"
    },

    td: {
        padding: "15px",
        color:
            "var(--wt-text-primary)",
        fontSize: "13px",
        borderBottom:
            "1px solid var(--wt-border)",
        whiteSpace: "nowrap"
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
        padding: "60px 25px",
        textAlign: "center",
        boxShadow:
            "var(--wt-shadow)"
    },

    emptyIcon: {
        fontSize: "50px",
        marginBottom: "12px"
    },

    emptyTitle: {
        margin: "0 0 8px",
        color:
            "var(--wt-text-primary)"
    },

    emptyText: {
        maxWidth: "550px",
        margin: "0 auto 20px",
        color:
            "var(--wt-text-secondary)",
        lineHeight: "1.6"
    },

    emptySmall: {
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "15px",
        padding: "25px",
        color:
            "var(--wt-text-secondary)"
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
        padding: "30px"
    },

    centerIcon: {
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

export default ProgressTracking;