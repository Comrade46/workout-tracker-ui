import { useState } from "react";
import { Link } from "react-router-dom";
import { bmi, dateKey, latestWeight, toNumber, weightChange } from "./motivation";
import "./Progress.css";

function formatDay(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/*
 * Latest weight, 30-day change, BMI, target, and a quick "log today's
 * weight" field. Details live on the Body page.
 */
function BodyCard({ body }) {
    const { profile, weights, loading, saveWeight } = body;
    const latest = latestWeight(weights);
    const [value, setValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", error: false });

    const latestKg = toNumber(latest?.weightKg);
    const change = weightChange(weights);
    const bmiResult = bmi(latestKg, profile.heightCm);
    const target = toNumber(profile.targetWeightKg);

    const handleSave = async (event) => {
        event.preventDefault();
        const weight = toNumber(value);

        if (!weight || weight < 25 || weight > 300) {
            setMessage({ text: "Enter your weight in kg (25-300).", error: true });
            return;
        }

        setSaving(true);
        setMessage({ text: "", error: false });

        try {
            await saveWeight(dateKey(new Date()), weight);
            setValue("");
            setMessage({ text: "Saved ✓", error: false });
        } catch (requestError) {
            setMessage({ text: requestError.userMessage || "Could not save. Try again.", error: true });
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="wt-pr-card" aria-labelledby="wt-body-title">
            <div className="wt-pr-card-head">
                <h2 className="wt-pr-card-title" id="wt-body-title">⚖️ Body</h2>
                <Link to="/body" className="wt-pr-link">Weight chart ›</Link>
            </div>

            {loading ? (
                <div className="wt-pr-muted">Loading…</div>
            ) : latestKg ? (
                <>
                    <div className="wt-pr-weight">
                        <strong>{latestKg} kg</strong>
                        <span className="wt-pr-muted">{formatDay(latest.date)}</span>
                        {change && change.kg !== 0 && (
                            <span className="wt-pr-change">
                                {change.kg < 0 ? "▼" : "▲"} {Math.abs(change.kg)} kg since {formatDay(change.since)}
                            </span>
                        )}
                    </div>

                    <div className="wt-pr-rows">
                        <div className="wt-pr-row">
                            <span>BMI</span>
                            {bmiResult ? (
                                <strong>
                                    {bmiResult.value}{" "}
                                    <span className={`wt-pr-badge ${bmiResult.tone}`}>{bmiResult.label}</span>
                                </strong>
                            ) : (
                                <Link to="/profile#goals" className="wt-pr-link">Add your height</Link>
                            )}
                        </div>

                        {target && (
                            <div className="wt-pr-row">
                                <span>Target</span>
                                <strong>
                                    {target} kg ·{" "}
                                    {Math.abs(latestKg - target) < 0.05
                                        ? "reached 🎉"
                                        : `${Math.round(Math.abs(latestKg - target) * 10) / 10} kg to go`}
                                </strong>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <p className="wt-pr-muted" style={{ marginTop: 0 }}>
                    Log your weight to track your progress, see your BMI and estimate
                    the calories you burn.
                </p>
            )}

            <form className="wt-pr-log" onSubmit={handleSave}>
                <label htmlFor="wt-quick-weight" className="wt-pr-muted">Today:</label>
                <input
                    id="wt-quick-weight"
                    className="wt-pr-input"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="25"
                    max="300"
                    placeholder={latestKg ? String(latestKg) : "kg"}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    aria-label="Today's weight in kg"
                    disabled={saving}
                />
                <span className="wt-pr-muted">kg</span>
                <button type="submit" className="wt-pr-button" disabled={saving || !value}>
                    {saving ? "Saving…" : "Log weight"}
                </button>
            </form>

            {message.text && (
                <div className={`wt-pr-note${message.error ? " error" : ""}`} role="status">
                    {message.text}
                </div>
            )}
        </section>
    );
}

export default BodyCard;
