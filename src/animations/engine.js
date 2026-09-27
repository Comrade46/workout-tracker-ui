// ==========================================
// EXERCISE ANIMATION ENGINE
// ==========================================
// Draws a simple jointed figure (side or front view) in a 400 x 300
// scene and moves it smoothly between key poses.
//
// Angles are absolute, in degrees, SVG style:
//   0 = right, 90 = down, -90 = up, 180 = left.
// The side-view figure faces right.
//
// A key pose:
//   hip: [x, y]           hip position in the scene
//   torso: deg            direction hip -> shoulder (-90 = upright)
//   head: deg             direction shoulder -> head (default = torso)
//   shrug: px             lifts the shoulder along the torso
//   armN / armF           near / far arm (far defaults to near)
//   legN / legF           near / far leg
//     { a: [upper, lower] }            joint angles, or
//     { to: [x, y], bend: 1 | -1 }     hand / ankle pinned to a point
//   footN / footF: deg    foot direction (default: shin - 90)
//   lift: px              moves the whole figure up (jumps)
//
// Front view (view: "front") uses armL / legL for the figure's
// screen-left side; the other side is mirrored.

export const FLOOR = 270;

const L = {
    torso: 64,
    neck: 8,
    head: 14,
    upper: 38,
    fore: 36,
    thigh: 48,
    shin: 46,
    foot: 14,
    shoulderHalf: 18,
    hipHalf: 11
};

const rad = (deg) => (deg * Math.PI) / 180;
const dir = (deg) => [Math.cos(rad(deg)), Math.sin(rad(deg))];
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const angleOf = (from, to) => (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerpAngle(a, b, t) {
    let delta = ((b - a + 540) % 360) - 180;
    return a + delta * t;
}

function lerpPoint(a, b, t) {
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

// Two-bone inverse kinematics: joint -> middle -> end reaching `target`.
function solveLimb(joint, target, l1, l2, bend) {
    const distance = Math.hypot(target[0] - joint[0], target[1] - joint[1]);
    const d = Math.min(Math.max(distance, Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.5);
    const base = angleOf(joint, target);
    const cos = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
    const offset = (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
    const upper = base + bend * offset;
    const middle = add(joint, dir(upper), l1);
    const lower = angleOf(middle, target);
    return { upper, middle, end: add(middle, dir(lower), l2), lower };
}

function limb(joint, spec, l1, l2) {
    if (spec.to) {
        return solveLimb(joint, spec.to, l1, l2, spec.bend ?? 1);
    }

    const [upper, lower] = spec.a;
    const middle = add(joint, dir(upper), l1);
    return { upper, middle, end: add(middle, dir(lower), l2), lower };
}

function mixLimb(a, b, t) {
    if (a.to && b.to) {
        return { to: lerpPoint(a.to, b.to, t), bend: a.bend ?? 1 };
    }

    if (a.a && b.a) {
        return { a: [lerpAngle(a.a[0], b.a[0], t), lerpAngle(a.a[1], b.a[1], t)] };
    }

    return t < 0.5 ? a : b;
}

function mixPose(a, b, t) {
    const pose = {
        hip: lerpPoint(a.hip, b.hip, t),
        torso: lerpAngle(a.torso, b.torso, t),
        head: lerpAngle(a.head ?? a.torso, b.head ?? b.torso, t),
        shrug: lerp(a.shrug || 0, b.shrug || 0, t),
        lift: lerp(a.lift || 0, b.lift || 0, t)
    };

    for (const key of ["armN", "armF", "legN", "legF", "armL", "legL"]) {
        const sa = a[key] ?? (key === "armF" ? a.armN : key === "legF" ? a.legN : undefined);
        const sb = b[key] ?? (key === "armF" ? b.armN : key === "legF" ? b.legN : undefined);
        if (sa && sb) pose[key] = mixLimb(sa, sb, t);
    }

    for (const key of ["footN", "footF"]) {
        const fa = a[key] ?? (key === "footF" ? a.footN : undefined);
        const fb = b[key] ?? (key === "footF" ? b.footN : undefined);
        if (fa != null && fb != null) pose[key] = lerpAngle(fa, fb, t);
    }

    return pose;
}

const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

// Pose at time `seconds` for an animation definition.
export function poseAt(def, seconds) {
    const keys = def.keys;

    if (keys.length === 1) {
        return mixPose(keys[0], keys[0], 0);
    }

    const segment = def.segment ?? 1.1;
    const hold = def.hold ?? 0.25;

    // pingpong: 0 -> 1 -> 0 ...   cycle: 0 -> 1 -> 2 -> ... -> 0
    const order =
        def.mode === "cycle"
            ? [...keys.map((_, i) => i), 0]
            : [...keys.map((_, i) => i), ...keys.map((_, i) => i).reverse().slice(1)];

    const steps = order.length - 1;
    const total = steps * segment;
    let local = ((seconds % total) + total) % total;
    const step = Math.min(steps - 1, Math.floor(local / segment));
    let t = (local - step * segment) / segment;

    // Short pause at each key pose, then an eased move.
    t = t < hold ? 0 : ease((t - hold) / (1 - hold));

    return mixPose(keys[order[step]], keys[order[step + 1]], t);
}

// The pose used for still pictures (the "working" position).
export function stillPose(def) {
    const index = def.still ?? Math.min(1, def.keys.length - 1);
    return mixPose(def.keys[index], def.keys[index], 0);
}

// Joint positions for a pose.
export function skeleton(def, pose) {
    const lift = pose.lift || 0;
    const hip = [pose.hip[0], pose.hip[1] - lift];

    if (def.view === "front") {
        const shoulderMid = add(hip, dir(pose.torso), L.torso + (pose.shrug || 0));
        const head = add(shoulderMid, dir(pose.head), L.neck + L.head + 4);
        const sides = [-1, 1].map((side) => {
            const mirror = (spec) =>
                side < 0 ? spec : { a: [180 - spec.a[0], 180 - spec.a[1]] };
            const shoulder = [shoulderMid[0] + side * L.shoulderHalf, shoulderMid[1]];
            const hipSide = [hip[0] + side * L.hipHalf, hip[1]];
            const arm = limb(shoulder, mirror(pose.armL), L.upper, L.fore);
            const leg = limb(hipSide, mirror(pose.legL), L.thigh, L.shin);
            const footAngle = side < 0 ? 180 + 10 : -10;
            return { shoulder, hip: hipSide, arm, leg, toe: add(leg.end, dir(footAngle), 9) };
        });

        return {
            front: true,
            hip,
            shoulder: shoulderMid,
            head,
            sides,
            handN: sides[0].arm.end,
            handF: sides[1].arm.end,
            footN: sides[0].leg.end,
            footF: sides[1].leg.end
        };
    }

    const shoulder = add(hip, dir(pose.torso), L.torso + (pose.shrug || 0));
    const head = add(shoulder, dir(pose.head), L.neck + L.head);
    const armN = limb(shoulder, pose.armN, L.upper, L.fore);
    const armF = limb(shoulder, pose.armF || pose.armN, L.upper, L.fore);
    const legN = limb(hip, pose.legN, L.thigh, L.shin);
    const legF = limb(hip, pose.legF || pose.legN, L.thigh, L.shin);
    const footN = pose.footN ?? legN.lower - 90;
    const footF = pose.footF ?? pose.footN ?? legF.lower - 90;

    return {
        hip,
        shoulder,
        head,
        armN,
        armF,
        legN,
        legF,
        toeN: add(legN.end, dir(footN), L.foot),
        toeF: add(legF.end, dir(footF), L.foot),
        handN: armN.end,
        handF: armF.end,
        elbowN: armN.middle,
        kneeN: legN.middle,
        footN: legN.end,
        footF: legF.end
    };
}

// Resolve a prop coordinate: [x, y] or the name of a skeleton point.
export function point(sk, ref) {
    if (Array.isArray(ref)) return ref;
    return sk[ref] || [0, 0];
}

export { L as LENGTHS, angleOf };
