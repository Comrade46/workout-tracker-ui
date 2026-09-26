import { useEffect, useState } from "react";
import useBody from "./useBody";
import { DEFAULT_WEEKLY_GOAL, FITNESS_GOALS, toNumber } from "./motivation";
import "./Progress.css";

// "5 ft 9 in" for a height in cm.
function feetAndInches(cm) {
    const totalInches = Math.round(Number(cm) / 2.54);
    return `${Math.floor(totalInches / 12)} ft ${totalInches % 12} in`;
}

// Height, main goal, workout days per week, target weight.
// `bare`: without its own card and heading (inside a Profile menu row).
function BodyGoalsForm({ bare = false }) {
    const { profile, loading, saveProfile } = useBody();

    const [height, setHeight] = useState("");
    const [goal, setGoal] = useState(null);
    const [weeklyGoal, setWeeklyGoal] = useState(DEFAULT_WEEKLY_GOAL);
    const [target, setTarget] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", error: false });

    useEffect(() => {
        if (loading) return;

        setHeight(profile.heightCm ? String(profile.heightCm) : "");
        setGoal(profile.fitnessGoal || null);
        setWeeklyGoal(profile.weeklyGoal || DEFAULT_WEEKLY_GOAL);
        setTarget(profile.targetWeightKg ? String(toNumber(profile.targetWeightKg)) : "");
    }, [loading, profile]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const heightCm = height ? Math.round(Number(height)) : null;
        const targetKg = target ? toNumber(target) : null;

        if (heightCm !== null && (heightCm < 100 || heightCm > 250)) {
            setMessage({ text: "Height must be between 100 and 250 cm.", error: true });
            return;
        }

        if (target && (!targetKg || targetKg < 25 || targetKg > 300)) {
            setMessage({ text: "Target weight must be between 25 and 300 kg.", error: true });
            return;
        }

        setSaving(true);
        setMessage({ text: "", error: false });

        try {
            await saveProfile({
                heightCm,
                weeklyGoal,
                fitnessGoal: goal,
                targetWeightKg: targetKg
            });
            setMessage({ text: "Saved ✓", error: false });
        } catch (requestError) {
            setMessage({ text: requestError.userMessage || "Could not save. Try again.", error: true });
        } finally {
            setSaving(false);
        }
    };

    const Wrapper = bare ? "div" : "section";

    return (
        <Wrapper
            className={bare ? undefined : "wt-acc-card"}
            id={bare ? undefined : "goals"}
            aria-labelledby={bare ? undefined : "wt-goals-title"}
        >
            {!bare && <h2 id="wt-goals-title">🎯 Body &amp; goals</h2>}
            <p className="wt-acc-card-hint">
                Used for your weekly goal, streaks, BMI and calorie estimates.
            </p>

            {loading ? (
                <div className="wt-acc-empty">Loading…</div>
            ) : (
                <form className="wt-acc-form" onSubmit={handleSubmit}>
                    <div className="wt-acc-field">
                        <span style={{ fontWeight: 700, fontSize: 14 }} id="wt-goal-label">Main goal</span>
                        <div className="wt-pr-chips" role="group" aria-labelledby="wt-goal-label">
                            {FITNESS_GOALS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`wt-pr-chip${goal === option.value ? " selected" : ""}`}
                                    aria-pressed={goal === option.value}
                                    onClick={() => setGoal(goal === option.value ? null : option.value)}
                                >
                                    {option.icon} {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="wt-acc-field">
                        <span style={{ fontWeight: 700, fontSize: 14 }} id="wt-weekly-label">
                            Weekly goal: {weeklyGoal} workout day{weeklyGoal === 1 ? "" : "s"}
                        </span>
                        <div className="wt-pr-chips" role="group" aria-labelledby="wt-weekly-label">
                            {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                                <button
                                    key={days}
                                    type="button"
                                    className={`wt-pr-chip${weeklyGoal === days ? " selected" : ""}`}
                                    aria-pressed={weeklyGoal === days}
                                    aria-label={`${days} day${days === 1 ? "" : "s"} per week`}
                                    onClick={() => setWeeklyGoal(days)}
                                    style={{ minWidth: 44 }}
                                >
                                    {days}
                                </button>
                            ))}
                        </div>
                        <span className="wt-pr-muted">3-4 days a week is a great start for building muscle.</span>
                    </div>

                    <div className="wt-acc-field">
                        <label htmlFor="wt-height">Height (cm)</label>
                        <input
                            id="wt-height"
                            type="number"
                            inputMode="numeric"
                            min="100"
                            max="250"
                            className="wt-acc-input"
                            style={{ maxWidth: 200 }}
                            placeholder="e.g. 172"
                            value={height}
                            onChange={(event) => setHeight(event.target.value)}
                            disabled={saving}
                        />
                        {height >= 100 && height <= 250 && (
                            <span className="wt-pr-muted">= {feetAndInches(height)}</span>
                        )}
                    </div>

                    <div className="wt-acc-field">
                        <label htmlFor="wt-target">Target weight (kg, optional)</label>
                        <input
                            id="wt-target"
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min="25"
                            max="300"
                            className="wt-acc-input"
                            style={{ maxWidth: 200 }}
                            placeholder="e.g. 68"
                            value={target}
                            onChange={(event) => setTarget(event.target.value)}
                            disabled={saving}
                        />
                    </div>

                    <div className="wt-acc-actions" style={{ alignItems: "center" }}>
                        <button type="submit" className="wt-acc-button" disabled={saving}>
                            {saving ? "Saving…" : "Save goals"}
                        </button>
                        {message.text && (
                            <span className={`wt-pr-note${message.error ? " error" : ""}`} role="status" style={{ marginTop: 0 }}>
                                {message.text}
                            </span>
                        )}
                    </div>
                </form>
            )}
        </Wrapper>
    );
}

export default BodyGoalsForm;
