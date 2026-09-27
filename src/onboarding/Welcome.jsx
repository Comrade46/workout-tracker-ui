import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useBody from "../progress/useBody";
import { FITNESS_GOALS, DEFAULT_WEEKLY_GOAL, dateKey } from "../progress/motivation";
import { LEVELS } from "../data/programs";
import { nextProgramWorkout } from "../progress/achievements";
import { getStoredUser } from "../auth/session";
import "../progress/Progress.css";
import "../components/Account.css";
import "./Welcome.css";

/*
 * Shown once, right after signing up: main goal, level, weekly goal,
 * height and (optional) current weight. Saves into the same profile
 * Body & goals uses, so the Home screen's Continue card immediately
 * suggests the right program. Skippable at any time.
 */
function Welcome() {
    const navigate = useNavigate();
    const { saveProfile, saveWeight } = useBody();
    const username = getStoredUser()?.username || "";

    const [goal, setGoal] = useState(null);
    const [level, setLevel] = useState("Beginner");
    const [weeklyGoal, setWeeklyGoal] = useState(DEFAULT_WEEKLY_GOAL);
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [suggestion, setSuggestion] = useState(null);

    const goToDashboard = () => navigate("/dashboard", { replace: true });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const heightCm = height ? Math.round(Number(height)) : null;
        const weightKg = weight ? Number(weight) : null;

        if (heightCm !== null && (heightCm < 100 || heightCm > 250)) {
            setError("Height must be between 100 and 250 cm.");
            return;
        }

        if (weightKg !== null && (weightKg < 25 || weightKg > 300)) {
            setError("Weight must be between 25 and 300 kg.");
            return;
        }

        setSaving(true);

        try {
            await saveProfile({
                heightCm,
                weeklyGoal,
                fitnessGoal: goal,
                targetWeightKg: null,
                experienceLevel: level
            });

            if (weightKg !== null) {
                await saveWeight(dateKey(new Date()), weightKg);
            }

            const next = nextProgramWorkout([], goal, level);
            setSuggestion(next?.program || null);
        } catch (requestError) {
            setError(requestError.userMessage || "Could not save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (suggestion) {
        return (
            <div className="wt-welcome-page">
                <div className="wt-welcome-card">
                    <h1 className="wt-welcome-title">🎉 You're all set, {username}!</h1>
                    <p className="wt-welcome-subtitle">
                        We've picked <strong>{suggestion.title}</strong> ({suggestion.level}) to match your goal.
                        You can change this any time in Programs or Me.
                    </p>
                    <button type="button" className="wt-pr-button wt-pr-cta" onClick={goToDashboard}>
                        Go to Dashboard →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="wt-welcome-page">
            <div className="wt-welcome-card">
                <div className="wt-welcome-header">
                    <div>
                        <h1 className="wt-welcome-title">Welcome, {username} 👋</h1>
                        <p className="wt-welcome-subtitle">A few quick questions so we can set you up. Takes 30 seconds.</p>
                    </div>
                    <button type="button" className="wt-pr-link" onClick={goToDashboard}>
                        Skip for now
                    </button>
                </div>

                {error && <div className="wt-acc-message error" role="alert">{error}</div>}

                <form className="wt-acc-form" onSubmit={handleSubmit}>
                    <div className="wt-acc-field">
                        <span style={{ fontWeight: 700, fontSize: 14 }} id="wt-w-goal-label">Main goal</span>
                        <div className="wt-pr-chips" role="group" aria-labelledby="wt-w-goal-label">
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
                        <span style={{ fontWeight: 700, fontSize: 14 }} id="wt-w-level-label">Your level</span>
                        <div className="wt-pr-chips" role="group" aria-labelledby="wt-w-level-label">
                            {LEVELS.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    className={`wt-pr-chip${level === option ? " selected" : ""}`}
                                    aria-pressed={level === option}
                                    onClick={() => setLevel(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="wt-acc-field">
                        <span style={{ fontWeight: 700, fontSize: 14 }} id="wt-w-weekly-label">
                            Days a week: {weeklyGoal}
                        </span>
                        <div className="wt-pr-chips" role="group" aria-labelledby="wt-w-weekly-label">
                            {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                                <button
                                    key={days}
                                    type="button"
                                    className={`wt-pr-chip${weeklyGoal === days ? " selected" : ""}`}
                                    aria-label={`${days} day${days === 1 ? "" : "s"} per week`}
                                    onClick={() => setWeeklyGoal(days)}
                                    style={{ minWidth: 44 }}
                                >
                                    {days}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="wt-welcome-row">
                        <div className="wt-acc-field">
                            <label htmlFor="wt-w-height">Height (cm)</label>
                            <input
                                id="wt-w-height"
                                type="number"
                                inputMode="numeric"
                                min="100"
                                max="250"
                                className="wt-acc-input"
                                placeholder="e.g. 172"
                                value={height}
                                onChange={(event) => setHeight(event.target.value)}
                                disabled={saving}
                            />
                        </div>

                        <div className="wt-acc-field">
                            <label htmlFor="wt-w-weight">Current weight (kg, optional)</label>
                            <input
                                id="wt-w-weight"
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                min="25"
                                max="300"
                                className="wt-acc-input"
                                placeholder="e.g. 68"
                                value={weight}
                                onChange={(event) => setWeight(event.target.value)}
                                disabled={saving}
                            />
                        </div>
                    </div>

                    <button type="submit" className="wt-pr-button wt-pr-cta" disabled={saving}>
                        {saving ? "Saving…" : "Let's go →"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Welcome;
