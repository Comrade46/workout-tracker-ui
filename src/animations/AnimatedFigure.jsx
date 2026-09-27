import { useEffect, useRef, useState } from "react";
import { FLOOR, poseAt, skeleton, stillPose } from "./engine";
import "./AnimatedFigure.css";

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
}

// One arm or leg: two line segments (upper/lower) and a hand/foot dot.
function Limb({ start, limb, radius }) {
    return (
        <>
            <line x1={start[0]} y1={start[1]} x2={limb.middle[0]} y2={limb.middle[1]} />
            <line x1={limb.middle[0]} y1={limb.middle[1]} x2={limb.end[0]} y2={limb.end[1]} />
            <circle cx={limb.end[0]} cy={limb.end[1]} r={radius} className="wt-figure-joint" />
        </>
    );
}

function FigureShape({ sk }) {
    if (sk.front) {
        return (
            <g className="wt-figure-strokes">
                <line x1={sk.hip[0]} y1={sk.hip[1]} x2={sk.shoulder[0]} y2={sk.shoulder[1]} />
                {sk.sides.map((side, i) => (
                    <g key={i}>
                        <line x1={sk.shoulder[0]} y1={sk.shoulder[1]} x2={side.shoulder[0]} y2={side.shoulder[1]} />
                        <line x1={sk.hip[0]} y1={sk.hip[1]} x2={side.hip[0]} y2={side.hip[1]} />
                        <Limb start={side.shoulder} limb={side.arm} radius={5} />
                        <Limb start={side.hip} limb={side.leg} radius={6} />
                    </g>
                ))}
                <circle cx={sk.head[0]} cy={sk.head[1]} r={16} className="wt-figure-head" />
            </g>
        );
    }

    return (
        <g className="wt-figure-strokes">
            <line x1={sk.hip[0]} y1={sk.hip[1]} x2={sk.shoulder[0]} y2={sk.shoulder[1]} />
            <Limb start={sk.shoulder} limb={sk.armF} radius={5} />
            <Limb start={sk.hip} limb={sk.legF} radius={6} />
            <Limb start={sk.shoulder} limb={sk.armN} radius={5} />
            <Limb start={sk.hip} limb={sk.legN} radius={6} />
            <circle cx={sk.head[0]} cy={sk.head[1]} r={16} className="wt-figure-head" />
        </g>
    );
}

/*
 * Simple animated stick-figure demonstration for exercises with no photo.
 * Loops the pose engine's key poses via requestAnimationFrame; shows a
 * single still pose when `animate` is false or the user prefers reduced
 * motion.
 */
function AnimatedFigure({ def, animate = true, height = 200 }) {
    const [elapsed, setElapsed] = useState(0);
    const startRef = useRef(null);
    const frameRef = useRef(null);
    const shouldAnimate = animate && def.keys.length > 1 && !prefersReducedMotion();

    useEffect(() => {
        if (!shouldAnimate) return undefined;

        startRef.current = null;

        function tick(now) {
            if (startRef.current == null) startRef.current = now;
            setElapsed((now - startRef.current) / 1000);
            frameRef.current = requestAnimationFrame(tick);
        }

        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [shouldAnimate, def]);

    const pose = shouldAnimate ? poseAt(def, elapsed) : stillPose(def);
    const sk = skeleton(def, pose);

    return (
        <svg
            viewBox="0 0 400 300"
            className="wt-figure-svg"
            style={{ height, width: "100%" }}
            role="img"
            aria-label="Exercise demonstration animation"
        >
            <line x1={0} y1={FLOOR} x2={400} y2={FLOOR} className="wt-figure-floor" />
            <FigureShape sk={sk} />
        </svg>
    );
}

export default AnimatedFigure;
