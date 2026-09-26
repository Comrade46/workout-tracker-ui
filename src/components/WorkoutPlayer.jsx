import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosConfig";
import ExerciseImage from "./ExerciseImage";
import ExerciseHowTo from "./ExerciseHowTo";
import {
    beep,
    describeTarget,
    isSoundOn,
    keepScreenOn,
    setSoundOn,
    speak,
    unlockAudio,
    vibrate
} from "../coach/workoutCoach";
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

function getTrackingType(exercise) {
    const value =
        exercise?.trackingType ??
        exercise?.tracking_type ??
        exercise?.exercise?.trackingType ??
        "TIME";

    return String(value).toUpperCase() === "REPS"
        ? "REPS"
        : "TIME";
}

function getTargetValue(exercise) {
    const value = Number(
        exercise?.targetValue ??
        exercise?.target_value ??
        exercise?.durationSeconds ??
        exercise?.duration ??
        30
    );

    return Math.max(1, Number.isFinite(value) ? value : 30);
}

function getTargetSets(exercise) {
    const value = Number(
        exercise?.targetSets ??
        exercise?.target_sets ??
        1
    );

    return Math.max(1, Number.isFinite(value) ? value : 1);
}

function getDuration(exercise) {
    return getTrackingType(exercise) === "TIME"
        ? getTargetValue(exercise)
        : 0;
}

function getRest(exercise) {
    const value = Number(
        exercise?.restSeconds ??
        exercise?.rest ??
        exercise?.exercise?.restSeconds ??
        15
    );

    return Math.max(
        0,
        Number.isFinite(value) ? value : 15
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

    const [currentSetNumber, setCurrentSetNumber] = useState(1);

    const workoutStartTimeRef = useRef(null);

    // ---------- Coach (voice, beeps, countdown, screen on) ----------
    const [soundOn, setSoundOnState] = useState(isSoundOn());

    // 3-2-1 "Get ready" before a timed exercise starts (null = none)
    const [countdown, setCountdown] = useState(null);

    // True once the user pressed Start for the first time
    const [workoutActive, setWorkoutActive] = useState(false);

    // Index of the exercise the coach last announced
    const announcedIndexRef = useRef(-1);

    const completionHandledRef = useRef(false);

    const timerRef = useRef(null);

    const currentExercise =
        exercises[currentIndex] || null;

    const currentExerciseId = useMemo(
        () => getExerciseId(currentExercise),
        [currentExercise]
    );

    const currentTrackingType = useMemo(
        () => getTrackingType(currentExercise),
        [currentExercise]
    );

    const currentTargetValue = useMemo(
        () => getTargetValue(currentExercise),
        [currentExercise]
    );

    const currentTargetSets = useMemo(
        () => getTargetSets(currentExercise),
        [currentExercise]
    );

    const currentExerciseSets = useMemo(() => {
        if (!currentExerciseId) {
            return [];
        }

        return (
            exerciseSets[currentExerciseId] || []
        );
    }, [
        exerciseSets,
        currentExerciseId
    ]);

    const totalSets = useMemo(() => {
        return Object.values(exerciseSets).reduce(
            (total, sets) =>
                total + sets.length,
            0
        );
    }, [exerciseSets]);

    const totalVolume = useMemo(() => {
        return Object.values(exerciseSets)
            .flat()
            .reduce(
                (total, set) =>
                    total +
                    Number(set.volume || 0),
                0
            );
    }, [exerciseSets]);

    const totalDuration = useMemo(() => {
        return Object.values(exerciseSets)
            .flat()
            .reduce(
                (total, set) =>
                    total +
                    Number(
                        set.durationSeconds || 0
                    ),
                0
            );
    }, [exerciseSets]);

    const progressPercentage =
        exercises.length === 0
            ? 0
            : ((currentIndex + 1) /
                  exercises.length) *
              100;

    // =====================================================
    // LOAD WORKOUT
    // =====================================================

    const loadExercises =
        useCallback(async () => {
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

                const response =
                    await api.get(
                        `/workout-plan-exercises/workout-plans/${planId}/exercises`
                    );

                const responseData =
                    Array.isArray(response.data)
                        ? response.data
                        : [];

                const sortedExercises =
                    [...responseData].sort(
                        (a, b) =>
                            getExerciseOrder(a) -
                            getExerciseOrder(b)
                    );

                if (
                    sortedExercises.length === 0
                ) {
                    setLoadError(
                        "This workout plan does not contain any exercises."
                    );
                    return;
                }

                setExercises(
                    sortedExercises
                );

                const firstExercise =
                    sortedExercises[0];

                setCurrentIndex(0);

                setMode("exercise");

                setTimeLeft(
                    getDuration(
                        firstExercise
                    )
                );

                setIsRunning(false);

                setExerciseSets({});

                setCurrentSetNumber(1);

                setSetForm({
                    reps: "",
                    weight: "0",
                    rpe: ""
                });

                setCompleted(false);

                setSavedSession(null);

                completionHandledRef.current =
                    false;

                workoutStartTimeRef.current =
                    null;
            } catch (requestError) {
                console.error(
                    "Error loading workout exercises:",
                    requestError
                );

                if (
                    requestError.response
                        ?.status === 401
                ) {
                    setLoadError(
                        "Your session has expired. Please login again."
                    );
                } else {
                    const backendMessage =
                        requestError.response
                            ?.data?.message ||
                        requestError.response
                            ?.data?.error;

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
                clearInterval(
                    timerRef.current
                );
            }
        };
    }, [loadExercises]);

    // =====================================================
    // ADD TIME SET
    // =====================================================

    const addTimeSet =
        useCallback(() => {
            if (!currentExerciseId) {
                return;
            }

            const targetDuration =
                currentTargetValue;

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
                    currentSetNumber,

                weight: 0,

                reps: 0,

                rpe: null,

                durationSeconds:
                    targetDuration,

                volume: 0
            };

            setExerciseSets(
                previous => ({
                    ...previous,

                    [currentExerciseId]: [
                        ...(previous[
                            currentExerciseId
                        ] || []),
                        newSet
                    ]
                })
            );

            return newSet;
        }, [
            currentExercise,
            currentExerciseId,
            currentSetNumber,
            currentTargetValue
        ]);

    // =====================================================
    // COMPLETE CURRENT TIME SET
    // =====================================================

    const completeTimeSet =
        useCallback(() => {
            if (
                !currentExercise ||
                !currentExerciseId
            ) {
                return;
            }

            addTimeSet();

            const completedSetsCount =
                currentExerciseSets.length +
                1;

            setIsRunning(false);

            if (
                completedSetsCount >=
                currentTargetSets
            ) {
                const restSeconds =
                    getRest(
                        currentExercise
                    );

                if (restSeconds > 0) {
                    setMode("rest");
                    setTimeLeft(
                        restSeconds
                    );
                    setIsRunning(true);
                } else {
                    if (
                        currentIndex >=
                        exercises.length - 1
                    ) {
                        setMode(
                            "completed"
                        );
                        setCompleted(
                            true
                        );
                    } else {
                        setTimeout(() => {
                            moveToNextExercise();
                        }, 0);
                    }
                }

                return;
            }

            setCurrentSetNumber(
                completedSetsCount + 1
            );

            setTimeLeft(
                currentTargetValue
            );

            setMode("exercise");

            setIsRunning(true);
        }, [
            currentExercise,
            currentExerciseId,
            addTimeSet,
            currentExerciseSets.length,
            currentTargetSets,
            currentIndex,
            exercises.length,
            currentTargetValue
        ]);

    // =====================================================
    // MOVE TO NEXT EXERCISE
    // =====================================================

    const moveToNextExercise =
        useCallback(() => {
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

            setCurrentIndex(
                nextIndex
            );

            setMode("exercise");

            setCurrentSetNumber(1);

            setTimeLeft(
                getDuration(
                    nextExercise
                )
            );

            setIsRunning(false);

            setSetError("");

            setSetForm({
                reps: "",
                weight: "0",
                rpe: ""
            });
        }, [
            currentIndex,
            exercises
        ]);

    // =====================================================
    // START REST
    // =====================================================

    const startRest =
        useCallback(() => {
            if (!currentExercise) {
                return;
            }

            const restSeconds =
                getRest(
                    currentExercise
                );

            if (restSeconds <= 0) {
                moveToNextExercise();
                return;
            }

            setMode("rest");

            setTimeLeft(
                restSeconds
            );

            setIsRunning(true);
        }, [
            currentExercise,
            moveToNextExercise
        ]);

    // =====================================================
    // START WORKOUT
    // =====================================================

    const startWorkout = () => {
        // Phones only allow sound after a tap: unlock it here.
        unlockAudio();

        if (
            !workoutStartTimeRef.current
        ) {
            workoutStartTimeRef.current =
                Date.now();
        }

        setWorkoutActive(true);
        setMode("exercise");

        // Announce the exercise if the coach has not done so yet
        // (the first exercise, before Start was pressed).
        if (announcedIndexRef.current !== currentIndex && currentExercise) {
            announcedIndexRef.current = currentIndex;

            speak(
                `${getExerciseName(currentExercise)}. ` +
                describeTarget(
                    currentTrackingType,
                    currentTargetValue,
                    currentTargetSets
                )
            );
        }

        // Timed exercises get a 3-2-1 "Get ready" first.
        if (currentTrackingType === "TIME") {
            setCountdown(3);
            return;
        }

        setIsRunning(true);
    };

    // =====================================================
    // PAUSE WORKOUT
    // =====================================================

    const pauseWorkout = () => {
        setIsRunning(false);
    };

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

        if (
            mode === "exercise" &&
            currentTrackingType ===
                "REPS"
        ) {
            return;
        }

        timerRef.current =
            setInterval(() => {
                setTimeLeft(
                    previous => {
                        if (
                            previous > 1
                        ) {
                            return (
                                previous - 1
                            );
                        }

                        clearInterval(
                            timerRef.current
                        );

                        if (
                            mode ===
                                "exercise" &&
                            currentTrackingType ===
                                "TIME"
                        ) {
                            setTimeout(
                                () => {
                                    completeTimeSet();
                                },
                                0
                            );

                            return 0;
                        }

                        if (
                            mode ===
                            "rest"
                        ) {
                            setTimeout(
                                () => {
                                    moveToNextExercise();
                                },
                                0
                            );

                            return 0;
                        }

                        return 0;
                    }
                );
            }, 1000);

        return () => {
            clearInterval(
                timerRef.current
            );
        };
    }, [
        isRunning,
        mode,
        currentTrackingType,
        completeTimeSet,
        moveToNextExercise
    ]);

    // =====================================================
    // SKIP EXERCISE
    // =====================================================

    const skipExercise = () => {
        if (!currentExercise) {
            return;
        }

        activateCoach();

        setIsRunning(false);

        if (mode === "rest") {
            moveToNextExercise();
            return;
        }

        const restSeconds =
            getRest(
                currentExercise
            );

        if (restSeconds > 0) {
            setMode("rest");
            setTimeLeft(
                restSeconds
            );
            setIsRunning(true);
        } else {
            moveToNextExercise();
        }
    };

    // =====================================================
    // ADD REPS SET
    // =====================================================

    // The coach starts with the user's first action (Start, Skip,
    // Continue or logging a set). Phones need that tap to allow sound.
    const activateCoach = () => {
        unlockAudio();

        if (!workoutStartTimeRef.current) {
            workoutStartTimeRef.current = Date.now();
        }

        setWorkoutActive(true);
    };

    const addRepSet = () => {
        activateCoach();
        setSetError("");

        const reps =
            Number(setForm.reps);

        const weight =
            setForm.weight === ""
                ? 0
                : Number(
                      setForm.weight
                  );

        const rpe =
            setForm.rpe === ""
                ? null
                : Number(
                      setForm.rpe
                  );

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
                !Number.isFinite(
                    rpe
                ) ||
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
            currentExerciseSets.length +
            1;

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

            durationSeconds: 0,

            volume:
                weight * reps
        };

        setExerciseSets(
            previous => ({
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

        if (
            nextSetNumber >=
            currentTargetSets
        ) {
            setTimeout(() => {
                const restSeconds =
                    getRest(
                        currentExercise
                    );

                if (
                    restSeconds > 0
                ) {
                    setMode("rest");
                    setTimeLeft(
                        restSeconds
                    );
                    setIsRunning(true);
                }
            }, 0);
        }
    };

    // =====================================================
    // REMOVE SET
    // =====================================================

    const removeSet = setNumber => {
        if (!currentExerciseId) {
            return;
        }

        setExerciseSets(
            previous => {
                const existing =
                    previous[
                        currentExerciseId
                    ] || [];

                const remaining =
                    existing
                        .filter(
                            set =>
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
                                    index +
                                    1
                            })
                        );

                return {
                    ...previous,

                    [currentExerciseId]:
                        remaining
                };
            }
        );

        setCurrentSetNumber(
            Math.max(
                1,
                currentExerciseSets.length
            )
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
                    .map(set => {
                        const durationSeconds =
                            Number(
                                set.durationSeconds ||
                                    0
                            );

                        const reps =
                            Number(
                                set.reps || 0
                            );

                        const weight =
                            Number(
                                set.weight ||
                                    0
                            );

                        return {
                            exerciseId:
                                set.exerciseId,

                            exerciseName:
                                set.exerciseName,

                            category:
                                set.category,

                            setNumber:
                                set.setNumber,

                            weight,

                            reps,

                            rpe:
                                set.rpe ===
                                    null ||
                                set.rpe ===
                                    ""
                                    ? null
                                    : Number(
                                          set.rpe
                                      ),

                            durationSeconds,

                            volume:
                                durationSeconds >
                                0
                                    ? 0
                                    : weight *
                                      reps
                        };
                    });

            if (sets.length === 0) {
                setSaveError(
                    "No completed sets were recorded. Complete at least one exercise before finishing the workout."
                );

                completionHandledRef.current =
                    false;

                setSaving(false);

                return;
            }

            const payload = {
                workoutDate:
                    new Date()
                        .toISOString()
                        .split(
                            "T"
                        )[0],

                notes:
                    `Completed workout plan: ${planId}`,

                durationMinutes:
                    elapsedMinutes,

                sets
            };

            console.log(
                "Saving workout payload:",
                payload
            );

            const response =
                await api.post(
                    "/workout-sessions",
                    payload
                );

            setSavedSession(
                response.data ||
                    null
            );

            setCompleted(true);

            setMode(
                "completed"
            );
        } catch (requestError) {
            console.error(
                "Error saving workout session:",
                requestError
            );

            completionHandledRef.current =
                false;

            if (
                requestError.response
                    ?.status === 401
            ) {
                setSaveError(
                    "Your session has expired. Please login again."
                );
            } else {
                const backendMessage =
                    requestError.response
                        ?.data?.message ||
                    requestError.response
                        ?.data?.error;

                setSaveError(
                    backendMessage ||
                        "Unable to save the completed workout."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // SAVE AFTER COMPLETION
    // =====================================================

    useEffect(() => {
        if (
            completed &&
            mode === "completed"
        ) {
            saveWorkout();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        completed,
        mode
    ]);

    // =====================================================
    // COACH
    // =====================================================

    // 3-2-1 countdown, then the timer starts.
    useEffect(() => {
        if (countdown === null) {
            return undefined;
        }

        if (countdown === 0) {
            setCountdown(null);
            setIsRunning(true);
            beep({ frequency: 1320, durationMs: 350 });
            speak("Go!");
            return undefined;
        }

        beep({ frequency: 880, durationMs: 150 });

        const timer = setTimeout(
            () => setCountdown((value) => (value === null ? null : value - 1)),
            1000
        );

        return () => clearTimeout(timer);
    }, [countdown]);

    // A new exercise or leaving the exercise screen cancels the countdown.
    useEffect(() => {
        setCountdown(null);
    }, [currentIndex, mode]);

    // Announce each new exercise once the workout is under way.
    useEffect(() => {
        if (
            !workoutActive ||
            mode !== "exercise" ||
            !currentExercise ||
            announcedIndexRef.current === currentIndex
        ) {
            return;
        }

        announcedIndexRef.current = currentIndex;

        vibrate(80);

        speak(
            `${currentIndex === exercises.length - 1 ? "Last exercise. " : "Next: "}` +
            `${getExerciseName(currentExercise)}. ` +
            describeTarget(
                currentTrackingType,
                currentTargetValue,
                currentTargetSets
            )
        );
    }, [
        workoutActive,
        mode,
        currentIndex,
        currentExercise,
        exercises.length,
        currentTrackingType,
        currentTargetValue,
        currentTargetSets
    ]);

    // Rest started: say how long and what comes next.
    useEffect(() => {
        if (mode !== "rest" || !workoutActive) {
            return;
        }

        vibrate([200, 100, 200]);
        beep({ frequency: 660, durationMs: 400 });

        const nextExercise = exercises[currentIndex + 1];

        speak(
            nextExercise
                ? `Rest. Next up: ${getExerciseName(nextExercise)}.`
                : "Rest. That was the last exercise."
        );
        // Only when rest begins.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    // Beeps in the last 3 seconds, "halfway" for longer timed sets.
    useEffect(() => {
        if (!isRunning) {
            return;
        }

        const timedExercise =
            mode === "exercise" && currentTrackingType === "TIME";

        if (!timedExercise && mode !== "rest") {
            return;
        }

        if (timeLeft > 0 && timeLeft <= 3) {
            beep({ frequency: 880, durationMs: 120 });
        }

        if (
            timedExercise &&
            currentTargetValue >= 20 &&
            timeLeft === Math.floor(currentTargetValue / 2)
        ) {
            speak("Halfway there. Keep going!");
        }
        // Runs once per second as the timer ticks.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft]);

    // Next set of a timed exercise started automatically.
    useEffect(() => {
        if (
            workoutActive &&
            mode === "exercise" &&
            currentTrackingType === "TIME" &&
            currentSetNumber > 1
        ) {
            vibrate(150);
            speak(`Set ${currentSetNumber} of ${currentTargetSets}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSetNumber]);

    // Finished.
    useEffect(() => {
        if (mode === "completed" && workoutActive) {
            vibrate([300, 150, 300]);
            speak("Workout complete. Great job!");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    // Keep the screen on from Start until the workout is finished.
    useEffect(() => {
        keepScreenOn(workoutActive && mode !== "completed");
    }, [workoutActive, mode]);

    useEffect(() => {
        return () => {
            keepScreenOn(false);
            window.speechSynthesis?.cancel();
        };
    }, []);

    const toggleSound = () => {
        const next = !soundOn;

        setSoundOn(next);
        setSoundOnState(next);

        if (next) {
            unlockAudio();
            speak("Sound on");
        }
    };

    const addRestTime = () => {
        setTimeLeft((value) => value + 20);
    };

    const nextExercise = exercises[currentIndex + 1] || null;

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div
                className="wt-workout-player-page"
                style={styles.centerPage}
            >
                <div
                    style={
                        styles.loadingIcon
                    }
                >
                    🏋️
                </div>

                <h2
                    style={
                        styles.centerTitle
                    }
                >
                    Loading Workout...
                </h2>

                <p
                    style={
                        styles.centerText
                    }
                >
                    Preparing your
                    exercises.
                </p>
            </div>
        );
    }

    // =====================================================
    // LOAD ERROR
    // =====================================================

    if (loadError) {
        return (
            <div
                className="wt-workout-player-page"
                style={styles.centerPage}
            >
                <div
                    style={
                        styles.errorIcon
                    }
                >
                    !
                </div>

                <h2
                    style={
                        styles.centerTitle
                    }
                >
                    Unable to Load Workout
                </h2>

                <p
                    style={
                        styles.centerText
                    }
                >
                    {loadError}
                </p>

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
                    Back to Workout Plans
                </button>
            </div>
        );
    }

    // =====================================================
    // COMPLETED
    // =====================================================

    if (
        completed &&
        mode === "completed"
    ) {
        return (
            <div
                className="wt-workout-player-page"
                style={styles.page}
            >
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

                    {saving && (
                        <p
                            style={
                                styles.savingText
                            }
                        >
                            Saving your workout...
                        </p>
                    )}

                    {saveError && (
                        <div
                            style={
                                styles.saveError
                            }
                        >
                            {saveError}
                        </div>
                    )}

                    {!saving &&
                        !saveError && (
                            <p
                                style={
                                    styles.successText
                                }
                            >
                                Your workout has
                                been saved
                                successfully.
                            </p>
                        )}

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
                                {exercises.length}
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
                                {Math.round(
                                    totalVolume
                                )}
                            </strong>
                            <span>
                                Volume (kg)
                            </span>
                        </div>

                        <div
                            style={
                                styles.summaryCard
                            }
                        >
                            <strong>
                                {formatTime(
                                    totalDuration
                                )}
                            </strong>
                            <span>
                                Time
                            </span>
                        </div>
                    </div>

                    <div
                        style={
                            styles.completedActions
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
                            Back to Workout Plans
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // =====================================================
    // NO EXERCISE
    // =====================================================

    if (!currentExercise) {
        return (
            <div
                className="wt-workout-player-page"
                style={styles.centerPage}
            >
                <h2
                    style={
                        styles.centerTitle
                    }
                >
                    No Exercise Found
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
    // MAIN WORKOUT SCREEN
    // =====================================================

    return (
        <div
            className="wt-workout-player-page"
            style={styles.page}
        >
            <div
                style={
                    styles.playerContainer
                }
            >
                {/* HEADER */}

                <div
                    style={
                        styles.header
                    }
                >
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/workout-plans"
                            )
                        }
                        style={
                            styles.backButton
                        }
                    >
                        ← Back
                    </button>

                    <button
                        type="button"
                        onClick={toggleSound}
                        style={
                            styles.soundButton
                        }
                        title={soundOn ? "Voice coach and beeps on" : "Voice coach and beeps off"}
                        aria-label={soundOn ? "Turn voice coach and beeps off" : "Turn voice coach and beeps on"}
                        aria-pressed={soundOn}
                    >
                        {soundOn ? "🔊" : "🔇"}
                    </button>

                    <div
                        style={
                            styles.progressInfo
                        }
                    >
                        <span>
                            Exercise{" "}
                            {currentIndex +
                                1}{" "}
                            of{" "}
                            {
                                exercises.length
                            }
                        </span>

                        <div
                            style={
                                styles.progressTrack
                            }
                        >
                            <div
                                style={{
                                    ...styles.progressBar,
                                    width: `${progressPercentage}%`
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* EXERCISE CARD */}

                <div
                    style={
                        styles.exerciseCard
                    }
                >
                    <div
                        style={
                            styles.exerciseTop
                        }
                    >
                        <div>
                            <span
                                style={
                                    styles.categoryBadge
                                }
                            >
                                {
                                    getCategory(
                                        currentExercise
                                    )
                                }
                            </span>

                            <h1
                                style={
                                    styles.exerciseTitle
                                }
                            >
                                {
                                    getExerciseName(
                                        currentExercise
                                    )
                                }
                            </h1>

                            <p
                                style={
                                    styles.equipmentText
                                }
                            >
                                Equipment:{" "}
                                {
                                    getEquipment(
                                        currentExercise
                                    )
                                }
                            </p>
                        </div>

                        <div
                            style={
                                styles.trackingBadge
                            }
                        >
                            {currentTrackingType ===
                            "TIME"
                                ? "⏱ TIME"
                                : "🔢 REPS"}
                        </div>
                    </div>

                    {/* PICTURE + HOW TO (hidden during rest so the
                        rest timer and "Next up" stay at the top) */}

                    {mode === "exercise" && (
                        <>
                            <ExerciseImage
                                key={getExerciseName(currentExercise)}
                                name={getExerciseName(currentExercise)}
                                height={200}
                                style={{ marginTop: 16 }}
                            />

                            <ExerciseHowTo
                                name={getExerciseName(currentExercise)}
                            />
                        </>
                    )}

                    {/* SET INFORMATION */}

                    <div
                        className="wt-player-targets"
                        style={
                            styles.targetRow
                        }
                    >
                        <div
                            style={
                                styles.targetItem
                            }
                        >
                            <span>
                                Target
                            </span>

                            <strong>
                                {currentTrackingType ===
                                "TIME"
                                    ? `${currentTargetValue}s`
                                    : `${currentTargetValue} reps`}
                            </strong>
                        </div>

                        <div
                            style={
                                styles.targetItem
                            }
                        >
                            <span>
                                Sets
                            </span>

                            <strong>
                                {
                                    currentTargetSets
                                }
                            </strong>
                        </div>

                        <div
                            style={
                                styles.targetItem
                            }
                        >
                            <span>
                                Current Set
                            </span>

                            <strong>
                                {
                                    currentSetNumber
                                }
                            </strong>
                        </div>

                        <div
                            style={
                                styles.targetItem
                            }
                        >
                            <span>
                                Rest
                            </span>

                            <strong>
                                {getRest(
                                    currentExercise
                                )}
                                s
                            </strong>
                        </div>
                    </div>

                    {/* TIME MODE */}

                    {mode ===
                        "exercise" &&
                        currentTrackingType ===
                            "TIME" && (
                            <div
                                style={
                                    styles.timerSection
                                }
                            >
                                <div
                                    style={
                                        styles.timerCircle
                                    }
                                >
                                    <span
                                        style={
                                            styles.timerText
                                        }
                                    >
                                        {countdown !== null
                                            ? countdown
                                            : formatTime(
                                                timeLeft
                                            )}
                                    </span>
                                </div>

                                <div
                                    style={
                                        styles.timerLabel
                                    }
                                    aria-live="polite"
                                >
                                    {countdown !== null
                                        ? "Get ready…"
                                        : isRunning
                                            ? "Exercise in progress"
                                            : "Ready to start"}
                                </div>
                            </div>
                        )}

                    {/* REPS MODE */}

                    {mode ===
                        "exercise" &&
                        currentTrackingType ===
                            "REPS" && (
                            <div
                                style={
                                    styles.repsSection
                                }
                            >
                                <h3
                                    style={
                                        styles.sectionTitle
                                    }
                                >
                                    Record Set
                                </h3>

                                <div
                                    style={
                                        styles.formGrid
                                    }
                                >
                                    <div>
                                        <label
                                            style={
                                                styles.label
                                            }
                                        >
                                            Reps
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            value={
                                                setForm.reps
                                            }
                                            onChange={e =>
                                                setSetForm(
                                                    previous => ({
                                                        ...previous,
                                                        reps: e
                                                            .target
                                                            .value
                                                    })
                                                )
                                            }
                                            placeholder="Reps"
                                            style={
                                                styles.input
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label
                                            style={
                                                styles.label
                                            }
                                        >
                                            Weight (kg)
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={
                                                setForm.weight
                                            }
                                            onChange={e =>
                                                setSetForm(
                                                    previous => ({
                                                        ...previous,
                                                        weight: e
                                                            .target
                                                            .value
                                                    })
                                                )
                                            }
                                            placeholder="0"
                                            style={
                                                styles.input
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label
                                            style={
                                                styles.label
                                            }
                                        >
                                            RPE
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            value={
                                                setForm.rpe
                                            }
                                            onChange={e =>
                                                setSetForm(
                                                    previous => ({
                                                        ...previous,
                                                        rpe: e
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
                                    </div>
                                </div>

                                {setError && (
                                    <div
                                        style={
                                            styles.formError
                                        }
                                    >
                                        {
                                            setError
                                        }
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={
                                        addRepSet
                                    }
                                    style={
                                        styles.addSetButton
                                    }
                                >
                                    + Add Set
                                </button>
                            </div>
                        )}

                    {/* REST */}

                    {mode ===
                        "rest" && (
                        <div
                            style={
                                styles.restSection
                            }
                        >
                            <div
                                style={
                                    styles.restIcon
                                }
                            >
                                ⏸
                            </div>

                            <h2
                                style={
                                    styles.restTitle
                                }
                            >
                                Rest
                            </h2>

                            <div
                                style={
                                    styles.restTimer
                                }
                            >
                                {formatTime(
                                    timeLeft
                                )}
                            </div>

                            {nextExercise ? (
                                <div
                                    style={
                                        styles.nextUpCard
                                    }
                                >
                                    <ExerciseImage
                                        name={getExerciseName(nextExercise)}
                                        height={72}
                                        animate={false}
                                        rounded={10}
                                        style={{ width: 96, flexShrink: 0 }}
                                        fallback={
                                            <div style={styles.nextUpIcon}>
                                                ⚡
                                            </div>
                                        }
                                    />

                                    <div style={{ minWidth: 0, textAlign: "left" }}>
                                        <div style={styles.nextUpLabel}>
                                            NEXT UP
                                        </div>

                                        <div style={styles.nextUpName}>
                                            {getExerciseName(nextExercise)}
                                        </div>

                                        <div style={styles.nextUpTarget}>
                                            {getTrackingType(nextExercise) === "TIME"
                                                ? `⏱ ${getTargetValue(nextExercise)}s`
                                                : `🔢 ${getTargetValue(nextExercise)} reps`}
                                            {getTargetSets(nextExercise) > 1
                                                ? ` × ${getTargetSets(nextExercise)} sets`
                                                : ""}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p
                                    style={
                                        styles.centerText
                                    }
                                >
                                    That was the last exercise. 🎉
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={addRestTime}
                                style={
                                    styles.addRestButton
                                }
                            >
                                +20s rest
                            </button>
                        </div>
                    )}

                    {/* CONTROLS (fixed bar at the bottom on phones) */}

                    <div
                        className="wt-player-controls"
                        style={
                            styles.controls
                        }
                    >
                        {mode ===
                            "exercise" && (
                            <>
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
                                            styles.pauseButton
                                        }
                                    >
                                        ⏸ Pause
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
                            </>
                        )}

                        {mode ===
                            "rest" && (
                            <>
                                <button
                                    type="button"
                                    onClick={
                                        () => {
                                            activateCoach();
                                            moveToNextExercise();
                                        }
                                    }
                                    style={
                                        styles.primaryButton
                                    }
                                >
                                    Continue →
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        () =>
                                            setIsRunning(
                                                previous =>
                                                    !previous
                                            )
                                    }
                                    style={
                                        styles.secondaryButton
                                    }
                                >
                                    {isRunning
                                        ? "⏸ Pause Rest"
                                        : "▶ Resume Rest"}
                                </button>
                            </>
                        )}
                    </div>

                    {/* COMPLETED SETS */}

                    {currentExerciseSets.length >
                        0 && (
                        <div
                            style={
                                styles.completedSetsSection
                            }
                        >
                            <h3
                                style={
                                    styles.sectionTitle
                                }
                            >
                                Completed Sets
                            </h3>

                            <div
                                style={
                                    styles.setList
                                }
                            >
                                {currentExerciseSets.map(
                                    set => (
                                        <div
                                            key={
                                                `${set.exerciseId}-${set.setNumber}`
                                            }
                                            style={
                                                styles.setRow
                                            }
                                        >
                                            <div>
                                                <strong>
                                                    Set{" "}
                                                    {
                                                        set.setNumber
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                {set.durationSeconds >
                                                0
                                                    ? `⏱ ${formatTime(
                                                          set.durationSeconds
                                                      )}`
                                                    : `🔢 ${set.reps} reps`}
                                            </div>

                                            {set.durationSeconds ===
                                                0 && (
                                                <div>
                                                    {
                                                        set.weight
                                                    }{" "}
                                                    kg
                                                </div>
                                            )}

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
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// =====================================================
// INLINE STYLES
// =====================================================

const styles = {
    soundButton: {
        width: 44,
        height: 44,
        minHeight: 0,
        padding: 0,
        border: "1px solid var(--wt-border)",
        borderRadius: 12,
        background: "var(--wt-surface)",
        color: "var(--wt-text-primary)",
        fontSize: 20,
        cursor: "pointer",
        flexShrink: 0
    },

    nextUpCard: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        maxWidth: 420,
        margin: "18px auto 0",
        padding: 12,
        border: "1px solid var(--wt-border)",
        borderRadius: 14,
        background: "var(--wt-surface)",
        color: "var(--wt-text-primary)"
    },

    nextUpIcon: {
        width: 96,
        height: 72,
        flexShrink: 0,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 30,
        background: "var(--wt-surface-tertiary)"
    },

    nextUpLabel: {
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.5,
        color: "var(--wt-accent)"
    },

    nextUpName: {
        fontSize: 17,
        fontWeight: 700,
        color: "var(--wt-text-primary)",
        overflowWrap: "anywhere"
    },

    nextUpTarget: {
        marginTop: 2,
        fontSize: 13,
        color: "var(--wt-text-muted)"
    },

    addRestButton: {
        marginTop: 14,
        padding: "8px 16px",
        border: "1px solid var(--wt-border)",
        borderRadius: 999,
        background: "transparent",
        color: "var(--wt-text-primary)",
        fontWeight: 700,
        cursor: "pointer"
    },

    page: {
        color:
            "var(--wt-text-primary)",
        minHeight:
            "100vh",
        padding:
            "24px",
        boxSizing:
            "border-box"
    },

    centerPage: {
        color:
            "var(--wt-text-primary)",
        minHeight:
            "70vh",
        display:
            "flex",
        flexDirection:
            "column",
        alignItems:
            "center",
        justifyContent:
            "center",
        textAlign:
            "center",
        padding:
            "30px"
    },

    playerContainer: {
        maxWidth:
            "1100px",
        margin:
            "0 auto"
    },

    header: {
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "24px",
        marginBottom:
            "20px"
    },

    backButton: {
        border:
            "none",
        background:
            "transparent",
        cursor:
            "pointer",
        fontSize:
            "15px",
        fontWeight:
            "600",
        padding:
            "8px"
    },

    progressInfo: {
        flex:
            1,
        display:
            "flex",
        flexDirection:
            "column",
        gap:
            "8px",
        fontSize:
            "14px"
    },

    progressTrack: {
        width:
            "100%",
        height:
            "7px",
        borderRadius:
            "10px",
        background:
            "var(--wt-border)",
        overflow:
            "hidden"
    },

    progressBar: {
        height:
            "100%",
        background:
            "#2563eb",
        borderRadius:
            "10px",
        transition:
            "width 0.3s ease"
    },

    exerciseCard: {
        color:
            "var(--wt-text-primary)",
        background:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius:
            "20px",
        padding:
            "30px",
        boxShadow:
            "var(--wt-shadow)"
    },

    exerciseTop: {
        display:
            "flex",
        justifyContent:
            "space-between",
        alignItems:
            "flex-start",
        gap:
            "20px"
    },

    categoryBadge: {
        display:
            "inline-block",
        padding:
            "6px 12px",
        borderRadius:
            "20px",
        fontSize:
            "12px",
        fontWeight:
            "700",
        background:
            "var(--wt-accent-soft)",
        color:
            "var(--wt-accent)"
    },

    exerciseTitle: {
        margin:
            "12px 0 6px",
        fontSize:
            "32px"
    },

    equipmentText: {
        margin:
            0,
        color:
            "var(--wt-text-muted)"
    },

    trackingBadge: {
        padding:
            "9px 14px",
        borderRadius:
            "20px",
        fontWeight:
            "700",
        background:
            "#2563eb",
        color:
            "#ffffff",
        whiteSpace:
            "nowrap"
    },

    targetRow: {
        display:
            "grid",
        gridTemplateColumns:
            "repeat(4, 1fr)",
        gap:
            "12px",
        marginTop:
            "25px",
        marginBottom:
            "25px"
    },

    targetItem: {
        padding:
            "15px",
        borderRadius:
            "12px",
        background:
            "var(--wt-surface-secondary)",
        display:
            "flex",
        flexDirection:
            "column",
        gap:
            "5px"
    },

    timerSection: {
        display:
            "flex",
        flexDirection:
            "column",
        alignItems:
            "center",
        justifyContent:
            "center",
        padding:
            "20px"
    },

    timerCircle: {
        width:
            "250px",
        height:
            "250px",
        borderRadius:
            "50%",
        border:
            "10px solid #2563eb",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        margin:
            "10px auto 20px"
    },

    timerText: {
        fontSize:
            "52px",
        fontWeight:
            "800",
        fontVariantNumeric:
            "tabular-nums"
    },

    timerLabel: {
        color:
            "var(--wt-text-muted)",
        fontSize:
            "15px"
    },

    repsSection: {
        marginTop:
            "20px",
        padding:
            "20px",
        borderRadius:
            "15px",
        background:
            "var(--wt-surface-secondary)"
    },

    sectionTitle: {
        margin:
            "0 0 15px",
        fontSize:
            "18px"
    },

    formGrid: {
        display:
            "grid",
        gridTemplateColumns:
            "repeat(3, 1fr)",
        gap:
            "15px"
    },

    label: {
        display:
            "block",
        marginBottom:
            "7px",
        fontSize:
            "13px",
        fontWeight:
            "600"
    },

    input: {
        width:
            "100%",
        boxSizing:
            "border-box",
        padding:
            "12px",
        borderRadius:
            "9px",
        border:
            "1px solid var(--wt-border-strong)",
        background:
            "var(--wt-input-background)",
        color:
            "var(--wt-input-text)",
        fontSize:
            "15px"
    },

    addSetButton: {
        marginTop:
            "15px",
        padding:
            "11px 18px",
        border:
            "none",
        borderRadius:
            "9px",
        background:
            "#2563eb",
        color:
            "#ffffff",
        fontWeight:
            "700",
        cursor:
            "pointer"
    },

    formError: {
        marginTop:
            "12px",
        padding:
            "10px",
        borderRadius:
            "8px",
        background:
            "var(--wt-danger-soft)",
        color:
            "var(--wt-danger)"
    },

    restSection: {
        textAlign:
            "center",
        padding:
            "35px"
    },

    restIcon: {
        fontSize:
            "45px"
    },

    restTitle: {
        fontSize:
            "30px",
        margin:
            "10px 0"
    },

    restTimer: {
        fontSize:
            "55px",
        fontWeight:
            "800",
        fontVariantNumeric:
            "tabular-nums"
    },

    controls: {
        display:
            "flex",
        justifyContent:
            "center",
        gap:
            "12px",
        marginTop:
            "25px",
        flexWrap:
            "wrap"
    },

    primaryButton: {
        padding:
            "12px 22px",
        border:
            "none",
        borderRadius:
            "10px",
        background:
            "#2563eb",
        color:
            "#ffffff",
        fontWeight:
            "700",
        cursor:
            "pointer"
    },

    secondaryButton: {
        padding:
            "12px 22px",
        border:
            "1px solid var(--wt-border-strong)",
        borderRadius:
            "10px",
        background:
            "transparent",
        color:
            "inherit",
        fontWeight:
            "700",
        cursor:
            "pointer"
    },

    pauseButton: {
        padding:
            "12px 22px",
        border:
            "none",
        borderRadius:
            "10px",
        background:
            "#f59e0b",
        color:
            "#ffffff",
        fontWeight:
            "700",
        cursor:
            "pointer"
    },

    completedSetsSection: {
        marginTop:
            "30px",
        paddingTop:
            "20px",
        borderTop:
            "1px solid var(--wt-border)"
    },

    setList: {
        display:
            "flex",
        flexDirection:
            "column",
        gap:
            "8px"
    },

    setRow: {
        display:
            "grid",
        gridTemplateColumns:
            "1fr 1fr 1fr auto",
        alignItems:
            "center",
        gap:
            "10px",
        padding:
            "12px 15px",
        borderRadius:
            "10px",
        background:
            "var(--wt-surface-secondary)"
    },

    removeButton: {
        border:
            "none",
        background:
            "transparent",
        color:
            "var(--wt-danger)",
        cursor:
            "pointer",
        fontWeight:
            "600"
    },

    completedCard: {
        color:
            "var(--wt-text-primary)",
        maxWidth:
            "850px",
        margin:
            "50px auto",
        padding:
            "40px",
        borderRadius:
            "22px",
        background:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        textAlign:
            "center",
        boxShadow:
            "var(--wt-shadow)"
    },

    completedIcon: {
        width:
            "80px",
        height:
            "80px",
        borderRadius:
            "50%",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        margin:
            "0 auto 20px",
        background:
            "#16a34a",
        color:
            "#ffffff",
        fontSize:
            "40px",
        fontWeight:
            "800"
    },

    completedTitle: {
        margin:
            "0 0 10px",
        fontSize:
            "32px"
    },

    savingText: {
        color:
            "var(--wt-text-muted)"
    },

    successText: {
        color:
            "var(--wt-success)",
        fontWeight:
            "600"
    },

    saveError: {
        margin:
            "15px 0",
        padding:
            "12px",
        borderRadius:
            "10px",
        background:
            "var(--wt-danger-soft)",
        color:
            "var(--wt-danger)"
    },

    summaryGrid: {
        display:
            "grid",
        gridTemplateColumns:
            "repeat(4, 1fr)",
        gap:
            "12px",
        margin:
            "30px 0"
    },

    summaryCard: {
        padding:
            "20px 10px",
        borderRadius:
            "14px",
        background:
            "var(--wt-surface-secondary)",
        display:
            "flex",
        flexDirection:
            "column",
        gap:
            "5px"
    },

    completedActions: {
        display:
            "flex",
        justifyContent:
            "center",
        gap:
            "12px",
        flexWrap:
            "wrap"
    },

    loadingIcon: {
        fontSize:
            "45px"
    },

    errorIcon: {
        width:
            "55px",
        height:
            "55px",
        borderRadius:
            "50%",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        background:
            "#dc2626",
        color:
            "#ffffff",
        fontSize:
            "30px",
        fontWeight:
            "800",
        marginBottom:
            "15px"
    },

    centerTitle: {
        margin:
            "10px 0"
    },

    centerText: {
        color:
            "var(--wt-text-muted)"
    }
};

export default WorkoutPlayer;