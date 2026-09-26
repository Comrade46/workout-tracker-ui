import { useState } from "react";
import { Link } from "react-router-dom";
import ExerciseImage from "./ExerciseImage";
import useProgramProgress, { countDone, nextDay } from "./useProgramProgress";
import { FOCUS_AREA_LIST, LEVELS, PROGRAMS } from "../data/programs";
import "./Programs.css";

const LEVEL_STORAGE_KEY = "workoutTrackerProgramLevel";

function readLevel() {
    try {
        return localStorage.getItem(LEVEL_STORAGE_KEY) || "All";
    } catch {
        return "All";
    }
}

function Cover({ name, height = 130 }) {
    return (
        <ExerciseImage
            name={name}
            height={height}
            animate={false}
            rounded={0}
            fallback={
                <div
                    className="wt-prog-thumb-fallback"
                    style={{ width: "100%", height, borderRadius: 0 }}
                >
                    🏋️
                </div>
            }
        />
    );
}

function ProgramsPage() {
    const [level, setLevel] = useState(readLevel);
    const { done } = useProgramProgress();

    const chooseLevel = (value) => {
        setLevel(value);

        try {
            localStorage.setItem(LEVEL_STORAGE_KEY, value);
        } catch {
            // Remembering the filter is optional.
        }
    };

    const matchesLevel = (program) =>
        level === "All" || program.level === level;

    const challenges = PROGRAMS.filter(
        (program) => program.type === "challenge" && matchesLevel(program)
    );

    const splits = PROGRAMS.filter(
        (program) => program.type === "split" && matchesLevel(program)
    );

    const focusLevels = level === "All" ? LEVELS : [level];

    return (
        <div className="wt-prog-page">
            <div className="wt-prog-container">

                <div className="wt-prog-eyebrow">Programs</div>
                <h1 className="wt-prog-title">Ready-made workouts</h1>
                <p className="wt-prog-subtitle">
                    Pick your level and follow a plan: a 30-day challenge,
                    a muscle-building split or a quick workout for one body part.
                </p>

                <div className="wt-prog-chips" role="group" aria-label="Filter by level">
                    {["All", ...LEVELS].map((value) => (
                        <button
                            key={value}
                            type="button"
                            className="wt-prog-chip"
                            aria-pressed={level === value}
                            onClick={() => chooseLevel(value)}
                        >
                            {value}
                        </button>
                    ))}
                </div>

                {/* ---------- 30-day challenge ---------- */}

                {challenges.length > 0 && (
                    <section className="wt-prog-section">
                        <h2>🏆 30-Day Challenge</h2>
                        <p>Home workouts, no equipment. A little harder every week.</p>

                        <div className="wt-prog-grid">
                            {challenges.map((program) => {
                                const workouts = program.days.filter((day) => !day.rest).length;
                                const completed = countDone(done, program);
                                const upNext = nextDay(done, program);

                                return (
                                    <Link
                                        key={program.id}
                                        to={`/programs/${program.id}`}
                                        className="wt-prog-card"
                                    >
                                        <Cover name={program.cover} />

                                        <div className="wt-prog-card-body">
                                            <div className="wt-prog-badges">
                                                <span className="wt-prog-level">{program.level}</span>
                                            </div>

                                            <h3 className="wt-prog-card-title">{program.title}</h3>
                                            <div className="wt-prog-meta">{program.place}</div>

                                            <div className="wt-prog-progress" aria-hidden="true">
                                                <span style={{ width: `${(completed / workouts) * 100}%` }} />
                                            </div>

                                            <div className="wt-prog-meta">
                                                {completed === 0
                                                    ? `${workouts} workouts · start with Day 1`
                                                    : upNext
                                                        ? `${completed}/${workouts} done · next: ${upNext.title}`
                                                        : "Challenge complete! 🎉"}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ---------- Muscle-building splits ---------- */}

                {splits.length > 0 && (
                    <section className="wt-prog-section">
                        <h2>💪 Muscle Building</h2>
                        <p>Weekly gym splits. Repeat the week and add weight when sets feel easy.</p>

                        <div className="wt-prog-grid">
                            {splits.map((program) => (
                                <Link
                                    key={program.id}
                                    to={`/programs/${program.id}`}
                                    className="wt-prog-card"
                                >
                                    <Cover name={program.cover} />

                                    <div className="wt-prog-card-body">
                                        <div className="wt-prog-badges">
                                            <span className="wt-prog-level">{program.level}</span>
                                            {countDone(done, program) > 0 && (
                                                <span className="wt-prog-done-badge">
                                                    ✓ {countDone(done, program)}/{program.days.length} days done
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="wt-prog-card-title">{program.title}</h3>
                                        <div className="wt-prog-meta">{program.place}</div>
                                        <div className="wt-prog-summary">{program.summary}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ---------- Focus areas ---------- */}

                <section className="wt-prog-section">
                    <h2>🎯 Focus Areas</h2>
                    <p>One workout for one body part. Choose your level.</p>

                    <div className="wt-prog-focus-grid">
                        {FOCUS_AREA_LIST.map((focus) => {
                            const slug = focus.area.toLowerCase().replace(/[^a-z]+/g, "-");

                            return (
                                <div key={focus.area} className="wt-prog-focus">
                                    <Cover name={focus.cover} height={110} />

                                    <div className="wt-prog-focus-name">
                                        {focus.icon} {focus.area}
                                    </div>

                                    <div
                                        className="wt-prog-focus-levels"
                                        style={focusLevels.length === 1 ? { gridTemplateColumns: "1fr" } : undefined}
                                    >
                                        {focusLevels.map((value) => {
                                            const id = `${slug}-${value.toLowerCase()}`;
                                            const doneCount = done[`${id}:workout`] || 0;

                                            return (
                                                <Link
                                                    key={value}
                                                    to={`/programs/${id}/workout`}
                                                    aria-label={`${focus.area} workout, ${value}`}
                                                >
                                                    {value}
                                                    {doneCount > 0 ? " ✓" : ""}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ProgramsPage;
