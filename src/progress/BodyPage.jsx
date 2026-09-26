import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useBody from "./useBody";
import WeightChart from "./WeightChart";
import {
    addDays,
    bmi,
    dateKey,
    healthyWeightRange,
    latestWeight,
    parseKey,
    toNumber
} from "./motivation";
import "../components/Account.css";
import "./Progress.css";

const RANGES = [
    { label: "1 month", days: 31 },
    { label: "3 months", days: 92 },
    { label: "1 year", days: 366 },
    { label: "All", days: null }
];

function longDate(key) {
    return parseKey(key).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// Where a BMI sits on the 15-40 scale, in percent.
function scalePosition(value) {
    return ((Math.min(40, Math.max(15, value)) - 15) / 25) * 100;
}

function BodyPage() {
    const body = useBody();
    const { profile, weights, loading, error, saveWeight, deleteWeight } = body;

    const [date, setDate] = useState(dateKey(new Date()));
    const [weight, setWeight] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", error: false });
    const [range, setRange] = useState(RANGES[1]);
    const [confirmId, setConfirmId] = useState(null);

    const latest = latestWeight(weights);
    const latestKg = toNumber(latest?.weightKg);
    const bmiResult = bmi(latestKg, profile.heightCm);
    const healthy = healthyWeightRange(profile.heightCm);

    const shown = useMemo(() => {
        if (!range.days) return weights;
        const fromKey = dateKey(addDays(new Date(), -range.days));
        return weights.filter((entry) => entry.date >= fromKey);
    }, [weights, range]);

    const handleSave = async (event) => {
        event.preventDefault();
        const kg = toNumber(weight);

        if (!kg || kg < 25 || kg > 300) {
            setMessage({ text: "Enter a weight between 25 and 300 kg.", error: true });
            return;
        }

        setSaving(true);
        setMessage({ text: "", error: false });

        try {
            const replaced = weights.some((entry) => entry.date === date);
            await saveWeight(date, kg);
            setWeight("");
            setMessage({ text: replaced ? "Updated the reading for that day ✓" : "Saved ✓", error: false });
        } catch (requestError) {
            setMessage({ text: requestError.userMessage || "Could not save. Try again.", error: true });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteWeight(id);
        } catch (requestError) {
            setMessage({ text: requestError.userMessage || "Could not delete. Try again.", error: true });
        } finally {
            setConfirmId(null);
        }
    };

    return (
        <div className="wt-acc-page">
            <div className="wt-acc-container">
                <div>
                    <h1 className="wt-acc-title">⚖️ Body &amp; weight</h1>
                    <p className="wt-acc-subtitle">
                        Log your weight regularly (same time of day works best) and watch the trend.
                    </p>
                </div>

                {error && <div className="wt-acc-message error" role="alert">{error}</div>}

                {/* Log a reading */}
                <section className="wt-acc-card" aria-labelledby="wt-log-title">
                    <h2 id="wt-log-title">➕ Log weight</h2>
                    <p className="wt-acc-card-hint">One reading per day - logging again for the same day replaces it.</p>

                    <form className="wt-pr-log" onSubmit={handleSave}>
                        <label className="wt-acc-field" style={{ gap: 4 }}>
                            <span className="wt-pr-muted">Date</span>
                            <input
                                type="date"
                                className="wt-pr-input"
                                style={{ width: 160 }}
                                value={date}
                                max={dateKey(new Date())}
                                onChange={(event) => setDate(event.target.value)}
                                required
                                disabled={saving}
                            />
                        </label>

                        <label className="wt-acc-field" style={{ gap: 4 }}>
                            <span className="wt-pr-muted">Weight (kg)</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                min="25"
                                max="300"
                                className="wt-pr-input"
                                placeholder={latestKg ? String(latestKg) : "e.g. 70.5"}
                                value={weight}
                                onChange={(event) => setWeight(event.target.value)}
                                required
                                disabled={saving}
                            />
                        </label>

                        <button type="submit" className="wt-pr-button" style={{ alignSelf: "flex-end" }} disabled={saving || !weight}>
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </form>

                    {message.text && (
                        <div className={`wt-pr-note${message.error ? " error" : ""}`} role="status">{message.text}</div>
                    )}
                </section>

                {/* Chart */}
                <section className="wt-acc-card" aria-labelledby="wt-chart-title">
                    <div className="wt-acc-section-head">
                        <h2 id="wt-chart-title">📉 Weight trend</h2>
                        <div className="wt-pr-chips" role="group" aria-label="Period">
                            {RANGES.map((option) => (
                                <button
                                    key={option.label}
                                    type="button"
                                    className={`wt-pr-chip${option === range ? " selected" : ""}`}
                                    aria-pressed={option === range}
                                    onClick={() => setRange(option)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <p className="wt-pr-muted">Loading…</p>
                    ) : (
                        <WeightChart entries={shown} target={profile.targetWeightKg} />
                    )}
                </section>

                {/* BMI */}
                <section className="wt-acc-card" aria-labelledby="wt-bmi-title">
                    <h2 id="wt-bmi-title">🧮 BMI (body mass index)</h2>

                    {!profile.heightCm ? (
                        <p className="wt-acc-card-hint" style={{ marginBottom: 0 }}>
                            Add your height in <Link to="/profile#goals" className="wt-pr-link">Profile › Body &amp; goals</Link> to see your BMI.
                        </p>
                    ) : !bmiResult ? (
                        <p className="wt-acc-card-hint" style={{ marginBottom: 0 }}>Log your weight to see your BMI.</p>
                    ) : (
                        <>
                            <div className="wt-pr-weight" style={{ marginTop: 8 }}>
                                <strong>{bmiResult.value}</strong>
                                <span className={`wt-pr-badge ${bmiResult.tone}`}>{bmiResult.label}</span>
                            </div>

                            <div className="wt-pr-scale" aria-hidden="true">
                                <span className="under" />
                                <span className="healthy" />
                                <span className="over" />
                                <span className="obese" />
                                <div className="wt-pr-scale-marker" style={{ left: `${scalePosition(bmiResult.value)}%` }} />
                            </div>
                            <div className="wt-pr-scale-labels" aria-hidden="true">
                                {[15, 18.5, 25, 30, 40].map((mark) => (
                                    <span key={mark} style={{ left: `${scalePosition(mark)}%` }}>{mark}</span>
                                ))}
                            </div>

                            {healthy && (
                                <p className="wt-pr-muted" style={{ marginBottom: 0 }}>
                                    Healthy BMI range (18.5-24.9) for {profile.heightCm} cm: about{" "}
                                    <strong>{healthy.min}-{healthy.max} kg</strong>.
                                </p>
                            )}
                        </>
                    )}

                    <p className="wt-pr-note">
                        BMI is only a rough guide: it can't tell muscle from fat, so muscular people often
                        read as "overweight". For South Asian adults, health risks start at a lower BMI
                        (from about 23).
                    </p>
                </section>

                {/* Readings */}
                <section className="wt-acc-card" aria-labelledby="wt-readings-title">
                    <h2 id="wt-readings-title">📋 All readings</h2>

                    {weights.length === 0 ? (
                        <div className="wt-acc-empty">No readings yet.</div>
                    ) : (
                        <div className="wt-acc-list">
                            {[...weights].reverse().map((entry, index, list) => {
                                const previous = list[index + 1];
                                const diff = previous
                                    ? Math.round((toNumber(entry.weightKg) - toNumber(previous.weightKg)) * 10) / 10
                                    : null;

                                return (
                                    <div key={entry.id} className="wt-acc-item">
                                        <div className="wt-acc-item-main">
                                            <div className="wt-acc-item-title">{toNumber(entry.weightKg)} kg</div>
                                            <div className="wt-acc-meta">
                                                {longDate(entry.date)}
                                                {diff ? ` · ${diff > 0 ? "▲ +" : "▼ "}${diff} kg` : ""}
                                            </div>
                                        </div>

                                        {confirmId === entry.id ? (
                                            <div className="wt-acc-actions">
                                                <button type="button" className="wt-acc-button small danger" onClick={() => handleDelete(entry.id)}>
                                                    Yes, delete
                                                </button>
                                                <button type="button" className="wt-acc-button small secondary" onClick={() => setConfirmId(null)}>
                                                    Keep
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className="wt-acc-button small secondary"
                                                onClick={() => setConfirmId(entry.id)}
                                                aria-label={`Delete ${toNumber(entry.weightKg)} kg on ${longDate(entry.date)}`}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default BodyPage;
