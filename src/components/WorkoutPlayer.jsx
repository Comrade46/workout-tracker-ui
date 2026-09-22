import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosConfig";
import "./WorkoutPlayer.css";

function formatTime(totalSeconds) {
    const seconds = Math.max(0, Number(totalSeconds) || 0);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}

function getExerciseId(exercise) {
    return (
        exercise?.exerciseId ??
        exercise?.exercise?.id ??
        exercise?.id ??
        null
    );
}

function getExerciseName(exercise) {
    return (
        exercise?.exerciseName ??
        exercise?.exercise?.name ??
        exercise?.name ??
        "Exercise"
    );
}

function getCategory(exercise) {
    return (
        exercise?.category ??
        exercise?.exercise?.category ??
        "General"
    );
}

function getEquipment(exercise) {
    return (
        exercise?.equipment ??
        exercise?.exercise?.equipment ??
        "Bodyweight"
    );
}

function getDuration(exercise) {
    return Math.max(
        1,
        Number(
            exercise?.durationSeconds ??
                exercise?.duration ??
                exercise?.exercise?.durationSeconds ??
                30
        ) || 30
    );
}

function getRest(exercise) {
    return Math.max(
        0,
        Number(
            exercise?.restSeconds ??
                exercise?.rest ??
                exercise?.exercise?.restSeconds ??
                15
        ) || 0
    );
}

function getExerciseOrder(exercise) {
    return Number(
        exercise?.exerciseOrder ??
            exercise?.order ??
            exercise?.exercise?.exerciseOrder ??
            0
    );
}

function WorkoutPlayer() {
    const { planId } = useParams();
    const navigate = useNavigate();

    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [currentIndex, setCurrentIndex] = useState(0);
    const [mode, setMode] = useState("exercise");
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    const [exerciseSets, setExerciseSets] = useState({});
    const [setForm, setSetForm] = useState({
        reps: "",
        weight: "0",
        rpe: ""
    });

    const [setError, setSetError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [completed, setCompleted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedSession, setSavedSession] = useState(null);

    const workoutStartTimeRef = useRef(null);
    const completionHandledRef = useRef(false);
    const timerRef = useRef(null);

    const currentExercise = exercises[currentIndex] || null;

    const currentExerciseId = useMemo(
        () => getExerciseId(currentExercise),
        [currentExercise]
    );

    const currentExerciseSets = useMemo(() => {
        if (!currentExerciseId) {
            return [];
        }

        return exerciseSets[currentExerciseId] || [];
    }, [exerciseSets, currentExerciseId]);

    const totalSets = useMemo(() => {
        return Object.values(exerciseSets).reduce(
            (total, sets) => total + sets.length,
            0
        );
    }, [exerciseSets]);

    const totalVolume = useMemo(() => {
        return Object.values(exerciseSets)
            .flat()
            .reduce(
                (total, set) =>
                    total + Number(set.volume || 0),
                0
            );
    }, [exerciseSets]);

    const progressPercentage =
        exercises.length === 0
            ? 0
            : ((currentIndex + 1) / exercises.length) * 100;

    // =====================================================
    // LOAD EXERCISES
    // =====================================================

    const loadExercises = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            setSaveError("");

            if (!planId) {
                setLoadError(
                    "Workout plan ID is missing."
                );
                return;
            }

            const response = await api.get(
                `/workout-plan-exercises/workout-plans/${planId}/exercises`
            );

            const data = Array.isArray(response.data)
                ? response.data
                : [];

            const sortedExercises = [...data].sort(
                (a, b) =>
                    getExerciseOrder(a) -
                    getExerciseOrder(b)
            );

            if (sortedExercises.length === 0) {
                setLoadError(
                    "This workout plan does not contain any exercises."
                );
                return;
            }

            setExercises(sortedExercises);

            const firstExercise =
                sortedExercises[0];

            setTimeLeft(
                getDuration(firstExercise)
            );

            setMode("exercise");
            setCurrentIndex(0);
            setIsRunning(false);
            setCompleted(false);
            setSavedSession(null);

            completionHandledRef.current = false;
            workoutStartTimeRef.current = null;
        } catch (requestError) {
            console.error(
                "Error loading workout exercises:",
                requestError
            );

            if (
                requestError.response?.status === 401
            ) {
                setLoadError(
                    "Your session has expired. Please login again."
                );
            } else {
                const backendMessage =
                    requestError.response?.data?.message ||
                    requestError.response?.data?.error;

                setLoadError(
                    backendMessage ||
                        "Unable to load workout exercises."
                );
            }
        } finally {
            setLoading(false);
        }
    }, [planId]);

    useEffect(() => {
        loadExercises();

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [loadExercises]);

    // =====================================================
    // WORKOUT CONTROLS
    // =====================================================

    const startWorkout = () => {
        if (!workoutStartTimeRef.current) {
            workoutStartTimeRef.current =
                Date.now();
        }

        setIsRunning(true);
    };

    const pauseWorkout = () => {
        setIsRunning(false);
    };

    const moveToNextExercise = useCallback(() => {
        if (
            currentIndex >=
            exercises.length - 1
        ) {
            setIsRunning(false);
            setMode("completed");
            setCompleted(true);
            return;
        }

        const nextIndex =
            currentIndex + 1;

        const nextExercise =
            exercises[nextIndex];

        setCurrentIndex(nextIndex);
        setMode("exercise");
        setTimeLeft(
            getDuration(nextExercise)
        );
        setIsRunning(true);

        setSetError("");

        setSetForm({
            reps: "",
            weight: "0",
            rpe: ""
        });
    }, [currentIndex, exercises]);

    const startRest = useCallback(() => {
        if (!currentExercise) {
            return;
        }

        const restSeconds =
            getRest(currentExercise);

        if (restSeconds <= 0) {
            moveToNextExercise();
            return;
        }

        setMode("rest");
        setTimeLeft(restSeconds);
        setIsRunning(true);
    }, [
        currentExercise,
        moveToNextExercise
    ]);

    // =====================================================
    // TIMER
    // =====================================================

    useEffect(() => {
        if (
            !isRunning ||
            mode === "completed"
        ) {
            return;
        }

        timerRef.current =
            setInterval(() => {
                setTimeLeft((previous) => {
                    if (previous > 1) {
                        return previous - 1;
                    }

                    clearInterval(
                        timerRef.current
                    );

                    if (
                        mode === "exercise"
                    ) {
                        const restSeconds =
                            getRest(
                                currentExercise
                            );

                        if (restSeconds > 0) {
                            setMode("rest");
                            setIsRunning(true);

                            return restSeconds;
                        }

                        setTimeout(() => {
                            moveToNextExercise();
                        }, 0);

                        return 0;
                    }

                    if (mode === "rest") {
                        setTimeout(() => {
                            moveToNextExercise();
                        }, 0);

                        return 0;
                    }

                    return 0;
                });
            }, 1000);

        return () => {
            clearInterval(
                timerRef.current
            );
        };
    }, [
        isRunning,
        mode,
        currentExercise,
        moveToNextExercise
    ]);

    const skipExercise = () => {
        if (!currentExercise) {
            return;
        }

        setIsRunning(false);

        if (mode === "rest") {
            moveToNextExercise();
            return;
        }

        const restSeconds =
            getRest(currentExercise);

        if (restSeconds > 0) {
            setMode("rest");
            setTimeLeft(restSeconds);
            setIsRunning(true);
        } else {
            moveToNextExercise();
        }
    };

    // =====================================================
    // SET TRACKING
    // =====================================================

    const addSet = () => {
        setSetError("");

        const reps =
            Number(setForm.reps);

        const weight =
            setForm.weight === ""
                ? 0
                : Number(setForm.weight);

        const rpe =
            setForm.rpe === ""
                ? null
                : Number(setForm.rpe);

        if (
            !Number.isFinite(reps) ||
            reps <= 0
        ) {
            setSetError(
                "Please enter valid reps before adding the set."
            );
            return;
        }

        if (
            !Number.isFinite(weight) ||
            weight < 0
        ) {
            setSetError(
                "Please enter a valid weight. Use 0 for bodyweight exercises."
            );
            return;
        }

        if (
            rpe !== null &&
            (
                !Number.isFinite(rpe) ||
                rpe < 0 ||
                rpe > 10
            )
        ) {
            setSetError(
                "RPE must be between 0 and 10."
            );
            return;
        }

        if (!currentExerciseId) {
            setSetError(
                "Unable to identify the current exercise."
            );
            return;
        }

        const nextSetNumber =
            currentExerciseSets.length + 1;

        const newSet = {
            exerciseId:
                currentExerciseId,

            exerciseName:
                getExerciseName(
                    currentExercise
                ),

            category:
                getCategory(
                    currentExercise
                ),

            setNumber:
                nextSetNumber,

            weight,
            reps,
            rpe,

            volume:
                weight * reps
        };

        setExerciseSets(
            (previous) => ({
                ...previous,

                [currentExerciseId]: [
                    ...(previous[
                        currentExerciseId
                    ] || []),
                    newSet
                ]
            })
        );

        setSetForm({
            reps: "",
            weight: "0",
            rpe: ""
        });

        setSetError("");
    };

    const removeSet = (
        setNumber
    ) => {
        if (!currentExerciseId) {
            return;
        }

        setExerciseSets(
            (previous) => {
                const existing =
                    previous[
                        currentExerciseId
                    ] || [];

                const remaining =
                    existing
                        .filter(
                            (set) =>
                                set.setNumber !==
                                setNumber
                        )
                        .map(
                            (
                                set,
                                index
                            ) => ({
                                ...set,
                                setNumber:
                                    index + 1
                            })
                        );

                return {
                    ...previous,

                    [currentExerciseId]:
                        remaining
                };
            }
        );
    };

    // =====================================================
    // SAVE WORKOUT
    // =====================================================

    const saveWorkout = async () => {
        if (
            completionHandledRef.current ||
            saving
        ) {
            return;
        }

        completionHandledRef.current =
            true;

        setSaving(true);
        setSaveError("");

        try {
            const elapsedMinutes =
                workoutStartTimeRef.current
                    ? Math.max(
                          1,
                          Math.round(
                              (
                                  Date.now() -
                                  workoutStartTimeRef.current
                              ) /
                                  60000
                          )
                      )
                    : 1;

            const sets =
                Object.values(
                    exerciseSets
                )
                    .flat()
                    .map((set) => ({
                        exerciseId:
                            set.exerciseId,

                        exerciseName:
                            set.exerciseName,

                        category:
                            set.category,

                        setNumber:
                            set.setNumber,

                        weight:
                            Number(
                                set.weight
                            ) || 0,

                        reps:
                            Number(
                                set.reps
                            ) || 0,

                        rpe:
                            set.rpe ===
                                null ||
                            set.rpe === ""
                                ? null
                                : Number(
                                      set.rpe
                                  ),

                        volume:
                            Number(
                                set.volume
                            ) || 0
                    }));

            const payload = {
                workoutDate:
                    new Date()
                        .toISOString()
                        .split("T")[0],

                notes:
                    `Completed workout plan: ${planId}`,

                durationMinutes:
                    elapsedMinutes,

                sets
            };

            const response =
                await api.post(
                    "/workout-sessions",
                    payload
                );

            setSavedSession(
                response.data || null
            );

            setCompleted(true);
            setMode("completed");
        } catch (requestError) {
            console.error(
                "Error saving workout session:",
                requestError
            );

            completionHandledRef.current =
                false;

            if (
                requestError.response?.status ===
                401
            ) {
                setSaveError(
                    "Your session has expired. Please login again."
                );
            } else {
                const backendMessage =
                    requestError.response?.data?.message ||
                    requestError.response?.data?.error;

                setSaveError(
                    backendMessage ||
                        "Unable to save the completed workout."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (
            completed &&
            mode === "completed"
        ) {
            saveWorkout();
        }

        // Completion should trigger save only once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [completed, mode]);

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div
    className="wt-workout-player-page"
    style={styles.centerPage}
>
                <div style={styles.loadingIcon}>
                    🏋️
                </div>

                <h2 style={styles.centerTitle}>
                    Loading Workout...
                </h2>

                <p style={styles.centerText}>
                    Preparing your exercises.
                </p>
            </div>
        );
    }

    // =====================================================
    // LOAD ERROR
    // =====================================================

    if (loadError) {
        return (
            <div style={styles.centerPage}>
                <div style={styles.errorIcon}>
                    !
                </div>

                <h2 style={styles.centerTitle}>
                    Unable to load workout
                </h2>

                <p style={styles.errorText}>
                    {loadError}
                </p>

                <p style={styles.planId}>
                    Plan ID: {planId}
                </p>

                <div style={styles.buttonRow}>
                    <button
                        type="button"
                        onClick={
                            loadExercises
                        }
                        style={
                            styles.primaryButton
                        }
                    >
                        Try Again
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/workout-plans"
                            )
                        }
                        style={
                            styles.secondaryButton
                        }
                    >
                        Back to Plans
                    </button>
                </div>
            </div>
        );
    }

    // =====================================================
    // NO EXERCISE
    // =====================================================

    if (
        !currentExercise &&
        mode !== "completed"
    ) {
        return (
            <div style={styles.centerPage}>
                <h2 style={styles.centerTitle}>
                    No workout exercise available
                </h2>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/workout-plans"
                        )
                    }
                    style={
                        styles.primaryButton
                    }
                >
                    Back to Plans
                </button>
            </div>
        );
    }

    // =====================================================
    // COMPLETED
    // =====================================================

   if (mode === "completed") {
    return (
        <div
            className="wt-workout-player-page"
            style={styles.page}
        >
                <div style={styles.container}>
                    <div
                        style={
                            styles.completedCard
                        }
                    >
                        <div
                            style={
                                styles.completedIcon
                            }
                        >
                            ✓
                        </div>

                        <h1
                            style={
                                styles.completedTitle
                            }
                        >
                            Workout Completed!
                        </h1>

                        <p
                            style={
                                styles.completedText
                            }
                        >
                            Great job. Your workout
                            has been completed.
                        </p>

                        <div
                            style={
                                styles.summaryGrid
                            }
                        >
                            <div
                                style={
                                    styles.summaryCard
                                }
                            >
                                <strong>
                                    {
                                        exercises.length
                                    }
                                </strong>

                                <span>
                                    Exercises
                                </span>
                            </div>

                            <div
                                style={
                                    styles.summaryCard
                                }
                            >
                                <strong>
                                    {totalSets}
                                </strong>

                                <span>
                                    Sets
                                </span>
                            </div>

                            <div
                                style={
                                    styles.summaryCard
                                }
                            >
                                <strong>
                                    {totalVolume.toFixed(
                                        2
                                    )}
                                </strong>

                                <span>
                                    Volume
                                </span>
                            </div>
                        </div>

                        {saving && (
                            <p
                                style={
                                    styles.savingText
                                }
                            >
                                Saving workout
                                session...
                            </p>
                        )}

                        {saveError && (
                            <div
                                style={
                                    styles.saveError
                                }
                            >
                                <div>
                                    {saveError}
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        saveWorkout
                                    }
                                    style={
                                        styles.retryButton
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Retry Save
                                </button>
                            </div>
                        )}

                        {!saving &&
                            !saveError &&
                            savedSession && (
                                <div
                                    style={
                                        styles.successMessage
                                    }
                                >
                                    ✓ Workout session
                                    saved successfully.
                                </div>
                            )}

                        <div
                            style={
                                styles.buttonRow
                            }
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/workout-history"
                                    )
                                }
                                style={
                                    styles.primaryButton
                                }
                            >
                                View Workout History
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/workout-plans"
                                    )
                                }
                                style={
                                    styles.secondaryButton
                                }
                            >
                                Back to Plans
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const exerciseName =
        getExerciseName(
            currentExercise
        );

    const category =
        getCategory(currentExercise);

    const equipment =
        getEquipment(currentExercise);

    const duration =
        getDuration(currentExercise);

    const rest =
        getRest(currentExercise);

    // =====================================================
    // PLAYER
    // =====================================================

    return (
        <div style={styles.page}>
            <div style={styles.container}>

                {/* HEADER */}

                <header style={styles.header}>
                    <div>
                        <div style={styles.eyebrow}>
                            WORKOUT PLAYER
                        </div>

                        <h1 style={styles.title}>
                            Workout Plan #{planId}
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/workout-plans"
                            )
                        }
                        style={
                            styles.exitButton
                        }
                    >
                        Exit Workout
                    </button>
                </header>

                {/* PROGRESS */}

                <section
                    style={
                        styles.progressCard
                    }
                >
                    <div
                        style={
                            styles.progressHeader
                        }
                    >
                        <span>
                            Exercise{" "}
                            {currentIndex + 1}{" "}
                            of{" "}
                            {exercises.length}
                        </span>

                        <strong>
                            {Math.round(
                                progressPercentage
                            )}
                            %
                        </strong>
                    </div>

                    <div
                        style={
                            styles.progressTrack
                        }
                    >
                        <div
                            style={{
                                ...styles.progressFill,
                                width: `${progressPercentage}%`
                            }}
                        />
                    </div>
                </section>

                {/* PLAYER */}

                <section
                    style={
                        styles.playerCard
                    }
                >
                    <div
                        style={
                            styles.exerciseHeader
                        }
                    >
                        <div>
                            <span
                                style={{
                                    ...styles.modeBadge,
                                    ...(mode ===
                                    "rest"
                                        ? styles.restBadge
                                        : {})
                                }}
                            >
                                {mode === "rest"
                                    ? "REST"
                                    : "EXERCISE"}
                            </span>

                            <h2
                                style={
                                    styles.exerciseTitle
                                }
                            >
                                {mode === "rest"
                                    ? "Take a Rest"
                                    : exerciseName}
                            </h2>

                            {mode ===
                                "exercise" && (
                                <div
                                    style={
                                        styles.metaRow
                                    }
                                >
                                    <span
                                        style={
                                            styles.metaBadge
                                        }
                                    >
                                        {category}
                                    </span>

                                    <span
                                        style={
                                            styles.metaBadge
                                        }
                                    >
                                        {equipment}
                                    </span>

                                    <span
                                        style={
                                            styles.metaBadge
                                        }
                                    >
                                        {duration}s
                                    </span>

                                    <span
                                        style={
                                            styles.metaBadge
                                        }
                                    >
                                        {rest}s rest
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TIMER */}

                    <div
                        style={
                            styles.timerCircle
                        }
                    >
                        <div
                            style={
                                styles.timerLabel
                            }
                        >
                            {mode === "rest"
                                ? "REST"
                                : "TIME"}
                        </div>

                        <div
                            style={
                                styles.timerValue
                            }
                        >
                            {formatTime(
                                timeLeft
                            )}
                        </div>
                    </div>

                    {/* CONTROLS */}

                    <div
                        style={
                            styles.controls
                        }
                    >
                        {!isRunning ? (
                            <button
                                type="button"
                                onClick={
                                    startWorkout
                                }
                                style={
                                    styles.primaryButton
                                }
                            >
                                ▶ Start
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={
                                    pauseWorkout
                                }
                                style={
                                    styles.warningButton
                                }
                            >
                                ❚❚ Pause
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={
                                skipExercise
                            }
                            style={
                                styles.secondaryButton
                            }
                        >
                            Skip →
                        </button>
                    </div>
                </section>

                {/* SET TRACKING */}

                {mode === "exercise" && (
                    <section
                        style={
                            styles.setTrackingCard
                        }
                    >
                        <div
                            style={
                                styles.sectionHeader
                            }
                        >
                            <div>
                                <span
                                    style={
                                        styles.eyebrow
                                    }
                                >
                                    SET TRACKING
                                </span>

                                <h3
                                    style={
                                        styles.sectionTitle
                                    }
                                >
                                    Record Your Set
                                </h3>
                            </div>

                            <span
                                style={
                                    styles.setCount
                                }
                            >
                                {
                                    currentExerciseSets.length
                                }{" "}
                                sets
                            </span>
                        </div>

                        {setError && (
                            <div
                                style={
                                    styles.validationError
                                }
                            >
                                {setError}
                            </div>
                        )}

                        <div
                            style={
                                styles.formGrid
                            }
                        >
                            <label
                                style={
                                    styles.field
                                }
                            >
                                <span>
                                    Reps *
                                </span>

                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={
                                        setForm.reps
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSetForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                reps:
                                                    event
                                                        .target
                                                        .value
                                            })
                                        )
                                    }
                                    placeholder="e.g. 15"
                                    style={
                                        styles.input
                                    }
                                />
                            </label>

                            <label
                                style={
                                    styles.field
                                }
                            >
                                <span>
                                    Weight (kg)
                                </span>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={
                                        setForm.weight
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSetForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                weight:
                                                    event
                                                        .target
                                                        .value
                                            })
                                        )
                                    }
                                    placeholder="0 for bodyweight"
                                    style={
                                        styles.input
                                    }
                                />
                            </label>

                            <label
                                style={
                                    styles.field
                                }
                            >
                                <span>
                                    RPE (0–10)
                                </span>

                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    value={
                                        setForm.rpe
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSetForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                rpe:
                                                    event
                                                        .target
                                                        .value
                                            })
                                        )
                                    }
                                    placeholder="Optional"
                                    style={
                                        styles.input
                                    }
                                />
                            </label>

                            <button
                                type="button"
                                onClick={addSet}
                                style={
                                    styles.addSetButton
                                }
                            >
                                + Add Set
                            </button>
                        </div>

                        {/* SET LIST */}

                        {currentExerciseSets.length >
                            0 && (
                            <div
                                style={
                                    styles.setList
                                }
                            >
                                <div
                                    style={
                                        styles.setListHeader
                                    }
                                >
                                    <span>
                                        Set
                                    </span>

                                    <span>
                                        Reps
                                    </span>

                                    <span>
                                        Weight
                                    </span>

                                    <span>
                                        RPE
                                    </span>

                                    <span>
                                        Volume
                                    </span>

                                    <span />
                                </div>

                                {currentExerciseSets.map(
                                    (set) => (
                                        <div
                                            key={`${currentExerciseId}-${set.setNumber}`}
                                            style={
                                                styles.setRow
                                            }
                                        >
                                            <span>
                                                #
                                                {
                                                    set.setNumber
                                                }
                                            </span>

                                            <span>
                                                {
                                                    set.reps
                                                }
                                            </span>

                                            <span>
                                                {Number(
                                                    set.weight
                                                ).toFixed(
                                                    1
                                                )}{" "}
                                                kg
                                            </span>

                                            <span>
                                                {set.rpe ??
                                                    "—"}
                                            </span>

                                            <span>
                                                {Number(
                                                    set.volume
                                                ).toFixed(
                                                    1
                                                )}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeSet(
                                                        set.setNumber
                                                    )
                                                }
                                                style={
                                                    styles.removeButton
                                                }
                                                title="Remove set"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        )}

                        <div
                            style={
                                styles.trackingNote
                            }
                        >
                            Bodyweight exercises can
                            use{" "}
                            <strong>
                                0 kg
                            </strong>
                            . Volume is calculated
                            as weight × reps.
                        </div>
                    </section>
                )}

                {saveError &&
                    mode !== "completed" && (
                        <div
                            style={
                                styles.saveError
                            }
                        >
                            {saveError}
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
        padding: "30px 20px",
        boxSizing: "border-box"
    },

    container: {
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto"
    },

    centerPage: {
        minHeight: "calc(100vh - 70px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "30px",
        boxSizing: "border-box",
        backgroundColor:
            "var(--wt-page-background)",
        color:
            "var(--wt-text-primary)"
    },

    centerTitle: {
        color:
            "var(--wt-text-primary)",
        margin: "10px 0"
    },

    centerText: {
        color:
            "var(--wt-text-secondary)"
    },

    loadingIcon: {
        fontSize: "60px",
        marginBottom: "15px"
    },

    errorIcon: {
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        backgroundColor:
            "var(--wt-danger-soft, #fee2e2)",
        color:
            "var(--wt-danger, #dc2626)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "30px",
        fontWeight: "800",
        marginBottom: "20px"
    },

    errorText: {
        maxWidth: "650px",
        color:
            "var(--wt-danger, #dc2626)",
        lineHeight: 1.6
    },

    planId: {
        color:
            "var(--wt-text-muted)"
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        marginBottom: "25px",
        flexWrap: "wrap"
    },

    eyebrow: {
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "2px",
        color:
            "var(--wt-accent)",
        marginBottom: "6px"
    },

    title: {
        margin: 0,
        fontSize: "32px",
        color:
            "var(--wt-text-primary)"
    },

    exitButton: {
        border:
            "1px solid var(--wt-border)",
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)",
        borderRadius: "10px",
        padding: "10px 16px",
        cursor: "pointer",
        fontWeight: "700"
    },

    progressCard: {
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "16px",
        padding: "18px",
        marginBottom: "20px",
        boxShadow:
            "var(--wt-shadow)"
    },

    progressHeader: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "10px",
        color:
            "var(--wt-text-secondary)"
    },

    progressTrack: {
        height: "8px",
        borderRadius: "999px",
        backgroundColor:
            "var(--wt-surface-tertiary)",
        overflow: "hidden"
    },

    progressFill: {
        height: "100%",
        borderRadius: "999px",
        backgroundColor:
            "var(--wt-accent)",
        transition: "width 0.3s ease"
    },

    playerCard: {
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "20px",
        padding: "35px",
        marginBottom: "20px",
        textAlign: "center",
        boxShadow:
            "var(--wt-shadow)"
    },

    exerciseHeader: {
        textAlign: "left"
    },

    modeBadge: {
        display: "inline-block",
        backgroundColor:
            "var(--wt-accent-soft)",
        color:
            "var(--wt-accent)",
        padding: "6px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "1px"
    },

    restBadge: {
        backgroundColor:
            "var(--wt-warning-soft, #fef3c7)",
        color:
            "var(--wt-warning, #b45309)"
    },

    exerciseTitle: {
        fontSize: "36px",
        margin: "12px 0",
        color:
            "var(--wt-text-primary)"
    },

    metaRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px"
    },

    metaBadge: {
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: "999px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        border:
            "1px solid var(--wt-border)",
        color:
            "var(--wt-text-secondary)",
        fontSize: "12px",
        fontWeight: "600"
    },

    timerCircle: {
        width: "230px",
        height: "230px",
        borderRadius: "50%",
        border:
            "10px solid var(--wt-accent)",
        margin: "35px auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
            "var(--wt-surface-secondary)",
        boxShadow:
            "var(--wt-shadow)"
    },

    timerLabel: {
        color:
            "var(--wt-text-muted)",
        fontSize: "13px",
        letterSpacing: "2px",
        fontWeight: "800"
    },

    timerValue: {
        color:
            "var(--wt-text-primary)",
        fontSize: "48px",
        fontWeight: "800",
        marginTop: "8px",
        fontVariantNumeric:
            "tabular-nums"
    },

    controls: {
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        flexWrap: "wrap"
    },

    primaryButton: {
        border: "none",
        backgroundColor:
            "var(--wt-accent)",
        color: "#ffffff",
        borderRadius: "10px",
        padding: "12px 20px",
        fontWeight: "700",
        cursor: "pointer"
    },

    secondaryButton: {
        border:
            "1px solid var(--wt-border)",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-primary)",
        borderRadius: "10px",
        padding: "12px 20px",
        fontWeight: "700",
        cursor: "pointer"
    },

    warningButton: {
        border: "none",
        backgroundColor:
            "var(--wt-warning, #d97706)",
        color: "#ffffff",
        borderRadius: "10px",
        padding: "12px 20px",
        fontWeight: "700",
        cursor: "pointer"
    },

    setTrackingCard: {
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "20px",
        padding: "25px",
        boxShadow:
            "var(--wt-shadow)"
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "20px",
        flexWrap: "wrap"
    },

    sectionTitle: {
        margin: 0,
        fontSize: "24px",
        color:
            "var(--wt-text-primary)"
    },

    setCount: {
        color:
            "var(--wt-accent)",
        backgroundColor:
            "var(--wt-accent-soft)",
        padding: "8px 12px",
        borderRadius: "999px",
        fontSize: "13px",
        fontWeight: "700"
    },

    validationError: {
        backgroundColor:
            "var(--wt-danger-soft, #fee2e2)",
        border:
            "1px solid var(--wt-danger, #dc2626)",
        color:
            "var(--wt-danger, #dc2626)",
        borderRadius: "10px",
        padding: "12px 14px",
        marginBottom: "18px"
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "14px",
        alignItems: "end"
    },

    field: {
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        color:
            "var(--wt-text-secondary)",
        fontSize: "13px",
        fontWeight: "700"
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        backgroundColor:
            "var(--wt-input-background)",
        color:
            "var(--wt-input-text)",
        border:
            "1px solid var(--wt-input-border)",
        borderRadius: "9px",
        padding: "12px",
        outline: "none",
        fontSize: "14px"
    },

    addSetButton: {
        minHeight: "44px",
        border: "none",
        backgroundColor:
            "var(--wt-success, #16a34a)",
        color: "#ffffff",
        borderRadius: "9px",
        padding: "12px 16px",
        fontWeight: "800",
        cursor: "pointer"
    },

    setList: {
        marginTop: "25px",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "12px",
        overflow: "hidden"
    },

    setListHeader: {
        display: "grid",
        gridTemplateColumns:
            "0.7fr 1fr 1fr 1fr 1fr 40px",
        gap: "10px",
        padding: "12px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-muted)",
        fontSize: "12px",
        fontWeight: "800"
    },

    setRow: {
        display: "grid",
        gridTemplateColumns:
            "0.7fr 1fr 1fr 1fr 1fr 40px",
        gap: "10px",
        alignItems: "center",
        padding: "13px 12px",
        borderTop:
            "1px solid var(--wt-border)",
        color:
            "var(--wt-text-primary)"
    },

    removeButton: {
        width: "30px",
        height: "30px",
        border: "none",
        borderRadius: "7px",
        backgroundColor:
            "var(--wt-danger-soft, #fee2e2)",
        color:
            "var(--wt-danger, #dc2626)",
        fontSize: "18px",
        cursor: "pointer"
    },

    trackingNote: {
        marginTop: "15px",
        color:
            "var(--wt-text-muted)",
        fontSize: "13px",
        lineHeight: 1.5
    },

    completedCard: {
        maxWidth: "700px",
        margin: "80px auto",
        textAlign: "center",
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "24px",
        padding: "45px 30px",
        boxShadow:
            "var(--wt-shadow)"
    },

    completedIcon: {
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        backgroundColor:
            "var(--wt-success-soft, #dcfce7)",
        color:
            "var(--wt-success, #16a34a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "42px",
        fontWeight: "800",
        margin: "0 auto 20px"
    },

    completedTitle: {
        color:
            "var(--wt-text-primary)",
        marginBottom: "10px"
    },

    completedText: {
        color:
            "var(--wt-text-secondary)",
        marginBottom: "30px"
    },

    summaryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "12px",
        marginBottom: "25px"
    },

    summaryCard: {
        backgroundColor:
            "var(--wt-surface-secondary)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "12px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        color:
            "var(--wt-text-primary)"
    },

    savingText: {
        color:
            "var(--wt-accent)",
        marginBottom: "15px"
    },

    successMessage: {
        backgroundColor:
            "var(--wt-success-soft, #dcfce7)",
        border:
            "1px solid var(--wt-success, #16a34a)",
        color:
            "var(--wt-success, #15803d)",
        borderRadius: "10px",
        padding: "12px",
        marginBottom: "20px"
    },

    saveError: {
        backgroundColor:
            "var(--wt-danger-soft, #fee2e2)",
        border:
            "1px solid var(--wt-danger, #dc2626)",
        color:
            "var(--wt-danger, #dc2626)",
        borderRadius: "10px",
        padding: "14px",
        marginTop: "15px",
        marginBottom: "15px"
    },

    retryButton: {
        marginLeft: "12px",
        border:
            "1px solid var(--wt-danger, #dc2626)",
        backgroundColor: "transparent",
        color:
            "var(--wt-danger, #dc2626)",
        borderRadius: "7px",
        padding: "7px 12px",
        cursor: "pointer"
    },

    buttonRow: {
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "20px"
    }
};

export default WorkoutPlayer;