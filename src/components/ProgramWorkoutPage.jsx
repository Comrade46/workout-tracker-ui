import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosConfig";
import ExerciseImage from "./ExerciseImage";
import ExerciseHowTo from "./ExerciseHowTo";
import useProgramProgress from "./useProgramProgress";
import { describeSetTarget, getProgram, getProgramDay } from "../data/programs";
import "./Programs.css";

const CATEGORY_ICON = {
    Chest: "💪", Back: "🔙", Shoulders: "🏋️", Arms: "💪",
    Legs: "🦵", Core: "🔥", Cardio: "🏃"
};

// Rough duration: work time + rest between sets.
function estimateMinutes(exercises, library) {
    const seconds = exercises.reduce((sum, item) => {
        const info = library.get(item.name.toLowerCase());
        const isTime = info ? info.trackingType === "TIME" : item.seconds != null;
        const work = isTime ? item.seconds ?? 30 : (item.reps ?? 10) * 3;
        return sum + item.sets * (work + item.rest);
    }, 0);

    return Math.max(5, Math.round(seconds / 60 / 5) * 5);
}

function ProgramWorkoutPage() {
    const { programId, dayKey } = useParams();
    const navigate = useNavigate();

    const program = getProgram(programId);
    const day = getProgramDay(program, dayKey);
    const { done } = useProgramProgress();

    // Exercise Library, to show the right TIME/REPS and spot missing ones.
    const [library, setLibrary] = useState(null);

    useEffect(() => {
        let cancelled = false;

        api.get("/exercises")
            .then((response) => {
                if (!cancelled && Array.isArray(response.data)) {
                    setLibrary(new Map(response.data.map((e) => [e.name.toLowerCase(), e])));
                }
            })
            .catch(() => {
                if (!cancelled) setLibrary(new Map());
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (!program || !day) {
        return <Navigate to="/programs" replace />;
    }

    const backPath = program.type === "focus" ? "/programs" : `/programs/${program.id}`;
    const times = done[`${program.id}:${day.key}`] || 0;

    if (day.rest) {
        return (
            <div className="wt-prog-page">
                <div className="wt-prog-container">
                    <Link to={backPath} className="wt-prog-back">← {program.title}</Link>

                    <div className="wt-prog-hero">
                        <div className="wt-prog-hero-body" style={{ alignItems: "center", textAlign: "center", padding: "40px 20px" }}>
                            <div style={{ fontSize: 48 }}>💤</div>
                            <h1 className="wt-prog-title">{day.title}: Rest day</h1>
                            <p className="wt-prog-subtitle">
                                Muscles grow while you recover. Sleep well, drink water,
                                and take a light walk or stretch if you feel stiff.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const lib = library || new Map();
    const missing = library ? day.exercises.filter((item) => !lib.has(item.name.toLowerCase())) : [];
    const totalSets = day.exercises.reduce((sum, item) => sum + item.sets, 0);

    return (
        <div className="wt-prog-page">
            <div className="wt-prog-container">

                <Link to={backPath} className="wt-prog-back">
                    ← {program.type === "focus" ? "Programs" : program.title}
                </Link>

                <div className="wt-prog-eyebrow">
                    {program.type === "focus" ? "Focus workout" : program.title}
                </div>

                <h1 className="wt-prog-title">
                    {program.type === "focus" ? `${program.icon} ${program.title}` : `${day.title} · ${day.subtitle}`}
                </h1>

                <div className="wt-prog-badges" style={{ marginBottom: 10 }}>
                    <span className="wt-prog-level">{program.level}</span>
                    {times > 0 && <span className="wt-prog-done-badge">✓ Done {times}×</span>}
                </div>

                <div className="wt-prog-stats">
                    <span>🏋️ {day.exercises.length} exercises</span>
                    <span>🔁 {totalSets} sets</span>
                    <span>⏱ about {estimateMinutes(day.exercises, lib)} min</span>
                    <span>📍 {program.place}</span>
                </div>

                {day.focus && <div className="wt-prog-note">✅ Focus: {day.focus}</div>}

                {missing.length > 0 && (
                    <div className="wt-prog-warning">
                        Not in your Exercise Library yet (skipped in the player):{" "}
                        {missing.map((item) => item.name).join(", ")}
                    </div>
                )}

                <div className="wt-prog-exlist">
                    {day.exercises.map((item, index) => {
                        const info = lib.get(item.name.toLowerCase());

                        return (
                            <div key={`${item.name}-${index}`} className="wt-prog-ex">
                                <div className="wt-prog-ex-main">
                                    <div className="wt-prog-ex-num">{index + 1}</div>

                                    <ExerciseImage
                                        name={item.name}
                                        height={72}
                                        animate={false}
                                        rounded={12}
                                        style={{ width: 96, flexShrink: 0 }}
                                        fallback={
                                            <div className="wt-prog-thumb-fallback">
                                                {CATEGORY_ICON[info?.category] || "⚡"}
                                            </div>
                                        }
                                    />

                                    <div style={{ minWidth: 0 }}>
                                        <div className="wt-prog-ex-name">{item.name}</div>
                                        <div className="wt-prog-ex-target">
                                            {describeSetTarget(item, info?.trackingType)} · rest {item.rest}s
                                        </div>
                                    </div>
                                </div>

                                <ExerciseHowTo name={item.name} compact />
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="wt-prog-start">
                <div className="wt-prog-start-inner">
                    <button
                        type="button"
                        className="wt-prog-primary"
                        onClick={() => navigate(`/programs/${program.id}/${day.key}/play`)}
                        disabled={library !== null && missing.length === day.exercises.length}
                    >
                        ▶ Start workout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProgramWorkoutPage;
