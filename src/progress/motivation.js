// ==========================================
// PROGRESS & MOTIVATION - calculations
// ==========================================
// Weekly goal, streaks, calendar, BMI and calorie estimates.
// Dates are the phone's local dates as "YYYY-MM-DD" (like workoutDate).
// Weeks start on Monday.

import { pendingWorkouts } from "../offline/workoutOutbox";

export const DEFAULT_WEEKLY_GOAL = 3;

/*
 * Calories: MET x body weight (kg) x hours. MET 5 is a typical value for
 * a mixed strength / body-weight session (Compendium of Physical
 * Activities: about 3.5 for light and 6-8 for vigorous training).
 * It is an estimate; heart rate, effort and rest times change it a lot.
 */
export const WORKOUT_MET = 5;

export const FITNESS_GOALS = [
    { value: "BUILD_MUSCLE", label: "Build muscle", icon: "💪" },
    { value: "LOSE_WEIGHT", label: "Lose weight", icon: "🔥" },
    { value: "GET_FIT", label: "Get fitter", icon: "⚡" },
    { value: "STAY_ACTIVE", label: "Stay active", icon: "🙂" }
];

// ---------- dates ----------

export function dateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

export function parseKey(key) {
    const [year, month, day] = String(key).split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
}

export function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

export function startOfWeek(date) {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const offset = (monday.getDay() + 6) % 7; // Monday = 0
    return addDays(monday, -offset);
}

// ---------- workouts ----------

/*
 * Server workouts plus the ones still waiting on this phone, so a workout
 * done offline counts towards the week straight away.
 */
export function allWorkouts(serverSessions, pending = pendingWorkouts()) {
    const server = Array.isArray(serverSessions) ? serverSessions : [];
    const waiting = pending.map((entry) => ({
        ...entry.payload,
        pending: true
    }));

    return [...server, ...waiting].filter((workout) => workout?.workoutDate);
}

export function groupByDate(workouts) {
    const byDate = {};

    workouts.forEach((workout) => {
        const key = String(workout.workoutDate).slice(0, 10);
        (byDate[key] = byDate[key] || []).push(workout);
    });

    return byDate;
}

/*
 * This week (Mon-Sun) against the goal, and streaks of weeks in which
 * the goal was reached. The goal counts workout DAYS, so two sessions
 * on one day count once.
 * The current week only adds to the streak once its goal is reached;
 * until then the streak from earlier weeks is kept.
 */
export function weeklySummary(workouts, goal = DEFAULT_WEEKLY_GOAL, today = new Date()) {
    const target = Math.min(7, Math.max(1, Number(goal) || DEFAULT_WEEKLY_GOAL));
    const byDate = groupByDate(workouts);
    const activeDays = new Set(Object.keys(byDate));
    const weekStart = startOfWeek(today);
    const todayKey = dateKey(today);

    const days = Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index);
        const key = dateKey(date);

        return {
            key,
            label: date.toLocaleDateString(undefined, { weekday: "narrow" }),
            done: activeDays.has(key),
            today: key === todayKey,
            future: key > todayKey
        };
    });

    const daysDone = days.filter((day) => day.done).length;

    const weekDays = (start) => {
        let count = 0;
        for (let i = 0; i < 7; i++) {
            if (activeDays.has(dateKey(addDays(start, i)))) count++;
        }
        return count;
    };

    // Current streak: this week (if reached) + full weeks before it.
    let streak = daysDone >= target ? 1 : 0;
    for (let start = addDays(weekStart, -7); weekDays(start) >= target; start = addDays(start, -7)) {
        streak++;
    }

    // Best streak since the first workout.
    let best = 0;
    let run = 0;
    const keys = [...activeDays].sort();

    if (keys.length > 0) {
        for (let start = startOfWeek(parseKey(keys[0])); start <= weekStart; start = addDays(start, 7)) {
            run = weekDays(start) >= target ? run + 1 : 0;
            best = Math.max(best, run);
        }
    }

    const minutes = workouts
        .filter((workout) => {
            const key = String(workout.workoutDate).slice(0, 10);
            return key >= dateKey(weekStart) && key <= dateKey(addDays(weekStart, 6));
        })
        .reduce((sum, workout) => sum + (Number(workout.durationMinutes) || 0), 0);

    return {
        goal: target,
        days,
        daysDone,
        remaining: Math.max(0, target - daysDone),
        reached: daysDone >= target,
        streak,
        bestStreak: Math.max(best, streak),
        minutes
    };
}

// Month grid (Monday first) for the calendar.
export function monthGrid(year, month) {
    const start = startOfWeek(new Date(year, month, 1));
    const end = addDays(startOfWeek(new Date(year, month + 1, 0)), 6);
    const cells = [];

    for (let date = start; date <= end; date = addDays(date, 1)) {
        cells.push({ key: dateKey(date), day: date.getDate(), inMonth: date.getMonth() === month });
    }

    return cells;
}

// ---------- body ----------

export function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

export function latestWeight(weights) {
    const list = Array.isArray(weights) ? weights : [];
    return list.length ? list[list.length - 1] : null;
}

// Weight on a day: the last reading on or before it (else the first).
export function weightOn(weights, key) {
    const list = Array.isArray(weights) ? weights : [];
    if (list.length === 0) return null;

    let found = list[0];
    for (const entry of list) {
        if (entry.date <= key) found = entry;
    }

    return toNumber(found.weightKg);
}

// Change of the latest reading vs. the reading about `days` days before it.
export function weightChange(weights, days = 30) {
    const latest = latestWeight(weights);
    if (!latest || weights.length < 2) return null;

    const fromKey = dateKey(addDays(parseKey(latest.date), -days));
    let base = weights[0];

    for (const entry of weights) {
        if (entry.date <= fromKey) base = entry;
    }

    if (base === latest) base = weights[weights.length - 2];

    return {
        kg: Math.round((toNumber(latest.weightKg) - toNumber(base.weightKg)) * 10) / 10,
        since: base.date
    };
}

/*
 * BMI = kg / m². Standard adult (WHO) categories. BMI does not tell
 * muscle from fat, so muscular people can read "overweight".
 */
export function bmi(weightKg, heightCm) {
    const weight = toNumber(weightKg);
    const height = toNumber(heightCm);

    if (!weight || !height) return null;

    const value = Math.round((weight / ((height / 100) ** 2)) * 10) / 10;

    const category =
        value < 18.5 ? { label: "Underweight", tone: "warning" }
            : value < 25 ? { label: "Healthy weight", tone: "success" }
                : value < 30 ? { label: "Overweight", tone: "warning" }
                    : { label: "Obese", tone: "danger" };

    return { value, ...category };
}

// Healthy BMI 18.5-24.9 as a weight range for this height.
export function healthyWeightRange(heightCm) {
    const height = toNumber(heightCm);
    if (!height) return null;

    const m2 = (height / 100) ** 2;
    return { min: Math.round(18.5 * m2), max: Math.round(24.9 * m2) };
}

export function estimateCalories(minutes, weightKg) {
    const weight = toNumber(weightKg);
    const duration = toNumber(minutes);

    if (!weight || !duration) return null;

    return Math.round(WORKOUT_MET * weight * (duration / 60));
}

// ---------- last known weight (for the workout player) ----------

const LAST_WEIGHT_KEY = "wt.lastWeightKg";

export function rememberWeight(weightKg) {
    try {
        if (weightKg) localStorage.setItem(LAST_WEIGHT_KEY, String(weightKg));
    } catch {
        // Not important.
    }
}

export function rememberedWeight() {
    try {
        return toNumber(localStorage.getItem(LAST_WEIGHT_KEY));
    } catch {
        return null;
    }
}
