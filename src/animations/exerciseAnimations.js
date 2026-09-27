// ==========================================
// EXERCISE ANIMATION DEFINITIONS
// ==========================================
// Hand-authored key poses for the engine in ./engine.js, for the small
// set of built-in bodyweight exercises that have no photo (see the
// comment at the top of ../data/exerciseMedia.js). Keys are the exercise
// name, lower-case, matching the exerciseMedia.js lookup convention.

import { FLOOR } from "./engine";

const STAND_HIP = [150, 176];
const FLOOR_Y = FLOOR - 4;

const EXERCISE_ANIMATIONS = {
    "jumping jacks": {
        view: "front",
        mode: "pingpong",
        segment: 0.45,
        hold: 0.05,
        keys: [
            {
                // Feet together, arms down.
                hip: [200, 176],
                torso: -90,
                armL: { a: [95, 100] },
                legL: { a: [92, 90] }
            },
            {
                // Feet apart, arms overhead.
                hip: [200, 180],
                torso: -90,
                armL: { a: [-50, -55] },
                legL: { a: [115, 110] }
            }
        ]
    },

    "high knees": {
        view: "side",
        mode: "pingpong",
        segment: 0.35,
        hold: 0.02,
        keys: [
            {
                hip: STAND_HIP,
                torso: -82,
                lift: 6,
                armN: { a: [-35, 55] },
                armF: { a: [115, 145] },
                legN: { a: [-35, 85] },
                legF: { a: [100, 95] }
            },
            {
                hip: STAND_HIP,
                torso: -82,
                lift: 0,
                armN: { a: [110, 140] },
                armF: { a: [-30, 55] },
                legN: { a: [100, 95] },
                legF: { a: [-35, 85] }
            }
        ]
    },

    "wall sit": {
        view: "side",
        mode: "pingpong",
        segment: 2.2,
        hold: 0.35,
        still: 0,
        keys: [
            {
                hip: [150, 220],
                torso: -92,
                head: -90,
                armN: { a: [95, 105] },
                armF: { a: [100, 110] },
                legN: { to: [198, FLOOR_Y], bend: 1 },
                legF: { to: [202, FLOOR_Y], bend: 1 }
            },
            {
                hip: [150, 222],
                torso: -88,
                head: -86,
                armN: { a: [93, 103] },
                armF: { a: [98, 108] },
                legN: { to: [198, FLOOR_Y], bend: 1 },
                legF: { to: [202, FLOOR_Y], bend: 1 }
            }
        ]
    },

    "pike push-ups (shoulder focus)": {
        view: "side",
        mode: "pingpong",
        segment: 0.9,
        hold: 0.2,
        keys: [
            {
                // Hips high, arms extended - hands and feet both on the
                // floor, forming the inverted-V "pike" shape.
                hip: [160, 190],
                torso: 45,
                head: 55,
                armN: { to: [258, FLOOR_Y], bend: 1 },
                armF: { to: [258, FLOOR_Y], bend: 1 },
                legN: { to: [108, FLOOR_Y], bend: 1 },
                legF: { to: [108, FLOOR_Y], bend: 1 }
            },
            {
                // Elbows bent, head lowered towards the floor - hips drop
                // a little as the shoulders come down towards the hands.
                hip: [160, 210],
                torso: 40,
                head: 50,
                armN: { to: [258, FLOOR_Y], bend: 1 },
                armF: { to: [258, FLOOR_Y], bend: 1 },
                legN: { to: [108, FLOOR_Y], bend: 1 },
                legF: { to: [108, FLOOR_Y], bend: 1 }
            }
        ]
    },

    "burpees": {
        view: "side",
        mode: "cycle",
        segment: 0.55,
        hold: 0.03,
        keys: [
            {
                // Stand.
                hip: STAND_HIP,
                torso: -90,
                armN: { a: [95, 100] },
                armF: { a: [100, 105] },
                legN: { a: [90, 90] },
                legF: { a: [92, 90] }
            },
            {
                // Squat, hands to the floor.
                hip: [150, 225],
                torso: -30,
                head: -20,
                armN: { to: [215, FLOOR_Y], bend: 1 },
                armF: { to: [215, FLOOR_Y], bend: 1 },
                legN: { to: [150, FLOOR_Y + 1], bend: 1 },
                legF: { to: [154, FLOOR_Y + 1], bend: 1 }
            },
            {
                // Plank, legs kicked back.
                hip: [195, 205],
                torso: 8,
                head: 5,
                armN: { to: [258, FLOOR_Y], bend: 1 },
                armF: { to: [258, FLOOR_Y], bend: 1 },
                legN: { to: [130, FLOOR_Y], bend: 1 },
                legF: { to: [134, FLOOR_Y], bend: 1 }
            },
            {
                // Jump, arms overhead.
                hip: STAND_HIP,
                torso: -90,
                lift: 30,
                armN: { a: [-95, -100] },
                armF: { a: [-100, -105] },
                legN: { a: [100, 100] },
                legF: { a: [102, 96] }
            }
        ]
    },

    "doorframe / towel rows": {
        view: "side",
        mode: "pingpong",
        segment: 0.85,
        hold: 0.15,
        keys: [
            {
                // Arms extended, leaning back from the grip.
                hip: [150, 190],
                torso: -75,
                armN: { a: [-25, -5] },
                armF: { a: [-20, 0] },
                legN: { to: [145, FLOOR_Y], bend: 1 },
                legF: { to: [155, FLOOR_Y], bend: 1 }
            },
            {
                // Pulled in, elbows back.
                hip: [150, 190],
                torso: -68,
                armN: { a: [-15, -75] },
                armF: { a: [-10, -70] },
                legN: { to: [145, FLOOR_Y], bend: 1 },
                legF: { to: [155, FLOOR_Y], bend: 1 }
            }
        ]
    }
};

export function getExerciseAnimation(name) {
    const key = String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
    return EXERCISE_ANIMATIONS[key] || null;
}
