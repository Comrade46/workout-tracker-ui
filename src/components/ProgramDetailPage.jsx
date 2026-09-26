import { Link, Navigate, useParams } from "react-router-dom";
import ExerciseImage from "./ExerciseImage";
import useProgramProgress, { countDone, nextDay } from "./useProgramProgress";
import { getProgram } from "../data/programs";
import "./Programs.css";

function ProgramDetailPage() {
    const { programId } = useParams();
    const program = getProgram(programId);
    const { done } = useProgramProgress();

    if (!program) {
        return <Navigate to="/programs" replace />;
    }

    // Body-part workouts have a single session: go straight to it.
    if (program.type === "focus") {
        return <Navigate to={`/programs/${program.id}/workout`} replace />;
    }

    const workouts = program.days.filter((day) => !day.rest).length;
    const completed = countDone(done, program);
    const upNext = nextDay(done, program);

    // Group the 30 days into weeks of 7.
    const weeks = [];
    for (let i = 0; i < program.days.length; i += 7) {
        weeks.push(program.days.slice(i, i + 7));
    }

    return (
        <div className="wt-prog-page">
            <div className="wt-prog-container">

                <Link to="/programs" className="wt-prog-back">← Programs</Link>

                <div className="wt-prog-hero">
                    <ExerciseImage
                        name={program.cover}
                        height={170}
                        rounded={0}
                        animate={false}
                    />

                    <div className="wt-prog-hero-body">
                        <div className="wt-prog-badges">
                            <span className="wt-prog-level">{program.level}</span>
                            <span className="wt-prog-meta">{program.place}</span>
                        </div>

                        <h1 className="wt-prog-title">{program.title}</h1>
                        <p className="wt-prog-subtitle">{program.summary}</p>

                        <div className="wt-prog-progress" aria-hidden="true">
                            <span style={{ width: `${(completed / workouts) * 100}%` }} />
                        </div>

                        <div className="wt-prog-meta">
                            {completed}/{workouts} workouts done
                            {upNext ? ` · next: ${upNext.title}` : " · all done! 🎉"}
                        </div>
                    </div>
                </div>

                {program.type === "challenge" ? (
                    <div className="wt-prog-weeks">
                        {weeks.map((week, index) => (
                            <div key={index}>
                                <div className="wt-prog-week-label">WEEK {index + 1}</div>

                                <div className="wt-prog-days">
                                    {week.map((day) => {
                                        const dayNumber = day.key.replace("day-", "");
                                        const isDone = !day.rest && done[`${program.id}:${day.key}`];
                                        const isNext = upNext && upNext.key === day.key;

                                        return (
                                            <Link
                                                key={day.key}
                                                to={`/programs/${program.id}/${day.key}`}
                                                className={`wt-prog-day${isDone ? " done" : ""}${isNext ? " next" : ""}${day.rest ? " rest" : ""}`}
                                                aria-label={`${day.title}${day.rest ? ", rest day" : isDone ? ", done" : isNext ? ", next workout" : ""}`}
                                            >
                                                {day.rest ? "💤" : isDone ? "✓" : dayNumber}
                                                <small>{day.rest ? "Rest" : isDone ? `Day ${dayNumber}` : isNext ? "Next" : ""}</small>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="wt-prog-daylist">
                        {program.days.map((day) => {
                            const times = done[`${program.id}:${day.key}`] || 0;

                            return (
                                <Link
                                    key={day.key}
                                    to={`/programs/${program.id}/${day.key}`}
                                    className="wt-prog-dayrow"
                                >
                                    <ExerciseImage
                                        name={day.exercises[0]?.name}
                                        height={72}
                                        animate={false}
                                        rounded={12}
                                        style={{ width: 96, flexShrink: 0 }}
                                        fallback={<div className="wt-prog-thumb-fallback">🏋️</div>}
                                    />

                                    <div className="wt-prog-dayrow-text">
                                        <div className="wt-prog-dayrow-title">
                                            {day.title} · {day.subtitle}
                                        </div>

                                        <div className="wt-prog-meta">
                                            {day.exercises.length} exercises ·{" "}
                                            {day.exercises.reduce((sum, item) => sum + item.sets, 0)} sets
                                        </div>

                                        {day.focus && (
                                            <div className="wt-prog-meta">✅ {day.focus}</div>
                                        )}
                                    </div>

                                    {times > 0 && (
                                        <span className="wt-prog-done-badge">✓ {times}×</span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {upNext && (
                <div className="wt-prog-start">
                    <div className="wt-prog-start-inner">
                        <Link
                            to={`/programs/${program.id}/${upNext.key}`}
                            className="wt-prog-primary"
                        >
                            {completed === 0 ? "Start " : "Continue: "}
                            {upNext.title}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProgramDetailPage;
