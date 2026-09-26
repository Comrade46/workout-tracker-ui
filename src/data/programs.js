// ==========================================
// READY-MADE PROGRAMS
// ==========================================
// Exercise names must match the Exercise Library (built-in exercises are
// added by the backend on start-up). TIME / REPS always comes from the
// library; here `reps` or `seconds` is the target for each set.
//
//   r(name, sets, reps, restSeconds, "8-12")  -> reps exercise (+ label)
//   t(name, sets, seconds, restSeconds)       -> timed exercise
//
// Progress is stored with the saved workout (see programMarker), so the
// ✓ marks show on every device.

export const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const r = (name, sets, reps, rest, label) => ({ name, sets, reps, rest, label });
const t = (name, sets, seconds, rest) => ({ name, sets, seconds, rest });

// ------------------------------------------
// 30-DAY FULL BODY CHALLENGE (home, no equipment)
// ------------------------------------------
// Every 4th day is a rest day. Workouts rotate Upper / Lower / Core and
// get about 10% harder each week. The level sets the starting volume
// and the exercise variations.

const CHALLENGE_LEVELS = {
    Beginner: { reps: 10, seconds: 20, sets: 2, rest: 40 },
    Intermediate: { reps: 14, seconds: 30, sets: 3, rest: 30 },
    Advanced: { reps: 18, seconds: 40, sets: 3, rest: 25 }
};

const CHALLENGE_TEMPLATES = {
    upper: {
        title: "Upper body",
        focus: "Chest, shoulders, arms, back",
        moves: {
            Beginner: [
                ["Jumping Jacks", "t"], ["Incline Push-Ups", "r"], ["Chair / Bench Tricep Dips", "r"],
                ["Superman Extensions", "r"], ["Plank Hold", "t"]
            ],
            Intermediate: [
                ["Jumping Jacks", "t"], ["Standard Push-Ups", "r"], ["Wide-Grip Push-Ups", "r"],
                ["Chair / Bench Tricep Dips", "r"], ["Pike Push-Ups (Shoulder Focus)", "r"],
                ["Superman Extensions", "r"], ["Plank Hold", "t"]
            ],
            Advanced: [
                ["Burpees", "t"], ["Decline Push-Ups (Feet on Chair)", "r"], ["Diamond Push-Ups", "r"],
                ["Pike Push-Ups (Shoulder Focus)", "r"], ["Chair / Bench Tricep Dips", "r"],
                ["Superman Extensions", "r"], ["Plank Hold", "t"]
            ]
        }
    },
    lower: {
        title: "Lower body",
        focus: "Legs and glutes",
        moves: {
            Beginner: [
                ["High Knees", "t"], ["Bodyweight Air Squats", "r"], ["Walking Lunges", "r"],
                ["Glute Bridge", "r"], ["Calf Raises (Ledge/Stairs)", "r"], ["Wall Sit", "t"]
            ],
            Intermediate: [
                ["High Knees", "t"], ["Bodyweight Air Squats", "r"], ["Walking Lunges", "r"],
                ["Bulgarian Split Squats", "r"], ["Single-Leg Glute Bridges", "r"],
                ["Calf Raises (Ledge/Stairs)", "r"], ["Wall Sit", "t"]
            ],
            Advanced: [
                ["High Knees", "t"], ["Jump Squats", "r"], ["Bulgarian Split Squats", "r"],
                ["Walking Lunges", "r"], ["Single-Leg Glute Bridges", "r"],
                ["Calf Raises (Ledge/Stairs)", "r"], ["Wall Sit", "t"]
            ]
        }
    },
    core: {
        title: "Core & cardio",
        focus: "Abs, obliques and conditioning",
        moves: {
            Beginner: [
                ["Jumping Jacks", "t"], ["Crunches", "r"], ["Dead Bug", "r"],
                ["Bicycle Crunches", "r"], ["Plank Hold", "t"]
            ],
            Intermediate: [
                ["Mountain Climbers", "t"], ["Crunches", "r"], ["Reverse Crunches", "r"],
                ["Russian Twists", "r"], ["Bicycle Crunches", "r"], ["Side Plank", "t"], ["Plank Hold", "t"]
            ],
            Advanced: [
                ["Burpees", "t"], ["Mountain Climbers", "t"], ["Reverse Crunches", "r"],
                ["Russian Twists", "r"], ["Flutter Kicks", "t"], ["Side Plank", "t"], ["Plank Hold", "t"]
            ]
        }
    }
};

const CHALLENGE_ROTATION = ["upper", "lower", "core"];

function buildChallengeDays(level) {
    const base = CHALLENGE_LEVELS[level];
    const days = [];
    let workoutNumber = 0;

    for (let day = 1; day <= 30; day++) {
        if (day % 4 === 0) {
            days.push({
                key: `day-${day}`,
                title: `Day ${day}`,
                rest: true,
                subtitle: "Rest & recover",
                exercises: []
            });
            continue;
        }

        const week = Math.floor((day - 1) / 7); // 0..4
        const factor = 1 + 0.1 * week;
        const template = CHALLENGE_TEMPLATES[CHALLENGE_ROTATION[workoutNumber % 3]];
        workoutNumber++;

        // Last day: one extra set to finish strong.
        const sets = base.sets + (day === 30 ? 1 : 0);

        days.push({
            key: `day-${day}`,
            title: `Day ${day}`,
            subtitle: `${template.title} · ${template.focus}`,
            exercises: template.moves[level].map(([name, kind]) =>
                kind === "t"
                    ? t(name, sets, Math.round((base.seconds * factor) / 5) * 5, base.rest)
                    : r(name, sets, Math.round(base.reps * factor), base.rest)
            )
        });
    }

    return days;
}

const challengePrograms = LEVELS.map((level) => ({
    id: `challenge30-${level.toLowerCase()}`,
    type: "challenge",
    title: "30-Day Full Body Challenge",
    level,
    place: "Home · No equipment",
    summary:
        "Short daily workouts that get harder every week. Every 4th day is rest.",
    cover: level === "Beginner" ? "Incline Push-Ups" : level === "Intermediate" ? "Standard Push-Ups" : "Jump Squats",
    days: buildChallengeDays(level)
}));

// ------------------------------------------
// MUSCLE-BUILDING SPLITS (gym)
// ------------------------------------------

const splitPrograms = [
    {
        id: "fullbody3-beginner",
        type: "split",
        title: "3-Day Full Body Builder",
        level: "Beginner",
        place: "Gym · 3 days a week",
        summary:
            "Every muscle 3 times a week with simple, proven lifts. Rest a day between sessions. Add a little weight when all sets feel easy.",
        cover: "Goblet Squat",
        days: [
            {
                key: "day-a", title: "Day A", subtitle: "Squat · Push · Pull",
                exercises: [
                    r("Goblet Squat", 3, 12, 90), r("Flat Dumbbell Press", 3, 10, 90),
                    r("Lat Pulldown", 3, 10, 90), r("Dumbbell Shoulder Press", 3, 10, 75),
                    t("Plank Hold", 3, 30, 45)
                ]
            },
            {
                key: "day-b", title: "Day B", subtitle: "Hinge · Incline · Row",
                exercises: [
                    r("Romanian Deadlift", 3, 10, 90), r("Incline Dumbbell Press", 3, 10, 90),
                    r("Seated Cable Row", 3, 12, 75), r("Dumbbell Lunges", 3, 10, 75),
                    r("Dumbbell Bicep Curl", 2, 12, 60), r("Tricep Rope Pushdown", 2, 12, 60)
                ]
            },
            {
                key: "day-c", title: "Day C", subtitle: "Legs · Bench · Shoulders",
                exercises: [
                    r("Leg Press", 3, 12, 90), r("Barbell Bench Press", 3, 8, 120, "6-10"),
                    r("One-Arm Dumbbell Row", 3, 10, 75), r("Dumbbell Lateral Raise", 3, 12, 60),
                    r("Crunches", 3, 15, 45), r("Glute Bridge", 3, 15, 45)
                ]
            }
        ]
    },
    {
        id: "split4-intermediate",
        type: "split",
        title: "4-Day Muscle Building Split",
        level: "Intermediate",
        place: "Gym · 4 days a week",
        summary:
            "Train hard. Recover harder. Grow stronger. Chest & shoulders, back & traps, arms, then legs & core.",
        cover: "Incline Dumbbell Press",
        days: [
            {
                key: "day-1", title: "Day 1", subtitle: "Chest & Shoulders",
                focus: "Upper chest fullness, wider shoulders & strength",
                exercises: [
                    r("Incline Dumbbell Press", 4, 10, 90, "10-12"), r("Barbell Bench Press", 4, 8, 120, "8-10"),
                    r("Dumbbell Flyes", 3, 12, 60), r("Standard Push-Ups", 3, 15, 60, "till failure"),
                    r("Dumbbell Shoulder Press", 4, 10, 90), r("Dumbbell Lateral Raise", 4, 15, 60),
                    r("Front Dumbbell Raise", 3, 12, 60), r("Rear Delt Flyes", 3, 15, 60)
                ]
            },
            {
                key: "day-2", title: "Day 2", subtitle: "Back & Traps",
                focus: "Thickness, V-taper & stronger posture",
                exercises: [
                    r("Conventional Deadlift", 4, 6, 150, "6-8"), r("Lat Pulldown", 4, 10, 90, "10-12 (or pull-ups)"),
                    r("Bent-Over Barbell Row", 4, 10, 90), r("Seated Cable Row", 3, 12, 75),
                    r("One-Arm Dumbbell Row", 3, 12, 60), r("Dumbbell Shrugs", 4, 15, 60),
                    r("Face Pulls", 3, 15, 60)
                ]
            },
            {
                key: "day-3", title: "Day 3", subtitle: "Arms",
                focus: "Bigger arms, peak biceps & tricep definition",
                exercises: [
                    r("Barbell Bicep Curl", 4, 10, 75), r("Hammer Curls", 4, 12, 60), r("Preacher Curl", 3, 12, 60),
                    r("Tricep Rope Pushdown", 4, 12, 60), r("Skull Crushers", 4, 10, 75),
                    r("Overhead Dumbbell Extension", 3, 12, 60), r("Diamond Push-Ups", 2, 15, 60, "till failure")
                ]
            },
            {
                key: "day-4", title: "Day 4", subtitle: "Legs & Core",
                focus: "Strong legs and a solid core",
                exercises: [
                    r("Barbell Back Squat", 4, 8, 150, "8-10"), r("Leg Press", 4, 12, 90),
                    r("Romanian Deadlift", 4, 10, 90), r("Walking Lunges", 3, 20, 75, "20 steps"),
                    r("Lying Leg Curl", 3, 12, 60), r("Standing Calf Raise", 4, 20, 45),
                    r("Hanging Leg Raises", 3, 12, 60), t("Plank Hold", 3, 60, 45)
                ]
            }
        ]
    },
    {
        id: "vtaper5-advanced",
        type: "split",
        title: "5-Day V-Taper Split",
        level: "Advanced",
        place: "Gym · 5 days a week (+ abs)",
        summary:
            "Wide back, capped delts and a tight waist. High shoulder volume on most days. Keep body fat around 10-15% and avoid heavy weighted side bends.",
        cover: "Pull-Ups",
        days: [
            {
                key: "day-1", title: "Day 1", subtitle: "Back Width + Rear Delts",
                exercises: [
                    r("Pull-Ups", 4, 10, 120, "8-12"), r("Lat Pulldown", 4, 11, 90, "10-12 wide grip"),
                    r("Straight-Arm Pulldown", 3, 13, 60, "12-15"), r("Single-Arm Cable Lat Pulldown", 3, 12, 60),
                    r("Rear Delt Flyes", 4, 18, 45, "15-20"), r("Face Pulls", 3, 18, 45, "15-20")
                ]
            },
            {
                key: "day-2", title: "Day 2", subtitle: "Chest + Side Delts",
                exercises: [
                    r("Incline Dumbbell Press", 4, 10, 90, "8-12"), r("Barbell Bench Press", 3, 9, 120, "8-10"),
                    r("Cable Chest Fly", 3, 13, 60, "12-15"), r("Dumbbell Lateral Raise", 5, 18, 45, "15-20"),
                    r("Cable Lateral Raise", 4, 18, 45, "15-20")
                ]
            },
            {
                key: "day-3", title: "Day 3", subtitle: "Legs",
                exercises: [
                    r("Barbell Back Squat", 4, 8, 150, "6-10"), r("Romanian Deadlift", 4, 10, 90, "8-12"),
                    r("Leg Press", 3, 12, 90), r("Lying Leg Curl", 3, 13, 60, "12-15"),
                    r("Standing Calf Raise", 5, 18, 45, "15-20")
                ]
            },
            {
                key: "day-4", title: "Day 4", subtitle: "Back Thickness + Delts",
                exercises: [
                    r("Bent-Over Barbell Row", 4, 9, 90, "8-10"), r("Chest-Supported Row", 4, 11, 75, "10-12"),
                    r("Dumbbell Shoulder Press", 4, 10, 90, "8-12"), r("Dumbbell Lateral Raise", 5, 18, 45, "15-20"),
                    r("Rear Delt Flyes", 4, 18, 45, "15-20")
                ]
            },
            {
                key: "day-5", title: "Day 5", subtitle: "Arms + Delts",
                exercises: [
                    r("Close-Grip Bench Press", 4, 10, 90, "8-12"), r("Barbell Bicep Curl", 4, 10, 75, "8-12"),
                    r("Hammer Curls", 3, 12, 60), r("Tricep Rope Pushdown", 3, 13, 60, "12-15"),
                    r("Dumbbell Lateral Raise", 6, 18, 45, "15-20")
                ]
            },
            {
                key: "abs", title: "Abs", subtitle: "Waist day · 2-3 times a week",
                focus: "Tight waist: keep body fat 10-15%, avoid heavy weighted side bends",
                exercises: [
                    r("Hanging Leg Raises", 3, 15, 60), r("Reverse Crunches", 3, 15, 45), t("Plank Hold", 3, 60, 45)
                ]
            }
        ]
    }
];

// ------------------------------------------
// BODY-PART WORKOUTS (one session, 3 levels)
// ------------------------------------------
// Beginner: home / bodyweight or light dumbbells.
// Intermediate: dumbbells and cables.  Advanced: heavy gym work.

const FOCUS_AREAS = [
    {
        area: "Chest", icon: "💪", cover: "Barbell Bench Press",
        levels: {
            Beginner: [r("Incline Push-Ups", 3, 10, 45), r("Standard Push-Ups", 3, 8, 60), r("Wide-Grip Push-Ups", 2, 8, 60), t("Plank Hold", 2, 20, 45)],
            Intermediate: [r("Flat Dumbbell Press", 4, 10, 90), r("Incline Dumbbell Press", 3, 10, 90), r("Dumbbell Flyes", 3, 12, 60), r("Standard Push-Ups", 3, 15, 60, "till failure")],
            Advanced: [r("Barbell Bench Press", 4, 8, 120, "6-8"), r("Incline Dumbbell Press", 4, 10, 90), r("Cable Chest Fly", 3, 15, 60), r("Dumbbell Flyes", 3, 12, 60), r("Decline Push-Ups (Feet on Chair)", 3, 15, 60)]
        }
    },
    {
        area: "Back", icon: "🔙", cover: "Pull-Ups",
        levels: {
            Beginner: [r("Superman Extensions", 3, 12, 45), r("Inverted Rows (Under Table)", 3, 8, 60), r("Resistance Band Pull-Aparts", 3, 15, 45), r("Doorframe / Towel Rows", 3, 12, 45)],
            Intermediate: [r("Lat Pulldown", 4, 10, 90), r("Seated Cable Row", 3, 12, 75), r("One-Arm Dumbbell Row", 3, 10, 60), r("Straight-Arm Pulldown", 3, 12, 60), r("Face Pulls", 3, 15, 45)],
            Advanced: [r("Conventional Deadlift", 4, 6, 150, "5-6"), r("Pull-Ups", 4, 8, 120), r("Bent-Over Barbell Row", 4, 8, 90), r("Chest-Supported Row", 3, 10, 75), r("Single-Arm Cable Lat Pulldown", 3, 12, 60), r("Dumbbell Shrugs", 3, 15, 60)]
        }
    },
    {
        area: "Shoulders", icon: "🏋️", cover: "Dumbbell Shoulder Press",
        levels: {
            Beginner: [r("Pike Push-Ups (Shoulder Focus)", 3, 8, 60), r("Dumbbell Lateral Raise", 3, 12, 45, "light"), r("Front Dumbbell Raise", 2, 12, 45, "light"), r("Rear Delt Flyes", 2, 12, 45, "light")],
            Intermediate: [r("Dumbbell Shoulder Press", 4, 10, 90), r("Dumbbell Lateral Raise", 4, 15, 45), r("Front Dumbbell Raise", 3, 12, 45), r("Rear Delt Flyes", 3, 15, 45), r("Face Pulls", 3, 15, 45)],
            Advanced: [r("Overhead Barbell Press", 4, 6, 150, "5-8"), r("Arnold Press", 3, 10, 75), r("Dumbbell Lateral Raise", 5, 15, 45), r("Cable Lateral Raise", 4, 15, 45), r("Rear Delt Flyes", 4, 15, 45), r("Dumbbell Shrugs", 3, 15, 60)]
        }
    },
    {
        area: "Arms", icon: "💪", cover: "Hammer Curls",
        levels: {
            Beginner: [r("Dumbbell Bicep Curl", 3, 12, 60), r("Hammer Curls", 3, 12, 60), r("Chair / Bench Tricep Dips", 3, 10, 60), r("Overhead Dumbbell Extension", 3, 12, 60)],
            Intermediate: [r("Barbell Bicep Curl", 4, 10, 75), r("Hammer Curls", 3, 12, 60), r("Preacher Curl", 3, 12, 60), r("Tricep Rope Pushdown", 4, 12, 60), r("Skull Crushers", 3, 10, 75), r("Overhead Dumbbell Extension", 3, 12, 60)],
            Advanced: [r("Close-Grip Bench Press", 4, 8, 120), r("Barbell Bicep Curl", 4, 8, 90), r("Skull Crushers", 4, 10, 75), r("Preacher Curl", 3, 10, 60), r("Hammer Curls", 3, 12, 60), r("Tricep Rope Pushdown", 3, 15, 45), r("Diamond Push-Ups", 2, 15, 60, "till failure")]
        }
    },
    {
        area: "Legs", icon: "🦵", cover: "Barbell Back Squat",
        levels: {
            Beginner: [r("Bodyweight Air Squats", 3, 15, 45), r("Walking Lunges", 3, 10, 60), r("Glute Bridge", 3, 15, 45), r("Calf Raises (Ledge/Stairs)", 3, 15, 45), t("Wall Sit", 2, 30, 45)],
            Intermediate: [r("Goblet Squat", 4, 12, 90), r("Romanian Deadlift", 3, 10, 90), r("Dumbbell Lunges", 3, 10, 75), r("Leg Press", 3, 12, 90), r("Lying Leg Curl", 3, 12, 60), r("Standing Calf Raise", 4, 15, 45)],
            Advanced: [r("Barbell Back Squat", 5, 6, 150, "5-6"), r("Romanian Deadlift", 4, 8, 120), r("Leg Press", 4, 12, 90), r("Bulgarian Split Squats", 3, 10, 75), r("Lying Leg Curl", 3, 12, 60), r("Leg Extension", 3, 15, 60), r("Standing Calf Raise", 5, 15, 45)]
        }
    },
    {
        area: "Abs & Core", icon: "🔥", cover: "Crunches",
        levels: {
            Beginner: [r("Crunches", 3, 12, 30), r("Dead Bug", 3, 10, 30), r("Bicycle Crunches", 2, 12, 30), t("Plank Hold", 3, 20, 30), t("Side Plank", 2, 15, 30)],
            Intermediate: [r("Crunches", 3, 20, 30), r("Reverse Crunches", 3, 15, 30), r("Russian Twists", 3, 20, 30), r("Bicycle Crunches", 3, 20, 30), t("Plank Hold", 3, 45, 30), t("Side Plank", 2, 30, 30)],
            Advanced: [r("Hanging Leg Raises", 3, 15, 60), r("Cable Crunch", 3, 15, 45), r("Reverse Crunches", 3, 15, 30), r("Russian Twists", 3, 30, 30), t("Mountain Climbers", 3, 40, 30), t("Flutter Kicks", 3, 40, 30), t("Plank Hold", 3, 60, 30)]
        }
    }
];

const focusPrograms = FOCUS_AREAS.flatMap((focus) =>
    LEVELS.map((level) => ({
        id: `${focus.area.toLowerCase().replace(/[^a-z]+/g, "-")}-${level.toLowerCase()}`,
        type: "focus",
        area: focus.area,
        icon: focus.icon,
        title: `${focus.area} Workout`,
        level,
        place: level === "Beginner" ? "Home or gym · light equipment" : "Gym",
        summary: `One ${level.toLowerCase()} ${focus.area.toLowerCase()} session. Repeat 1-2 times a week.`,
        cover: focus.cover,
        days: [
            {
                key: "workout",
                title: `${focus.area} · ${level}`,
                subtitle: `${focus.area} workout`,
                exercises: focus.levels[level]
            }
        ]
    }))
);

export const FOCUS_AREA_LIST = FOCUS_AREAS.map(({ area, icon, cover }) => ({ area, icon, cover }));

export const PROGRAMS = [...challengePrograms, ...splitPrograms, ...focusPrograms];

export function getProgram(id) {
    return PROGRAMS.find((program) => program.id === id) || null;
}

export function getProgramDay(program, dayKey) {
    return program?.days.find((day) => day.key === dayKey) || null;
}

// ------------------------------------------
// Progress (stored in the saved workout's notes)
// ------------------------------------------

export function programMarker(programId, dayKey) {
    return `[program:${programId}:${dayKey}]`;
}

// Map of "programId:dayKey" -> number of times completed
export function completedProgramDays(sessions) {
    const done = {};

    (sessions || []).forEach((session) => {
        const matches = String(session?.notes || "").matchAll(/\[program:([a-z0-9-]+):([a-z0-9-]+)\]/g);

        for (const [, programId, dayKey] of matches) {
            const key = `${programId}:${dayKey}`;
            done[key] = (done[key] || 0) + 1;
        }
    });

    return done;
}

// Text shown in history instead of the raw marker
export function cleanProgramNotes(notes) {
    return String(notes || "").replace(/\s*\[program:[a-z0-9-]+:[a-z0-9-]+\]/g, "").trim();
}

export function describeSetTarget(exercise, trackingType) {
    const isTime = trackingType ? trackingType === "TIME" : exercise.seconds != null;
    const value = isTime ? exercise.seconds ?? exercise.reps : exercise.reps ?? exercise.seconds;
    const target = isTime ? `${value}s` : exercise.label && !/^\d/.test(exercise.label) ? `${value} reps (${exercise.label})` : `${exercise.label || value} reps`;

    return `${exercise.sets} × ${target}`;
}
