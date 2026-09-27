import { useEffect, useState } from "react";
import { getExerciseMedia } from "../data/exerciseMedia";
import { getExerciseAnimation } from "../animations/exerciseAnimations";
import AnimatedFigure from "../animations/AnimatedFigure";

const FRAME_MS = 1200;

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
}

/*
 * Picture of an exercise. Alternates the start and end photos
 * (a simple 2-frame animation) unless `animate` is false or the user
 * prefers reduced motion. Renders `fallback` when there is no picture.
 */
function ExerciseImage({
    name,
    height = 200,
    animate = true,
    rounded = 14,
    fallback = null,
    style = {}
}) {
    const media = getExerciseMedia(name);
    const images = media?.images || [];

    const [frame, setFrame] = useState(0);
    const [failed, setFailed] = useState(false);

    const reduceMotion = prefersReducedMotion();
    const canAnimate = animate && images.length > 1 && !reduceMotion;

    useEffect(() => {
        setFrame(0);
        setFailed(false);
    }, [name]);

    useEffect(() => {
        if (!canAnimate) {
            return undefined;
        }

        const timer = setInterval(
            () => setFrame((previous) => (previous + 1) % images.length),
            FRAME_MS
        );

        return () => clearInterval(timer);
    }, [canAnimate, images.length]);

    if (!images.length) {
        const animation = getExerciseAnimation(name);

        if (!animation) {
            return fallback;
        }

        return (
            <div
                style={{
                    width: "100%",
                    height,
                    borderRadius: rounded,
                    overflow: "hidden",
                    background: "var(--wt-surface-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...style
                }}
            >
                <AnimatedFigure def={animation} animate={animate && !reduceMotion} height={height} />
            </div>
        );
    }

    if (failed) {
        return fallback;
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height,
                borderRadius: rounded,
                overflow: "hidden",
                background: "var(--wt-surface-tertiary)",
                ...style
            }}
        >
            {images.map((src, index) => (
                <img
                    key={src}
                    src={src}
                    alt={index === 0 ? `${name} demonstration` : ""}
                    aria-hidden={index === 0 ? undefined : true}
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailed(true)}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: index === frame ? 1 : 0,
                        transform: index === frame ? "scale(1)" : "scale(1.03)",
                        transition: "opacity 0.5s ease, transform 0.5s ease"
                    }}
                />
            ))}
        </div>
    );
}

export default ExerciseImage;
