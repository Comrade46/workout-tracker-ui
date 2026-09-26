// ==========================================
// REWARDS, DIFFICULTY AND "CONTINUE YOUR PLAN"
// ==========================================
// - personal records (best reps / weight / time per exercise)
// - badges earned from all workouts
// - "How did it feel?" -> next time a bit easier or harder
// - the next program workout for the Home screen
// Workouts are server sessions plus ones still waiting on this phone.

import { PROGRAMS, completedProgramDays, getProgram } from "../data/programs";
import { DEFAULT_WEEKLY_GOAL, weeklySummary } from "./motivation";

// ---------- markers in workout notes ----------

const PROGRAM_MARKER = /\[program:([a-z0-9-]+):([a-z0-9-]+)\]/;
const PLAN_MARKER = /\[plan:(\d+)\]/;

export function planMarker(planId) {
    return `[plan:${planId}]`;
}

// Program / plan a workout belongs to, e.g. "program:challenge30-beginner"
export function workoutKey(notes) {
    const text = String(notes || "");
    const program = text.match(PROGRAM_MARKER);
    if (program) return `program:${program[1]}`;
    const plan = text.match(PLAN_MARKER);
    return plan ? `plan:${plan[1]}` : null;
}

// Newest first (date, then server id / queue time).
function newestFirst(workouts) {
    return [...workouts].sort((a, b) => {
        const byDate = String(b.workoutDate).localeCompare(String(a.workoutDate));
        if (byDate !== 0) return byDate;
        return (b.id || b.createdAt || 0) > (a.id || a.createdAt || 0) ? 1 : -1;
    });
}

// ---------- personal records ----------

// Best per exercise: { [exerciseId]: { reps, weight, seconds } }
export function personalBests(workouts) {
    const bests = {};

    workouts.forEach((workout) => {
        (workout.sets || []).forEach((set) => {
            const id = set.exerciseId;
            if (id == null) return;

            const best = bests[id] || { reps: 0, weight: 0, seconds: 0 };
            best.reps = Math.max(best.reps, Number(set.reps) || 0);
            best.weight = Math.max(best.weight, Number(set.weight) || 0);
            best.seconds = Math.max(best.seconds, Number(set.durationSeconds) || 0);
            bests[id] = best;
        });
    });

    return bests;
}

/*
 * Records beaten by this workout's sets. Only exercises done before
 * count (the first time is not a "record").
 * sets: [{ exerciseId, name, reps, weight, durationSeconds }]
 */
export function newRecords(bestsBefore, sets) {
    const found = {};

    sets.forEach((set) => {
        const before = bestsBefore[set.exerciseId];
        if (!before) return;

        const weight = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        const seconds = Number(set.durationSeconds) || 0;
        let text = null;

        if (seconds > 0 && seconds > before.seconds && before.seconds > 0) {
            text = `${seconds}s (before ${before.seconds}s)`;
        } else if (weight > 0 && weight > before.weight && before.weight > 0) {
            text = `${weight} kg (before ${before.weight} kg)`;
        } else if (weight === 0 && reps > before.reps && before.reps > 0) {
            text = `${reps} reps (before ${before.reps})`;
        }

        if (text) found[set.exerciseId] = { name: set.name, text };
    });

    return Object.values(found);
}

// ---------- badges ----------

export const BADGES = [
    { id: "first", icon: "🥇", title: "First workout", hint: "Finish 1 workout" },
    { id: "ten", icon: "🔟", title: "10 workouts", hint: "Finish 10 workouts" },
    { id: "twentyfive", icon: "🏅", title: "25 workouts", hint: "Finish 25 workouts" },
    { id: "fifty", icon: "🎖️", title: "50 workouts", hint: "Finish 50 workouts" },
    { id: "hundred", icon: "💯", title: "100 workouts", hint: "Finish 100 workouts" },
    { id: "streak2", icon: "🔥", title: "2-week streak", hint: "Reach your weekly goal 2 weeks in a row" },
    { id: "streak4", icon: "⚡", title: "4-week streak", hint: "Reach your weekly goal 4 weeks in a row" },
    { id: "streak8", icon: "🏆", title: "8-week streak", hint: "Reach your weekly goal 8 weeks in a row" },
    { id: "hours10", icon: "⏱️", title: "10 hours trained", hint: "Train for 10 hours in total" },
    { id: "challenge", icon: "👑", title: "Challenge finisher", hint: "Finish every day of a 30-day challenge" }
];

// Ids of the badges these workouts have earned.
export function earnedBadges(workouts, weeklyGoal = DEFAULT_WEEKLY_GOAL) {
    const count = workouts.length;
    const minutes = workouts.reduce((sum, w) => sum + (Number(w.durationMinutes) || 0), 0);
    const { bestStreak } = weeklySummary(workouts, weeklyGoal);
    const done = completedProgramDays(workouts);

    const challengeDone = PROGRAMS.some(
        (program) =>
            program.type === "challenge" &&
            program.days.every((day) => day.rest || done[`${program.id}:${day.key}`])
    );

    const earned = [];
    if (count >= 1) earned.push("first");
    if (count >= 10) earned.push("ten");
    if (count >= 25) earned.push("twentyfive");
    if (count >= 50) earned.push("fifty");
    if (count >= 100) earned.push("hundred");
    if (bestStreak >= 2) earned.push("streak2");
    if (bestStreak >= 4) earned.push("streak4");
    if (bestStreak >= 8) earned.push("streak8");
    if (minutes >= 600) earned.push("hours10");
    if (challengeDone) earned.push("challenge");
    return earned;
}

export function badgeById(id) {
    return BADGES.find((badge) => badge.id === id);
}

// ---------- "How did it feel?" -> difficulty ----------

export const FEELINGS = [
    { value: "EASY", icon: "😌", label: "Too easy" },
    { value: "RIGHT", icon: "👍", label: "Just right" },
    { value: "HARD", icon: "😰", label: "Too hard" }
];

const MAX_LEVEL = 3;

/*
 * Level for the next workout of this program / plan: the level used last
 * time, +1 if it felt too easy, -1 if too hard (10% per level, -3..+3).
 */
export function nextIntensity(workouts, key) {
    if (!key) return { level: 0, feeling: null };

    const last = newestFirst(workouts).find((workout) => workoutKey(workout.notes) === key);
    if (!last) return { level: 0, feeling: null };

    const step = last.feeling === "EASY" ? 1 : last.feeling === "HARD" ? -1 : 0;
    const level = Math.max(-MAX_LEVEL, Math.min(MAX_LEVEL, (Number(last.intensity) || 0) + step));

    return { level, feeling: last.feeling || null };
}

// Target adjusted by the level: reps rounded, seconds to 5 s steps.
export function adjustTarget(target, tracking, level) {
    const factor = 1 + level / 10;

    return tracking === "TIME"
        ? Math.max(10, Math.round((target * factor) / 5) * 5)
        : Math.max(1, Math.round(target * factor));
}

// ---------- "Continue your plan" ----------

function nextChallengeDay(program, done) {
    return program.days.find((day) => !day.rest && !done[`${program.id}:${day.key}`]) || null;
}

// Split programs repeat: the day after the one done last.
function nextSplitDay(program, lastDayKey) {
    const days = program.days.filter((day) => !day.rest);
    const index = days.findIndex((day) => day.key === lastDayKey);
    return days[(index + 1) % days.length] || days[0];
}

/*
 * The program workout to show on Home:
 * { program, day, isNew } or { program, finished: true } for a finished
 * challenge. With no program history, a starting suggestion that fits the
 * user's main goal.
 */
export function nextProgramWorkout(workouts, fitnessGoal) {
    const done = completedProgramDays(workouts);

    for (const workout of newestFirst(workouts)) {
        const match = String(workout.notes || "").match(PROGRAM_MARKER);
        if (!match) continue;

        const program = getProgram(match[1]);
        if (!program || program.type === "focus") continue;

        if (program.type === "challenge") {
            const day = nextChallengeDay(program, done);
            return day ? { program, day, isNew: false } : { program, finished: true };
        }

        return { program, day: nextSplitDay(program, match[2]), isNew: false };
    }

    const suggestion = getProgram(fitnessGoal === "BUILD_MUSCLE" ? "fullbody3-beginner" : "challenge30-beginner");
    return suggestion ? { program: suggestion, day: suggestion.days.find((day) => !day.rest), isNew: true } : null;
}

// The next level of a finished challenge, if there is one.
export function nextChallengeLevel(program) {
    const order = ["Beginner", "Intermediate", "Advanced"];
    const next = order[order.indexOf(program.level) + 1];
    return next ? PROGRAMS.find((p) => p.type === "challenge" && p.level === next) || null : null;
}
