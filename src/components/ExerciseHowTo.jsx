import { getExerciseMedia } from "../data/exerciseMedia";

/*
 * Collapsible "How to do it" steps for an exercise.
 * Renders nothing when the exercise has no instructions.
 */
function ExerciseHowTo({ name, open = false, compact = false }) {
    const media = getExerciseMedia(name);
    const steps = media?.instructions || [];

    if (!steps.length) {
        return null;
    }

    const muscles = (media.primaryMuscles || []).join(", ");

    return (
        <details
            open={open}
            style={{
                marginTop: compact ? 10 : 14,
                padding: compact ? "10px 12px" : "12px 14px",
                border: "1px solid var(--wt-border)",
                borderRadius: 12,
                background: "var(--wt-surface-secondary)",
                color: "var(--wt-text-primary)"
            }}
        >
            <summary
                style={{
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: compact ? 13 : 14
                }}
            >
                📖 How to do it
                {muscles && (
                    <span
                        style={{
                            marginLeft: 8,
                            fontWeight: 500,
                            fontSize: 12,
                            color: "var(--wt-text-muted)",
                            textTransform: "capitalize"
                        }}
                    >
                        · {muscles}
                    </span>
                )}
            </summary>

            <ol
                style={{
                    margin: "10px 0 0",
                    paddingLeft: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    color: "var(--wt-text-secondary)",
                    fontSize: compact ? 13 : 14,
                    lineHeight: 1.5
                }}
            >
                {steps.map((step) => (
                    <li key={step}>{step}</li>
                ))}
            </ol>
        </details>
    );
}

export default ExerciseHowTo;
