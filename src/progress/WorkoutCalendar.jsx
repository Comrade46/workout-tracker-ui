import { useMemo, useState } from "react";
import { cleanProgramNotes } from "../data/programs";
import {
    dateKey,
    estimateCalories,
    groupByDate,
    monthGrid,
    parseKey,
    weightOn
} from "./motivation";
import "./Progress.css";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/*
 * Month view of workout days. Filled = workout saved, dashed = saved on
 * this phone and waiting to upload. Tap a day to see its workouts.
 */
function WorkoutCalendar({ workouts, weights = [] }) {
    const today = new Date();
    const todayKey = dateKey(today);
    const [month, setMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
    const [selected, setSelected] = useState(null);

    const byDate = useMemo(() => groupByDate(workouts), [workouts]);
    const cells = monthGrid(month.year, month.month);

    const firstKey = useMemo(() => Object.keys(byDate).sort()[0] || todayKey, [byDate, todayKey]);
    const first = parseKey(firstKey);
    const canGoBack =
        month.year > first.getFullYear() ||
        (month.year === first.getFullYear() && month.month > first.getMonth());
    const canGoForward =
        month.year < today.getFullYear() ||
        (month.year === today.getFullYear() && month.month < today.getMonth());

    const move = (step) => {
        const date = new Date(month.year, month.month + step, 1);
        setMonth({ year: date.getFullYear(), month: date.getMonth() });
        setSelected(null);
    };

    const monthLabel = new Date(month.year, month.month, 1).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric"
    });

    const activeInMonth = cells.filter((cell) => cell.inMonth && byDate[cell.key]).length;
    const selectedWorkouts = selected ? byDate[selected] || [] : [];

    return (
        <section className="wt-pr-card" aria-labelledby="wt-calendar-title" style={{ marginBottom: 24 }}>
            <div className="wt-pr-card-head" style={{ marginBottom: 8 }}>
                <h2 className="wt-pr-card-title" id="wt-calendar-title">🗓️ Workout calendar</h2>
                <span className="wt-pr-muted">
                    {activeInMonth} workout day{activeInMonth === 1 ? "" : "s"}
                </span>
            </div>

            <div className="wt-pr-calendar-head">
                <button
                    type="button"
                    className="wt-pr-nav-button"
                    onClick={() => move(-1)}
                    disabled={!canGoBack}
                    aria-label="Previous month"
                >
                    ‹
                </button>
                <div className="wt-pr-month" aria-live="polite">{monthLabel}</div>
                <button
                    type="button"
                    className="wt-pr-nav-button"
                    onClick={() => move(1)}
                    disabled={!canGoForward}
                    aria-label="Next month"
                >
                    ›
                </button>
            </div>

            <div className="wt-pr-calendar" role="group" aria-label={`Workouts in ${monthLabel}`}>
                {WEEKDAYS.map((day, index) => (
                    <div key={index} className="wt-pr-weekday" aria-hidden="true">{day}</div>
                ))}

                {cells.map((cell) => {
                    const list = byDate[cell.key] || [];
                    const onlyPending = list.length > 0 && list.every((workout) => workout.pending);
                    const classes = [
                        "wt-pr-day-button",
                        cell.inMonth ? "" : "outside",
                        list.length ? (onlyPending ? "pending" : "active") : "",
                        cell.key === todayKey ? "today" : "",
                        cell.key === selected ? "selected" : ""
                    ].filter(Boolean).join(" ");

                    return (
                        <button
                            key={cell.key}
                            type="button"
                            className={classes}
                            onClick={() => list.length && setSelected(cell.key === selected ? null : cell.key)}
                            aria-pressed={cell.key === selected}
                            aria-label={`${parseKey(cell.key).toLocaleDateString(undefined, { day: "numeric", month: "long" })}${
                                list.length ? `, ${list.length} workout${list.length === 1 ? "" : "s"}` : ""
                            }`}
                            tabIndex={list.length ? 0 : -1}
                        >
                            {cell.day}
                            {list.length > 1 && <span className="wt-pr-day-count">×{list.length}</span>}
                        </button>
                    );
                })}
            </div>

            {selected && selectedWorkouts.length > 0 && (
                <div className="wt-pr-day-list" aria-live="polite">
                    <strong>
                        {parseKey(selected).toLocaleDateString(undefined, {
                            weekday: "long",
                            day: "numeric",
                            month: "long"
                        })}
                    </strong>

                    {selectedWorkouts.map((workout, index) => {
                        const kcal = estimateCalories(workout.durationMinutes, weightOn(weights, selected));

                        return (
                            <div key={workout.id || workout.clientId || index} className="wt-pr-day-item">
                                <strong>{cleanProgramNotes(workout.notes) || "Workout"}</strong>
                                <div className="wt-pr-muted">
                                    {workout.pending && "⏳ waiting to upload · "}
                                    ⏱️ {workout.durationMinutes ?? 0} min
                                    {workout.totalSets != null && ` · ${workout.totalSets} set${workout.totalSets === 1 ? "" : "s"}`}
                                    {kcal ? ` · ≈ ${kcal} kcal` : ""}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default WorkoutCalendar;
