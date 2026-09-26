import { Link } from "react-router-dom";
import ExerciseImage from "../components/ExerciseImage";
import { nextChallengeLevel, nextProgramWorkout } from "./achievements";
import "./Progress.css";

// Rough length: work time + rest between sets.
function estimateMinutes(exercises) {
    const seconds = exercises.reduce(
        (sum, item) => sum + item.sets * ((item.seconds ?? (item.reps ?? 10) * 3) + (item.rest ?? 30)),
        0
    );
    return Math.max(5, Math.round(seconds / 60 / 5) * 5);
}

/*
 * Home screen: the next workout of the program you're doing, one tap to
 * start (like "Continue" in the Home Workout app). New users get a
 * starting suggestion that fits their main goal.
 */
function ContinueCard({ workouts, fitnessGoal }) {
    const next = nextProgramWorkout(workouts, fitnessGoal);
    if (!next) return null;

    const { program } = next;

    if (next.finished) {
        const upgrade = nextChallengeLevel(program);

        return (
            <section className="wt-pr-card wt-pr-continue" aria-labelledby="wt-continue-title">
                <div className="wt-pr-continue-body">
                    <div className="wt-pr-eyebrow">🎉 Challenge complete</div>
                    <h2 className="wt-pr-card-title" id="wt-continue-title">
                        {program.title} ({program.level})
                    </h2>
                    <p className="wt-pr-muted">
                        {upgrade ? `Ready for the next level? Try ${upgrade.level}.` : "You finished the hardest level - amazing!"}
                    </p>
                    <div className="wt-pr-continue-actions">
                        <Link to={upgrade ? `/programs/${upgrade.id}` : "/programs"} className="wt-pr-button wt-pr-cta">
                            {upgrade ? `Start ${upgrade.level}` : "Browse programs"}
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    const { day, isNew } = next;
    const dayLabel = program.type === "challenge" ? day.title : `${day.title} · ${day.subtitle}`;

    return (
        <section className="wt-pr-card wt-pr-continue" aria-labelledby="wt-continue-title">
            <ExerciseImage
                name={day.exercises[0]?.name}
                height={120}
                rounded={14}
                animate={false}
                style={{ width: 150, flexShrink: 0 }}
                fallback={<div className="wt-pr-continue-thumb" aria-hidden="true">🏋️</div>}
            />

            <div className="wt-pr-continue-body">
                <div className="wt-pr-eyebrow">{isNew ? "✨ Start here" : "▶ Continue"}</div>
                <h2 className="wt-pr-card-title" id="wt-continue-title">{program.title}</h2>
                <div className="wt-pr-muted">
                    {dayLabel} · {program.level}
                </div>
                <div className="wt-pr-muted">
                    {day.exercises.length} exercises · about {estimateMinutes(day.exercises)} min
                </div>

                <div className="wt-pr-continue-actions">
                    <Link to={`/programs/${program.id}/${day.key}/play`} className="wt-pr-button wt-pr-cta">
                        ▶ Start
                    </Link>
                    <Link to={`/programs/${program.id}/${day.key}`} className="wt-pr-link">
                        See exercises ›
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default ContinueCard;
