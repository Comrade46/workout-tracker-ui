// ==========================================
// FOLLOW-ALONG WORKOUT PLAYER
// ==========================================
// Works like the Home Workout app:
//   Ready (10 s) -> exercise -> rest -> exercise ... -> finish
// - Reps exercise: big "×12" and a Done button (reps / weight adjustable)
// - Timed exercise: 3-2-1, then a countdown with Pause
// - Pause menu: Resume, Restart this exercise, Quit workout
// - Rest: countdown, +20s, Skip rest, preview of what's next
// - Previous / Skip on every exercise
// Each set of an exercise is one step. Finished workouts are saved on the
// phone first and uploaded (see offline/workoutOutbox).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosConfig";
import ExerciseImage from "../components/ExerciseImage";
import ExerciseHowTo from "../components/ExerciseHowTo";
import { getProgram, getProgramDay, programMarker } from "../data/programs";
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
import { newClientId, saveWorkoutSafely } from "../offline/workoutOutbox";
import { dateKey, estimateCalories, rememberedWeight } from "../progress/motivation";
import "./Player.css";

const READY_SECONDS = 10;
const PRECOUNT_SECONDS = 3;
const EXTRA_REST_SECONDS = 20;
const TICK_MS = 200;

// ---------- exercise data ----------

function number(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

// Plan rows and program items come in slightly different shapes.
function normalise(row) {
    const tracking = String(row?.trackingType ?? row?.exercise?.trackingType ?? "TIME").toUpperCase() === "REPS"
        ? "REPS"
        : "TIME";

    return {
        exerciseId: row?.exerciseId ?? row?.exercise?.id ?? row?.id ?? null,
        name: row?.exerciseName ?? row?.exercise?.name ?? row?.name ?? "Exercise",
        category: row?.category ?? row?.exercise?.category ?? "",
        equipment: row?.equipment ?? row?.exercise?.equipment ?? "Bodyweight",
        tracking,
        target: Math.max(1, number(row?.targetValue ?? row?.durationSeconds, tracking === "TIME" ? 30 : 12)),
        sets: Math.max(1, number(row?.targetSets, 1)),
        rest: Math.max(0, number(row?.restSeconds ?? row?.exercise?.restSeconds, 15)),
        order: number(row?.exerciseOrder ?? row?.order, 0)
    };
}

function usesWeights(exercise) {
    return !/body\s*weight|none|mat/i.test(exercise.equipment || "");
}

function targetLabel(exercise) {
    return exercise.tracking === "TIME" ? `${exercise.target}s` : `×${exercise.target}`;
}

function clockText(totalSeconds) {
    const seconds = Math.max(0, Math.ceil(totalSeconds));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// ---------- small pieces ----------

function Ring({ fraction, children, size = "large", label }) {
    const radius = 44;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className={`wt-fp-ring ${size}`} role="timer" aria-label={label}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle className="wt-fp-ring-track" cx="50" cy="50" r={radius} />
                <circle
                    className="wt-fp-ring-value"
                    cx="50"
                    cy="50"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, fraction)))}
                />
            </svg>
            <div className="wt-fp-ring-label" aria-hidden="true">{children}</div>
        </div>
    );
}

function Stepper({ label, value, step, min, max, unit, onChange }) {
    const change = (delta) => {
        const next = Math.round((Number(value) + delta) * 10) / 10;
        onChange(Math.min(max, Math.max(min, next)));
    };

    return (
        <div className="wt-fp-stepper">
            <span className="wt-fp-stepper-label">{label}</span>
            <button type="button" onClick={() => change(-step)} aria-label={`Less ${label.toLowerCase()}`}>−</button>
            <strong aria-live="polite">{value}{unit}</strong>
            <button type="button" onClick={() => change(step)} aria-label={`More ${label.toLowerCase()}`}>+</button>
        </div>
    );
}

// ======================================================================

function FollowAlongPlayer() {
    const { planId, programId, dayKey } = useParams();
    const navigate = useNavigate();

    const program = programId ? getProgram(programId) : null;
    const programDay = program ? getProgramDay(program, dayKey) : null;
    const backPath = programId ? `/programs/${programId}/${dayKey}` : "/workout-plans";

    const [exercises, setExercises] = useState([]);
    const [title, setTitle] = useState(program ? program.title : "Workout");
    const [phase, setPhase] = useState("loading"); // loading | error | ready | exercise | rest | finish
    const [loadError, setLoadError] = useState("");
    const [stepIndex, setStepIndex] = useState(0);

    // Running countdown: { kind: ready|precount|work|rest, total, endAt } or
    // paused with { remaining } instead of endAt. null = no clock (reps).
    const [clock, setClock] = useState(null);
    const [, setTick] = useState(0);

    const [paused, setPaused] = useState(false);
    const [confirmQuit, setConfirmQuit] = useState(false);
    const [showHowTo, setShowHowTo] = useState(false);
    const [soundOn, setSoundOnState] = useState(isSoundOn());

    // Finished steps: { [stepIndex]: { reps, weight, durationSeconds } }
    const [records, setRecords] = useState({});
    const [repsDraft, setRepsDraft] = useState(0);
    const [weightDraft, setWeightDraft] = useState(0);

    const [saveState, setSaveState] = useState({ status: "idle", message: "" });
    const [summary, setSummary] = useState(null);

    const startedAtRef = useRef(null);
    const clientIdRef = useRef(newClientId());
    const lastBeepRef = useRef(null);
    const halfwaySaidRef = useRef(false);
    const savedRef = useRef(false);

    // One step per set: Crunches set 1, set 2, set 3, then the next exercise.
    const steps = useMemo(
        () =>
            exercises.flatMap((exercise, exerciseIndex) =>
                Array.from({ length: exercise.sets }, (_, i) => ({ exercise, exerciseIndex, set: i + 1 }))
            ),
        [exercises]
    );

    const step = steps[stepIndex] || null;
    const nextStep = steps[stepIndex + 1] || null;

    // ---------------- load ----------------

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                let rows;

                if (programId) {
                    if (!programDay || programDay.rest) throw new Error("This program workout was not found.");

                    const library = await api.get("/exercises");
                    const byName = new Map(
                        (Array.isArray(library.data) ? library.data : []).map((e) => [String(e.name).toLowerCase(), e])
                    );

                    rows = programDay.exercises
                        .map((item, index) => {
                            const exercise = byName.get(item.name.toLowerCase());
                            if (!exercise) return null;

                            const isTime = exercise.trackingType === "TIME";
                            return {
                                exerciseId: exercise.id,
                                exerciseName: exercise.name,
                                category: exercise.category,
                                equipment: exercise.equipment,
                                trackingType: exercise.trackingType,
                                targetValue: isTime
                                    ? item.seconds ?? exercise.durationSeconds ?? 30
                                    : item.reps ?? exercise.defaultReps ?? 12,
                                targetSets: item.sets,
                                restSeconds: item.rest,
                                exerciseOrder: index + 1
                            };
                        })
                        .filter(Boolean);

                    if (!cancelled) {
                        setTitle(program.type === "focus" ? program.title : `${program.title} - ${programDay.title}`);
                    }
                } else {
                    const [planExercises, plan] = await Promise.all([
                        api.get(`/workout-plan-exercises/workout-plans/${planId}/exercises`),
                        api.get(`/workout-plans/${planId}`).catch(() => null)
                    ]);

                    rows = Array.isArray(planExercises.data) ? planExercises.data : [];
                    if (!cancelled && plan?.data?.name) setTitle(plan.data.name);
                }

                const list = rows.map(normalise).sort((a, b) => a.order - b.order);

                if (list.length === 0) throw new Error("This workout has no exercises yet.");

                if (!cancelled) {
                    setExercises(list);
                    setPhase("ready");
                    startedAtRef.current = Date.now();
                    setClock({ kind: "ready", total: READY_SECONDS, endAt: Date.now() + READY_SECONDS * 1000 });
                }
            } catch (error) {
                if (!cancelled) {
                    setLoadError(error.userMessage || error.message || "The workout could not be loaded.");
                    setPhase("error");
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [planId, programId, program, programDay]);

    // Screen stays on during the workout.
    useEffect(() => {
        const active = phase === "ready" || phase === "exercise" || phase === "rest";
        keepScreenOn(active);
        return () => keepScreenOn(false);
    }, [phase]);

    useEffect(() => {
        unlockAudio();
    }, []);

    // ---------------- clock helpers ----------------

    const remaining = clock
        ? clock.endAt
            ? Math.max(0, (clock.endAt - Date.now()) / 1000)
            : clock.remaining
        : 0;

    const startClock = useCallback((kind, seconds) => {
        lastBeepRef.current = null;
        setClock({ kind, total: seconds, endAt: Date.now() + seconds * 1000 });
    }, []);

    const freezeClock = useCallback(() => {
        setClock((current) =>
            current && current.endAt
                ? { ...current, endAt: null, remaining: Math.max(0, (current.endAt - Date.now()) / 1000) }
                : current
        );
    }, []);

    const resumeClock = useCallback(() => {
        setClock((current) =>
            current && !current.endAt ? { ...current, endAt: Date.now() + current.remaining * 1000 } : current
        );
    }, []);

    // ---------------- step flow ----------------

    const beginStep = useCallback(
        (index) => {
            const target = steps[index];
            if (!target) return;

            const { exercise, set } = target;

            setStepIndex(index);
            setPhase("exercise");
            setPaused(false);
            setShowHowTo(false);
            halfwaySaidRef.current = false;

            // Weight: last one used for this exercise in this workout.
            const previousWeight = Object.entries(records)
                .filter(([key]) => steps[Number(key)]?.exerciseIndex === target.exerciseIndex)
                .map(([, record]) => record.weight)
                .pop();

            setRepsDraft(exercise.target);
            setWeightDraft(previousWeight ?? 0);

            const setText = exercise.sets > 1 ? `, set ${set} of ${exercise.sets}` : "";
            speak(`${exercise.name}${setText}. ${describeTarget(exercise.tracking, exercise.target, 1)}.`);

            if (exercise.tracking === "TIME") {
                startClock("precount", PRECOUNT_SECONDS);
            } else {
                setClock(null);
            }
        },
        [steps, records, startClock]
    );

    const finish = useCallback(
        (finalRecords) => {
            setPhase("finish");
            setClock(null);
            setPaused(false);
            setConfirmQuit(false);

            const entries = Object.entries(finalRecords)
                .map(([key, record]) => ({ step: steps[Number(key)], record, index: Number(key) }))
                .filter((entry) => entry.step)
                .sort((a, b) => a.index - b.index);

            const minutes = Math.min(
                24 * 60,
                Math.max(1, Math.round((Date.now() - (startedAtRef.current || Date.now())) / 60000))
            );

            setSummary({
                exercises: new Set(entries.map((entry) => entry.step.exerciseIndex)).size,
                sets: entries.length,
                minutes,
                kcal: estimateCalories(minutes, rememberedWeight())
            });

            if (entries.length === 0 || savedRef.current) {
                if (entries.length === 0) setSaveState({ status: "empty", message: "" });
                return;
            }

            savedRef.current = true;
            speak("Workout complete. Great job!");
            vibrate([200, 100, 200]);
            setSaveState({ status: "saving", message: "" });

            const payload = {
                clientId: clientIdRef.current,
                workoutDate: dateKey(new Date()),
                notes: program ? `${title} ${programMarker(programId, dayKey)}` : title,
                durationMinutes: minutes,
                sets: entries.map(({ step: s, record }) => ({
                    exerciseId: s.exercise.exerciseId,
                    setNumber: s.set,
                    reps: s.exercise.tracking === "REPS" ? record.reps : 0,
                    weight: s.exercise.tracking === "REPS" ? record.weight : 0,
                    durationSeconds: s.exercise.tracking === "TIME" ? record.durationSeconds : 0,
                    rpe: null
                }))
            };

            saveWorkoutSafely(payload)
                .then((result) => setSaveState({ status: result.status, message: result.message || "" }))
                .catch(() => setSaveState({ status: "failed", message: "The workout could not be saved." }));
        },
        [steps, program, programId, dayKey, title]
    );

    // Record the current step and move on (rest, next step or finish).
    const completeStep = useCallback(
        (record) => {
            const nextRecords = { ...records, [stepIndex]: record };
            setRecords(nextRecords);

            beep({ frequency: 1320, durationMs: 250 });
            vibrate(150);

            if (!steps[stepIndex + 1]) {
                finish(nextRecords);
                return;
            }

            const rest = step.exercise.rest;

            if (rest > 0) {
                setPhase("rest");
                setShowHowTo(false);
                const upcoming = steps[stepIndex + 1];
                speak(`Rest ${rest} seconds. Next: ${upcoming.exercise.name}.`);
                startClock("rest", rest);
            } else {
                beginStep(stepIndex + 1);
            }
        },
        [records, stepIndex, steps, step, finish, startClock, beginStep]
    );

    const skipStep = useCallback(() => {
        if (steps[stepIndex + 1]) beginStep(stepIndex + 1);
        else finish(records);
    }, [steps, stepIndex, beginStep, finish, records]);

    // ---------------- ticking ----------------

    useEffect(() => {
        if (!clock || !clock.endAt || paused) return undefined;

        const timer = window.setInterval(() => {
            const left = (clock.endAt - Date.now()) / 1000;
            setTick((t) => t + 1);

            // Beeps for the last 3 seconds of every countdown
            const whole = Math.ceil(left);
            if (whole <= 3 && whole >= 1 && lastBeepRef.current !== whole) {
                lastBeepRef.current = whole;
                beep({ frequency: clock.kind === "precount" ? 660 : 880, durationMs: 120 });
            }

            if (clock.kind === "work" && !halfwaySaidRef.current && clock.total >= 20 && left <= clock.total / 2) {
                halfwaySaidRef.current = true;
                speak("Halfway there.");
            }

            if (left > 0) return;

            window.clearInterval(timer);

            if (clock.kind === "ready") {
                beginStep(0);
            } else if (clock.kind === "precount") {
                speak("Go!");
                startClock("work", step.exercise.target);
            } else if (clock.kind === "work") {
                completeStep({ reps: 0, weight: 0, durationSeconds: step.exercise.target });
            } else if (clock.kind === "rest") {
                beginStep(stepIndex + 1);
            }
        }, TICK_MS);

        return () => window.clearInterval(timer);
    }, [clock, paused, beginStep, startClock, completeStep, step, stepIndex]);

    // ---------------- pause / quit ----------------

    const pause = () => {
        freezeClock();
        setPaused(true);
    };

    const resume = () => {
        setPaused(false);
        setConfirmQuit(false);
        resumeClock();
    };

    const restartStep = () => {
        setPaused(false);
        beginStep(stepIndex);
    };

    const quitWithoutSaving = () => {
        keepScreenOn(false);
        navigate(backPath);
    };

    const doneCount = Object.keys(records).length;

    // Space bar / Enter: main action.
    useEffect(() => {
        const onKey = (event) => {
            if (event.key !== " " || event.target.closest("button, input, a")) return;
            event.preventDefault();

            if (paused) resume();
            else if (phase === "exercise" && step?.exercise.tracking === "REPS") {
                completeStep({ reps: repsDraft, weight: weightDraft, durationSeconds: 0 });
            } else if (phase !== "finish") pause();
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const toggleSound = () => {
        const next = !soundOn;
        setSoundOn(next);
        setSoundOnState(next);
        if (next) unlockAudio();
    };

    // ======================================================================
    // RENDER
    // ======================================================================

    if (phase === "loading") {
        return (
            <div className="wt-fp wt-fp-center" role="status">
                <div className="wt-fp-muted">Loading workout…</div>
            </div>
        );
    }

    if (phase === "error") {
        return (
            <div className="wt-fp wt-fp-center">
                <div className="wt-fp-finish-card">
                    <h1 className="wt-fp-title">Can't start this workout</h1>
                    <p className="wt-fp-muted">{loadError}</p>
                    <Link to={backPath} className="wt-fp-main">Back</Link>
                </div>
            </div>
        );
    }

    if (phase === "finish") {
        const status = saveState.status;

        return (
            <div className="wt-fp wt-fp-center">
                <div className="wt-fp-finish-card">
                    <div className="wt-fp-finish-icon" aria-hidden="true">{summary?.sets ? "🏆" : "👋"}</div>
                    <h1 className="wt-fp-title">{summary?.sets ? "Workout complete!" : "Workout ended"}</h1>
                    <p className="wt-fp-muted">{title}</p>

                    {summary?.sets > 0 && (
                        <div className="wt-fp-stats">
                            <div><strong>{summary.exercises}</strong><span>Exercises</span></div>
                            <div><strong>{summary.sets}</strong><span>Sets</span></div>
                            <div><strong>{summary.minutes}</strong><span>Minutes</span></div>
                            {summary.kcal && <div><strong>≈{summary.kcal}</strong><span>kcal</span></div>}
                        </div>
                    )}

                    <div className={`wt-fp-save ${status}`} role="status">
                        {status === "saving" && "Saving your workout…"}
                        {status === "uploaded" && "✓ Saved to your history"}
                        {status === "waiting" && "⏳ Saved on this phone - it uploads automatically when you're online"}
                        {status === "failed" && `⚠️ ${saveState.message} It is kept on this phone (Profile › Workouts waiting to upload).`}
                        {status === "empty" && "No exercises were finished, so nothing was saved."}
                    </div>

                    <div className="wt-fp-finish-actions">
                        <button type="button" className="wt-fp-main" onClick={() => navigate(programId ? `/programs/${programId}` : "/workout-plans")}>
                            Done
                        </button>
                        {summary?.sets > 0 && (
                            <button type="button" className="wt-fp-secondary" onClick={() => navigate("/workout-history")}>
                                View history
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const current = phase === "ready" ? steps[0] : step;
    const exercise = current.exercise;
    const isRest = phase === "rest";
    const shown = isRest ? nextStep : current;
    const exerciseCount = exercises.length;
    const exerciseNumber = shown.exerciseIndex + 1;

    return (
        <div className="wt-fp" onPointerDown={() => unlockAudio()}>
            {/* Top bar: close (pause), progress per exercise, sound, how-to */}
            <div className="wt-fp-top">
                <button type="button" className="wt-fp-icon" onClick={pause} aria-label="Pause workout">✕</button>

                <div className="wt-fp-progress" aria-label={`Exercise ${exerciseNumber} of ${exerciseCount}`}>
                    {exercises.map((item, index) => {
                        const setsDone = steps.filter((s, i) => s.exerciseIndex === index && records[i]).length;
                        const state = index < current.exerciseIndex || setsDone === item.sets
                            ? "done"
                            : index === current.exerciseIndex ? "now" : "";
                        return <span key={index} className={state} />;
                    })}
                </div>

                <button type="button" className="wt-fp-icon" onClick={toggleSound} aria-label={soundOn ? "Mute coach" : "Unmute coach"}>
                    {soundOn ? "🔊" : "🔇"}
                </button>
            </div>

            {/* ---------------- REST ---------------- */}
            {isRest ? (
                <div className="wt-fp-rest">
                    <div className="wt-fp-eyebrow">Rest</div>
                    <Ring fraction={clock ? remaining / clock.total : 0} label={`Rest, ${Math.ceil(remaining)} seconds left`}>
                        <strong>{clockText(remaining)}</strong>
                    </Ring>

                    <div className="wt-fp-row">
                        <button
                            type="button"
                            className="wt-fp-secondary"
                            onClick={() =>
                                setClock((c) =>
                                    c.endAt
                                        ? { ...c, total: c.total + EXTRA_REST_SECONDS, endAt: c.endAt + EXTRA_REST_SECONDS * 1000 }
                                        : { ...c, total: c.total + EXTRA_REST_SECONDS, remaining: c.remaining + EXTRA_REST_SECONDS }
                                )
                            }
                        >
                            +{EXTRA_REST_SECONDS}s
                        </button>
                        <button type="button" className="wt-fp-main" onClick={() => beginStep(stepIndex + 1)}>
                            Skip rest
                        </button>
                    </div>

                    <div className="wt-fp-next">
                        <ExerciseImage name={nextStep.exercise.name} height={84} rounded={12} style={{ width: 110, flexShrink: 0 }} fallback={<div className="wt-fp-thumb">🏋️</div>} />
                        <div style={{ minWidth: 0 }}>
                            <div className="wt-fp-muted">Next {nextStep.exerciseIndex + 1}/{exerciseCount}{nextStep.exercise.sets > 1 ? ` · set ${nextStep.set} of ${nextStep.exercise.sets}` : ""}</div>
                            <div className="wt-fp-next-name">{nextStep.exercise.name}</div>
                            <div className="wt-fp-next-target">{targetLabel(nextStep.exercise)}</div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* ---------------- READY / EXERCISE ---------------- */}
                    <div className="wt-fp-media">
                        <ExerciseImage
                            name={exercise.name}
                            height={260}
                            rounded={18}
                            animate={!paused}
                            style={{ width: "100%", height: "min(34vh, 280px)" }}
                            fallback={<div className="wt-fp-thumb big">🏋️</div>}
                        />
                    </div>

                    <div className="wt-fp-info">
                        <div className="wt-fp-meta">
                            {phase === "ready" ? "Ready to go!" : `Exercise ${current.exerciseIndex + 1} of ${exerciseCount}`}
                            {exercise.sets > 1 && phase !== "ready" ? ` · Set ${current.set} of ${exercise.sets}` : ""}
                        </div>

                        <h1 className="wt-fp-name">
                            {exercise.name}
                            <button type="button" className="wt-fp-help" onClick={() => setShowHowTo((v) => !v)} aria-expanded={showHowTo} aria-label="How to do it">
                                ?
                            </button>
                        </h1>

                        {phase === "ready" && (
                            <div className="wt-fp-next-target">
                                {targetLabel(exercise)}
                                {exercise.sets > 1 ? ` · ${exercise.sets} sets` : ""}
                            </div>
                        )}

                        {phase === "ready" && (
                            <Ring fraction={clock ? remaining / clock.total : 0} size="medium" label={`Starting in ${Math.ceil(remaining)} seconds`}>
                                <strong>{Math.ceil(remaining)}</strong>
                            </Ring>
                        )}

                        {phase === "exercise" && exercise.tracking === "TIME" && clock && (
                            <Ring
                                fraction={clock.kind === "precount" ? 1 : remaining / clock.total}
                                label={clock.kind === "precount" ? `Get ready, ${Math.ceil(remaining)}` : `${Math.ceil(remaining)} seconds left`}
                            >
                                {clock.kind === "precount" ? (
                                    <><small>Get ready</small><strong>{Math.ceil(remaining)}</strong></>
                                ) : (
                                    <strong>{clockText(remaining)}</strong>
                                )}
                            </Ring>
                        )}

                        {phase === "exercise" && exercise.tracking === "REPS" && (
                            <>
                                <div className="wt-fp-reps" aria-label={`${repsDraft} reps`}>×{repsDraft}</div>
                                <div className="wt-fp-adjust">
                                    <Stepper label="Reps" value={repsDraft} step={1} min={1} max={200} unit="" onChange={setRepsDraft} />
                                    {usesWeights(exercise) && (
                                        <Stepper label="Weight" value={weightDraft} step={2.5} min={0} max={500} unit=" kg" onChange={setWeightDraft} />
                                    )}
                                </div>
                            </>
                        )}

                        {showHowTo && (
                            <div className="wt-fp-howto">
                                <ExerciseHowTo name={exercise.name} open compact />
                            </div>
                        )}
                    </div>

                    {/* Controls: previous · main · skip */}
                    <div className="wt-fp-controls">
                        {phase === "ready" ? (
                            <button type="button" className="wt-fp-main wide" onClick={() => beginStep(0)}>
                                ▶ Start now
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="wt-fp-round"
                                    onClick={() => beginStep(stepIndex - 1)}
                                    disabled={stepIndex === 0}
                                    aria-label="Previous exercise"
                                >
                                    ⏮
                                </button>

                                {exercise.tracking === "REPS" ? (
                                    <button
                                        type="button"
                                        className="wt-fp-main wide"
                                        onClick={() => completeStep({ reps: repsDraft, weight: weightDraft, durationSeconds: 0 })}
                                    >
                                        ✓ Done
                                    </button>
                                ) : (
                                    <button type="button" className="wt-fp-main wide" onClick={pause}>
                                        ⏸ Pause
                                    </button>
                                )}

                                <button type="button" className="wt-fp-round" onClick={skipStep} aria-label="Skip exercise">
                                    ⏭
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* ---------------- PAUSE MENU ---------------- */}
            {paused && (
                <div className="wt-fp-overlay" role="dialog" aria-modal="true" aria-labelledby="wt-fp-paused-title">
                    <div className="wt-fp-sheet">
                        {confirmQuit ? (
                            <>
                                <h2 id="wt-fp-paused-title">Quit workout?</h2>
                                <p className="wt-fp-muted">
                                    {doneCount > 0
                                        ? `You finished ${doneCount} set${doneCount === 1 ? "" : "s"}. Save ${doneCount === 1 ? "it" : "them"} before you go?`
                                        : "Nothing has been finished yet, so nothing will be saved."}
                                </p>
                                {doneCount > 0 && (
                                    <button type="button" className="wt-fp-main wide" onClick={() => finish(records)}>
                                        Save and finish
                                    </button>
                                )}
                                <button type="button" className="wt-fp-secondary wide" onClick={quitWithoutSaving}>
                                    {doneCount > 0 ? "Quit without saving" : "Quit"}
                                </button>
                                <button type="button" className="wt-fp-link" onClick={resume}>Keep going</button>
                            </>
                        ) : (
                            <>
                                <h2 id="wt-fp-paused-title">Paused</h2>
                                <p className="wt-fp-muted">
                                    {phase === "rest" ? "Rest" : exercise.name}
                                    {clock ? ` · ${clockText(remaining)} left` : ""}
                                </p>
                                <button type="button" className="wt-fp-main wide" onClick={resume} autoFocus>
                                    ▶ Resume
                                </button>
                                {phase === "exercise" && (
                                    <button type="button" className="wt-fp-secondary wide" onClick={restartStep}>
                                        ↺ Restart this exercise
                                    </button>
                                )}
                                <button type="button" className="wt-fp-secondary wide danger" onClick={() => setConfirmQuit(true)}>
                                    Quit workout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default FollowAlongPlayer;
