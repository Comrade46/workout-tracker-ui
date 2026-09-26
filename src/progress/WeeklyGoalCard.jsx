import { Link } from "react-router-dom";
import {
    DEFAULT_WEEKLY_GOAL,
    estimateCalories,
    weeklySummary,
    weightOn
} from "./motivation";
import "./Progress.css";

function GoalRing({ done, goal }) {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(1, goal ? done / goal : 0);

    return (
        <div className="wt-pr-ring" role="img" aria-label={`${done} of ${goal} workout days this week`}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle className="wt-pr-ring-track" cx="50" cy="50" r={radius} fill="none" strokeWidth="10" />
                <circle
                    className="wt-pr-ring-value"
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                />
            </svg>
            <div className="wt-pr-ring-label" aria-hidden="true">
                <strong>{done}/{goal}</strong>
                <small>days</small>
            </div>
        </div>
    );
}

function weekMessage(summary) {
    if (summary.reached) {
        return summary.daysDone > summary.goal ? "Goal smashed! 🎉" : "Weekly goal reached! 🎉";
    }

    if (summary.daysDone === 0) {
        return `${summary.goal} workout days to go this week - you've got this 💪`;
    }

    return `${summary.remaining} more workout day${summary.remaining === 1 ? "" : "s"} to reach your goal`;
}

/*
 * This week at a glance: workout days vs. goal, Mon-Sun ticks, weekly
 * streak and an estimate of calories burned.
 */
function WeeklyGoalCard({ workouts, weeklyGoal, weights }) {
    const summary = weeklySummary(workouts, weeklyGoal || DEFAULT_WEEKLY_GOAL);

    const weekKeys = new Set(summary.days.map((day) => day.key));
    const calories = workouts
        .filter((workout) => weekKeys.has(String(workout.workoutDate).slice(0, 10)))
        .reduce((sum, workout) => {
            const kcal = estimateCalories(
                workout.durationMinutes,
                weightOn(weights, String(workout.workoutDate).slice(0, 10))
            );
            return sum + (kcal || 0);
        }, 0);

    return (
        <section className="wt-pr-card" aria-labelledby="wt-week-title">
            <div className="wt-pr-card-head">
                <h2 className="wt-pr-card-title" id="wt-week-title">📅 This week</h2>
                <Link to="/profile#goals" className="wt-pr-link">
                    Goal: {summary.goal} days ›
                </Link>
            </div>

            <div className="wt-pr-week-top">
                <GoalRing done={summary.daysDone} goal={summary.goal} />

                <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="wt-pr-week-message">{weekMessage(summary)}</div>

                    <div className="wt-pr-days">
                        {summary.days.map((day) => (
                            <div
                                key={day.key}
                                className={`wt-pr-day${day.done ? " done" : ""}${day.today ? " today" : ""}`}
                                title={day.key}
                            >
                                <div className="wt-pr-day-dot" aria-hidden="true">
                                    {day.done ? "✓" : ""}
                                </div>
                                <span>{day.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="wt-pr-stats">
                <span className="wt-pr-stat" title="Weeks in a row with your goal reached">
                    {summary.streak > 0 ? `🔥 ${summary.streak}-week streak` : "🔥 Reach your goal to start a streak"}
                </span>
                {summary.bestStreak > summary.streak && (
                    <span className="wt-pr-stat">🏆 Best {summary.bestStreak}</span>
                )}
                <span className="wt-pr-stat">⏱️ {summary.minutes} min</span>
                {calories > 0 ? (
                    <span className="wt-pr-stat" title="Estimate from workout time and your body weight">
                        ⚡ ≈ {calories} kcal
                    </span>
                ) : (
                    weights.length === 0 && (
                        <Link to="/body" className="wt-pr-stat wt-pr-link">⚖️ Add weight for calories</Link>
                    )
                )}
            </div>
        </section>
    );
}

export default WeeklyGoalCard;
