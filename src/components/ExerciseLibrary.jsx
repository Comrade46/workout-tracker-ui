import { useEffect, useMemo, useState } from "react";
import api from "../api/axiosConfig";

const TIMER_STORAGE_KEY = "exerciseTimerSettings";
const FAVORITES_STORAGE_KEY = "exerciseFavorites";

const defaultForm = {
    name: "",
    category: "",
    workoutType: "HOME",
    equipment: "Bodyweight",
    durationSeconds: 30,
    restSeconds: 15
};

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function formatTime(seconds) {
    const value = Number(seconds) || 0;
    if (value < 60) return `${value}s`;
    const minutes = Math.floor(value / 60);
    const remaining = value % 60;
    return remaining === 0 ? `${minutes}m` : `${minutes}m ${remaining}s`;
}

function ExerciseLibrary() {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("ALL");
    const [workoutType, setWorkoutType] = useState("ALL");
    const [view, setView] = useState("ALL");
    const [favorites, setFavorites] = useState(() => readStorage(FAVORITES_STORAGE_KEY, []));
    const [timerSettings, setTimerSettings] = useState(() => readStorage(TIMER_STORAGE_KEY, {}));
    const [showForm, setShowForm] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        loadExercises();
    }, []);

    useEffect(() => {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerSettings));
    }, [timerSettings]);

    const loadExercises = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/exercises");
            setExercises(Array.isArray(response.data) ? response.data : []);
        } catch (requestError) {
            console.error("Error loading exercise library:", requestError);
            if (requestError.response?.status === 401) {
                setError("Your session has expired. Please login again.");
            } else {
                setError("Unable to load the exercise library.");
            }
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        return [
            "ALL",
            ...Array.from(
                new Set(exercises.map((exercise) => exercise.category).filter(Boolean))
            ).sort()
        ];
    }, [exercises]);

    const filteredExercises = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return exercises.filter((exercise) => {
            const matchesSearch =
                !keyword ||
                exercise.name?.toLowerCase().includes(keyword) ||
                exercise.category?.toLowerCase().includes(keyword) ||
                exercise.equipment?.toLowerCase().includes(keyword);

            const matchesCategory =
                category === "ALL" || exercise.category === category;

            const matchesType =
                workoutType === "ALL" ||
                exercise.workoutType === workoutType ||
                exercise.workoutType === "BOTH";

            const matchesView =
                view === "ALL" ||
                (view === "CUSTOM" && exercise.isCustom) ||
                (view === "FAVORITES" && favorites.includes(exercise.id));

            return matchesSearch && matchesCategory && matchesType && matchesView;
        });
    }, [exercises, search, category, workoutType, view, favorites]);

    const customCount = exercises.filter((exercise) => exercise.isCustom).length;
    const favoriteCount = favorites.filter((id) => exercises.some((exercise) => exercise.id === id)).length;

    const getTimer = (exercise) => {
        const saved = timerSettings[exercise.id];
        return {
            durationSeconds: saved?.durationSeconds ?? exercise.durationSeconds ?? 30,
            restSeconds: saved?.restSeconds ?? exercise.restSeconds ?? 15
        };
    };

    const saveTimer = (exerciseId, durationSeconds, restSeconds) => {
        const duration = Math.max(1, Number(durationSeconds) || 1);
        const rest = Math.max(0, Number(restSeconds) || 0);

        setTimerSettings((previous) => ({
            ...previous,
            [exerciseId]: {
                durationSeconds: duration,
                restSeconds: rest
            }
        }));
    };

    const toggleFavorite = (exerciseId) => {
        setFavorites((previous) =>
            previous.includes(exerciseId)
                ? previous.filter((id) => id !== exerciseId)
                : [...previous, exerciseId]
        );
    };

    const openCreate = () => {
        setEditingExercise(null);
        setForm(defaultForm);
        setActionError("");
        setShowForm(true);
    };

    const openEdit = (exercise) => {
        const timer = getTimer(exercise);
        setEditingExercise(exercise);
        setForm({
            name: exercise.name || "",
            category: exercise.category || "",
            workoutType: exercise.workoutType || "HOME",
            equipment: exercise.equipment || "Bodyweight",
            durationSeconds: timer.durationSeconds,
            restSeconds: timer.restSeconds
        });
        setActionError("");
        setShowForm(true);
    };

    const closeForm = () => {
        if (saving) return;
        setShowForm(false);
        setEditingExercise(null);
        setActionError("");
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.name.trim() || !form.category.trim() || !form.equipment.trim()) {
            setActionError("Please fill in all required exercise fields.");
            return;
        }

        try {
            setSaving(true);
            setActionError("");

            const payload = {
                name: form.name.trim(),
                category: form.category.trim(),
                workoutType: form.workoutType,
                equipment: form.equipment.trim(),
                durationSeconds: Math.max(1, Number(form.durationSeconds) || 1),
                restSeconds: Math.max(0, Number(form.restSeconds) || 0)
            };

            let savedExercise;

            if (editingExercise) {
                const response = await api.put(`/exercises/${editingExercise.id}`, payload);
                savedExercise = response.data;
            } else {
                const response = await api.post("/exercises", payload);
                savedExercise = response.data;
            }

            saveTimer(
                savedExercise.id,
                form.durationSeconds,
                form.restSeconds
            );

            setExercises((previous) => {
                if (editingExercise) {
                    return previous.map((exercise) =>
                        exercise.id === savedExercise.id ? savedExercise : exercise
                    );
                }
                return [...previous, savedExercise];
            });

            setShowForm(false);
            setEditingExercise(null);
        } catch (requestError) {
            console.error("Error saving exercise:", requestError);
            setActionError(
                requestError.response?.data?.message ||
                "Unable to save this exercise."
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteExercise = async (exercise) => {
        if (!exercise.isCustom) return;

        const confirmed = window.confirm(
            `Delete "${exercise.name}"? This cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setActionError("");
            await api.delete(`/exercises/${exercise.id}`);

            setExercises((previous) =>
                previous.filter((item) => item.id !== exercise.id)
            );
            setFavorites((previous) =>
                previous.filter((id) => id !== exercise.id)
            );
            setTimerSettings((previous) => {
                const next = { ...previous };
                delete next[exercise.id];
                return next;
            });

            if (selectedExercise?.id === exercise.id) {
                setSelectedExercise(null);
            }
        } catch (requestError) {
            console.error("Error deleting exercise:", requestError);
            setActionError(
                requestError.response?.data?.message ||
                "Unable to delete this exercise. It may already be used in a workout plan or workout history."
            );
        }
    };

    const resetFilters = () => {
        setSearch("");
        setCategory("ALL");
        setWorkoutType("ALL");
        setView("ALL");
    };

    if (loading) {
        return (
            <div style={styles.center}>
                <div style={styles.loader}>💪</div>
                <h2 style={styles.loadingTitle}>Loading Exercise Library...</h2>
                <p style={styles.loadingText}>Preparing your workout toolbox.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.center}>
                <div style={styles.errorIcon}>!</div>
                <h2 style={styles.loadingTitle}>{error}</h2>
                <button style={styles.primaryButton} onClick={loadExercises}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <section style={styles.hero}>
                    <div>
                        <div style={styles.eyebrow}>TRAIN SMARTER</div>
                        <h1 style={styles.title}>Exercise Library</h1>
                        <p style={styles.subtitle}>
                            Explore exercises, build your own movements, and set the perfect timer for every exercise.
                        </p>
                    </div>

                    <button style={styles.addButton} onClick={openCreate}>
                        <span style={styles.addIcon}>+</span>
                        Add My Exercise
                    </button>
                </section>

                <section style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <span style={styles.statIcon}>🏋️</span>
                        <div>
                            <strong style={styles.statValue}>{exercises.length}</strong>
                            <span style={styles.statLabel}>Total Exercises</span>
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.statIcon}>✨</span>
                        <div>
                            <strong style={styles.statValue}>{customCount}</strong>
                            <span style={styles.statLabel}>My Exercises</span>
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.statIcon}>❤️</span>
                        <div>
                            <strong style={styles.statValue}>{favoriteCount}</strong>
                            <span style={styles.statLabel}>Favorites</span>
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.statIcon}>⏱️</span>
                        <div>
                            <strong style={styles.statValue}>Custom</strong>
                            <span style={styles.statLabel}>Timers Supported</span>
                        </div>
                    </div>
                </section>

                <section style={styles.toolbarCard}>
                    <div style={styles.searchWrap}>
                        <span style={styles.searchIcon}>⌕</span>
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search exercises, muscles, equipment..."
                            style={styles.searchInput}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                style={styles.clearSearch}
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <div style={styles.filterRow}>
                        <div style={styles.filterGroup}>
                            <span style={styles.filterLabel}>View</span>
                            {[
                                ["ALL", "All"],
                                ["CUSTOM", "My Exercises"],
                                ["FAVORITES", "Favorites"]
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => setView(value)}
                                    style={view === value ? styles.filterActive : styles.filterButton}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div style={styles.filterGroup}>
                            <span style={styles.filterLabel}>Category</span>
                            <select
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                                style={styles.select}
                            >
                                {categories.map((item) => (
                                    <option key={item} value={item}>
                                        {item === "ALL" ? "All categories" : item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={styles.filterGroup}>
                            <span style={styles.filterLabel}>Type</span>
                            <select
                                value={workoutType}
                                onChange={(event) => setWorkoutType(event.target.value)}
                                style={styles.select}
                            >
                                <option value="ALL">All types</option>
                                <option value="HOME">Home</option>
                                <option value="GYM">Gym</option>
                                <option value="BOTH">Both</option>
                            </select>
                        </div>

                        {(search || category !== "ALL" || workoutType !== "ALL" || view !== "ALL") && (
                            <button onClick={resetFilters} style={styles.resetButton}>
                                Reset
                            </button>
                        )}
                    </div>
                </section>

                {actionError && (
                    <div style={styles.actionError}>
                        <span>⚠️</span>
                        {actionError}
                    </div>
                )}

                <div style={styles.resultsHeader}>
                    <div>
                        <h2 style={styles.resultsTitle}>Browse Exercises</h2>
                        <p style={styles.resultsSubtitle}>
                            Showing {filteredExercises.length} of {exercises.length} exercises
                        </p>
                    </div>
                </div>

                {filteredExercises.length === 0 ? (
                    <div style={styles.emptyCard}>
                        <div style={styles.emptyIcon}>🔎</div>
                        <h2 style={styles.emptyTitle}>No exercises found</h2>
                        <p style={styles.emptyText}>
                            Try another search or create your own exercise.
                        </p>
                        <div style={styles.emptyButtons}>
                            <button style={styles.secondaryButton} onClick={resetFilters}>
                                Clear Filters
                            </button>
                            <button style={styles.primaryButton} onClick={openCreate}>
                                + Add Exercise
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {filteredExercises.map((exercise) => {
                            const timer = getTimer(exercise);
                            const isFavorite = favorites.includes(exercise.id);

                            return (
                                <article key={exercise.id} style={styles.card}>
                                    <div style={styles.cardTop}>
                                        <div style={styles.categoryIcon}>
                                            {categoryEmoji[exercise.category] || "💪"}
                                        </div>
                                        <button
                                            onClick={() => toggleFavorite(exercise.id)}
                                            style={isFavorite ? styles.favoriteActive : styles.favoriteButton}
                                            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                        >
                                            {isFavorite ? "♥" : "♡"}
                                        </button>
                                    </div>

                                    <div style={styles.badgeRow}>
                                        <span style={styles.categoryBadge}>{exercise.category}</span>
                                        {exercise.isCustom && (
                                            <span style={styles.customBadge}>MY EXERCISE</span>
                                        )}
                                    </div>

                                    <h3 style={styles.exerciseName}>{exercise.name}</h3>
                                    <p style={styles.equipment}>{exercise.equipment || "No equipment"}</p>

                                    <div style={styles.timerRow}>
                                        <div style={styles.timerPill}>
                                            <span>⏱</span>
                                            {formatTime(timer.durationSeconds)}
                                        </div>
                                        <div style={styles.timerPillMuted}>
                                            <span>↻</span>
                                            {formatTime(timer.restSeconds)} rest
                                        </div>
                                    </div>

                                    <div style={styles.cardFooter}>
                                        <span style={styles.typeText}>
                                            {exercise.workoutType === "BOTH" ? "HOME + GYM" : exercise.workoutType}
                                        </span>
                                        <button
                                            style={styles.viewButton}
                                            onClick={() => setSelectedExercise(exercise)}
                                        >
                                            View Details →
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedExercise && (
                <div style={styles.overlay} onMouseDown={() => setSelectedExercise(null)}>
                    <div style={styles.modal} onMouseDown={(event) => event.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div style={styles.modalIcon}>
                                {categoryEmoji[selectedExercise.category] || "💪"}
                            </div>
                            <button style={styles.modalClose} onClick={() => setSelectedExercise(null)}>
                                ×
                            </button>
                        </div>

                        <div style={styles.badgeRow}>
                            <span style={styles.categoryBadge}>{selectedExercise.category}</span>
                            {selectedExercise.isCustom && (
                                <span style={styles.customBadge}>MY EXERCISE</span>
                            )}
                        </div>

                        <h2 style={styles.modalTitle}>{selectedExercise.name}</h2>
                        <p style={styles.modalEquipment}>{selectedExercise.equipment || "No equipment"}</p>

                        <div style={styles.detailGrid}>
                            <div style={styles.detailCard}>
                                <span style={styles.detailLabel}>Workout Type</span>
                                <strong>{selectedExercise.workoutType}</strong>
                            </div>
                            <div style={styles.detailCard}>
                                <span style={styles.detailLabel}>Exercise Time</span>
                                <strong>{formatTime(getTimer(selectedExercise).durationSeconds)}</strong>
                            </div>
                            <div style={styles.detailCard}>
                                <span style={styles.detailLabel}>Rest Time</span>
                                <strong>{formatTime(getTimer(selectedExercise).restSeconds)}</strong>
                            </div>
                        </div>

                        <div style={styles.timerEditor}>
                            <h3 style={styles.timerEditorTitle}>Customize Timer</h3>
                            <p style={styles.timerEditorText}>
                                Set the time you want this exercise to use in your workout experience.
                            </p>
                            <div style={styles.timerInputs}>
                                <label style={styles.inputLabel}>
                                    Exercise seconds
                                    <input
                                        type="number"
                                        min="1"
                                        value={getTimer(selectedExercise).durationSeconds}
                                        onChange={(event) =>
                                            saveTimer(
                                                selectedExercise.id,
                                                event.target.value,
                                                getTimer(selectedExercise).restSeconds
                                            )
                                        }
                                        style={styles.input}
                                    />
                                </label>
                                <label style={styles.inputLabel}>
                                    Rest seconds
                                    <input
                                        type="number"
                                        min="0"
                                        value={getTimer(selectedExercise).restSeconds}
                                        onChange={(event) =>
                                            saveTimer(
                                                selectedExercise.id,
                                                getTimer(selectedExercise).durationSeconds,
                                                event.target.value
                                            )
                                        }
                                        style={styles.input}
                                    />
                                </label>
                            </div>
                        </div>

                        <div style={styles.modalActions}>
                            <button
                                style={styles.secondaryButton}
                                onClick={() => toggleFavorite(selectedExercise.id)}
                            >
                                {favorites.includes(selectedExercise.id) ? "♥ Favorited" : "♡ Favorite"}
                            </button>
                            {selectedExercise.isCustom && (
                                <>
                                    <button
                                        style={styles.secondaryButton}
                                        onClick={() => {
                                            openEdit(selectedExercise);
                                            setSelectedExercise(null);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        style={styles.dangerButton}
                                        onClick={() => deleteExercise(selectedExercise)}
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <div style={styles.overlay} onMouseDown={closeForm}>
                    <form style={styles.modal} onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
                        <div style={styles.modalHeader}>
                            <div>
                                <div style={styles.eyebrow}>{editingExercise ? "UPDATE" : "CREATE"}</div>
                                <h2 style={styles.formTitle}>
                                    {editingExercise ? "Edit My Exercise" : "Add My Exercise"}
                                </h2>
                            </div>
                            <button type="button" style={styles.modalClose} onClick={closeForm}>
                                ×
                            </button>
                        </div>

                        <div style={styles.formGrid}>
                            <label style={styles.inputLabel}>
                                Exercise name *
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Burpees"
                                    style={styles.input}
                                    maxLength={100}
                                    required
                                />
                            </label>

                            <label style={styles.inputLabel}>
                                Category *
                                <input
                                    name="category"
                                    value={form.category}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Full Body"
                                    style={styles.input}
                                    maxLength={50}
                                    required
                                />
                            </label>

                            <label style={styles.inputLabel}>
                                Workout type *
                                <select
                                    name="workoutType"
                                    value={form.workoutType}
                                    onChange={handleFormChange}
                                    style={styles.input}
                                >
                                    <option value="HOME">Home</option>
                                    <option value="GYM">Gym</option>
                                    <option value="BOTH">Home + Gym</option>
                                </select>
                            </label>

                            <label style={styles.inputLabel}>
                                Equipment *
                                <input
                                    name="equipment"
                                    value={form.equipment}
                                    onChange={handleFormChange}
                                    placeholder="Bodyweight"
                                    style={styles.input}
                                    maxLength={50}
                                    required
                                />
                            </label>

                            <label style={styles.inputLabel}>
                                Exercise time (seconds) *
                                <input
                                    type="number"
                                    name="durationSeconds"
                                    min="1"
                                    value={form.durationSeconds}
                                    onChange={handleFormChange}
                                    style={styles.input}
                                    required
                                />
                            </label>

                            <label style={styles.inputLabel}>
                                Rest time (seconds)
                                <input
                                    type="number"
                                    name="restSeconds"
                                    min="0"
                                    value={form.restSeconds}
                                    onChange={handleFormChange}
                                    style={styles.input}
                                />
                            </label>
                        </div>

                        {actionError && <div style={styles.formError}>{actionError}</div>}

                        <div style={styles.modalActions}>
                            <button type="button" style={styles.secondaryButton} onClick={closeForm} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" style={styles.primaryButton} disabled={saving}>
                                {saving ? "Saving..." : editingExercise ? "Save Changes" : "Create Exercise"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

const categoryEmoji = {
    Chest: "🔥",
    Back: "🦾",
    Legs: "🦵",
    Core: "⚡",
    Cardio: "❤️",
    Shoulders: "💪",
    Arms: "💥",
    FullBody: "🏃"
};

const styles = {
    page: {
        minHeight: "calc(100vh - 80px)",
        background: "linear-gradient(135deg, #111318 0%, #181b22 55%, #101216 100%)",
        color: "#f8fafc",
        padding: "42px 24px 70px"
    },
    container: {
        maxWidth: "1220px",
        margin: "0 auto"
    },
    hero: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "25px",
        marginBottom: "30px",
        flexWrap: "wrap"
    },
    eyebrow: {
        color: "#fbbf24",
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "2px",
        marginBottom: "8px"
    },
    title: {
        margin: 0,
        fontSize: "44px",
        lineHeight: 1.05,
        color: "#ffffff",
        fontWeight: 800,
        letterSpacing: "-1.5px"
    },
    subtitle: {
        margin: "12px 0 0",
        color: "#aab2c0",
        maxWidth: "690px",
        fontSize: "16px",
        lineHeight: 1.6
    },
    addButton: {
        border: "none",
        borderRadius: "14px",
        padding: "14px 20px",
        background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
        color: "#111318",
        fontSize: "15px",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: "0 12px 30px rgba(245,158,11,0.22)",
        display: "flex",
        alignItems: "center",
        gap: "9px"
    },
    addIcon: { fontSize: "22px", lineHeight: 1 },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
    },
    statCard: {
        background: "rgba(255,255,255,0.055)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px",
        padding: "18px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        backdropFilter: "blur(10px)"
    },
    statIcon: {
        width: "46px",
        height: "46px",
        borderRadius: "14px",
        background: "rgba(251,191,36,0.12)",
        display: "grid",
        placeItems: "center",
        fontSize: "22px"
    },
    statValue: {
        display: "block",
        fontSize: "22px",
        color: "#ffffff"
    },
    statLabel: {
        display: "block",
        color: "#8f98a8",
        fontSize: "12px",
        marginTop: "2px"
    },
    toolbarCard: {
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px",
        padding: "16px",
        marginBottom: "28px"
    },
    searchWrap: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        background: "#0d0f13",
        border: "1px solid #2a2f39",
        borderRadius: "13px",
        marginBottom: "15px"
    },
    searchIcon: {
        color: "#7e8796",
        fontSize: "25px",
        paddingLeft: "15px"
    },
    searchInput: {
        width: "100%",
        border: "none",
        outline: "none",
        background: "transparent",
        color: "#fff",
        padding: "14px 42px 14px 10px",
        fontSize: "15px"
    },
    clearSearch: {
        position: "absolute",
        right: "10px",
        border: "none",
        background: "transparent",
        color: "#9aa3b2",
        fontSize: "22px",
        cursor: "pointer"
    },
    filterRow: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap"
    },
    filterGroup: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        flexWrap: "wrap"
    },
    filterLabel: {
        color: "#737d8d",
        fontSize: "12px",
        fontWeight: 700,
        marginRight: "2px"
    },
    filterButton: {
        border: "1px solid #2b3039",
        background: "#171a20",
        color: "#aeb6c3",
        padding: "8px 11px",
        borderRadius: "9px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 700
    },
    filterActive: {
        border: "1px solid #fbbf24",
        background: "rgba(251,191,36,0.13)",
        color: "#fbbf24",
        padding: "8px 11px",
        borderRadius: "9px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 800
    },
    select: {
        border: "1px solid #2b3039",
        background: "#171a20",
        color: "#d9dee7",
        padding: "8px 11px",
        borderRadius: "9px",
        outline: "none",
        fontSize: "12px"
    },
    resetButton: {
        marginLeft: "auto",
        border: "none",
        background: "transparent",
        color: "#fbbf24",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: "12px"
    },
    actionError: {
        padding: "13px 15px",
        borderRadius: "12px",
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.3)",
        color: "#fecaca",
        marginBottom: "20px",
        fontSize: "13px",
        display: "flex",
        gap: "8px"
    },
    resultsHeader: {
        display: "flex",
        alignItems: "end",
        justifyContent: "space-between",
        marginBottom: "15px"
    },
    resultsTitle: {
        margin: 0,
        color: "#fff",
        fontSize: "22px"
    },
    resultsSubtitle: {
        margin: "5px 0 0",
        color: "#7f8999",
        fontSize: "13px"
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
        gap: "18px"
    },
    card: {
        background: "linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035))",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "19px",
        padding: "20px",
        minHeight: "250px",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, border-color 0.2s ease",
        boxShadow: "0 12px 35px rgba(0,0,0,0.16)"
    },
    cardTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "14px"
    },
    categoryIcon: {
        width: "52px",
        height: "52px",
        borderRadius: "16px",
        display: "grid",
        placeItems: "center",
        fontSize: "25px",
        background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.06))",
        border: "1px solid rgba(251,191,36,0.15)"
    },
    favoriteButton: {
        border: "1px solid #343a46",
        background: "#171a20",
        color: "#8791a0",
        width: "38px",
        height: "38px",
        borderRadius: "12px",
        cursor: "pointer",
        fontSize: "22px"
    },
    favoriteActive: {
        border: "1px solid rgba(248,113,113,0.4)",
        background: "rgba(239,68,68,0.12)",
        color: "#fb7185",
        width: "38px",
        height: "38px",
        borderRadius: "12px",
        cursor: "pointer",
        fontSize: "20px"
    },
    badgeRow: {
        display: "flex",
        gap: "7px",
        flexWrap: "wrap",
        alignItems: "center"
    },
    categoryBadge: {
        display: "inline-flex",
        padding: "5px 9px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.07)",
        color: "#b8c0cc",
        fontSize: "11px",
        fontWeight: 800
    },
    customBadge: {
        display: "inline-flex",
        padding: "5px 9px",
        borderRadius: "999px",
        background: "rgba(251,191,36,0.13)",
        color: "#fbbf24",
        fontSize: "9px",
        fontWeight: 900,
        letterSpacing: "0.7px"
    },
    exerciseName: {
        margin: "12px 0 4px",
        color: "#fff",
        fontSize: "20px",
        lineHeight: 1.2
    },
    equipment: {
        margin: 0,
        color: "#7f8999",
        fontSize: "13px"
    },
    timerRow: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginTop: "17px"
    },
    timerPill: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 9px",
        borderRadius: "9px",
        background: "rgba(251,191,36,0.11)",
        color: "#fbbf24",
        fontSize: "12px",
        fontWeight: 800
    },
    timerPillMuted: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 9px",
        borderRadius: "9px",
        background: "rgba(255,255,255,0.05)",
        color: "#9aa3b2",
        fontSize: "12px",
        fontWeight: 700
    },
    cardFooter: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        marginTop: "auto",
        paddingTop: "18px"
    },
    typeText: {
        color: "#626c7c",
        fontSize: "10px",
        fontWeight: 900,
        letterSpacing: "0.8px"
    },
    viewButton: {
        border: "none",
        background: "transparent",
        color: "#fbbf24",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 800
    },
    emptyCard: {
        padding: "70px 20px",
        borderRadius: "20px",
        textAlign: "center",
        background: "rgba(255,255,255,0.045)",
        border: "1px dashed #343a46"
    },
    emptyIcon: { fontSize: "44px" },
    emptyTitle: { margin: "14px 0 7px", color: "#fff" },
    emptyText: { margin: 0, color: "#7f8999" },
    emptyButtons: {
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        marginTop: "20px"
    },
    primaryButton: {
        border: "none",
        borderRadius: "11px",
        padding: "12px 17px",
        background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
        color: "#111318",
        fontWeight: 800,
        cursor: "pointer"
    },
    secondaryButton: {
        border: "1px solid #343a46",
        borderRadius: "11px",
        padding: "12px 17px",
        background: "#171a20",
        color: "#d6dbe4",
        fontWeight: 700,
        cursor: "pointer"
    },
    dangerButton: {
        border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: "11px",
        padding: "12px 17px",
        background: "rgba(239,68,68,0.1)",
        color: "#fca5a5",
        fontWeight: 700,
        cursor: "pointer"
    },
    center: {
        minHeight: "70vh",
        background: "#111318",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        color: "#fff"
    },
    loader: { fontSize: "52px" },
    errorIcon: {
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "rgba(239,68,68,0.12)",
        color: "#f87171",
        fontSize: "25px",
        fontWeight: 900
    },
    loadingTitle: { margin: 0, color: "#fff" },
    loadingText: { margin: 0, color: "#7f8999" },
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(7px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
    },
    modal: {
        width: "100%",
        maxWidth: "620px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#171a20",
        border: "1px solid #343a46",
        borderRadius: "22px",
        padding: "25px",
        color: "#fff",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)"
    },
    modalHeader: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "15px",
        marginBottom: "17px"
    },
    modalIcon: {
        width: "58px",
        height: "58px",
        borderRadius: "17px",
        display: "grid",
        placeItems: "center",
        fontSize: "28px",
        background: "rgba(251,191,36,0.12)"
    },
    modalClose: {
        border: "none",
        background: "transparent",
        color: "#8b95a5",
        fontSize: "30px",
        cursor: "pointer",
        lineHeight: 1
    },
    modalTitle: {
        color: "#fff",
        fontSize: "30px",
        margin: "14px 0 4px"
    },
    formTitle: {
        color: "#fff",
        margin: 0,
        fontSize: "26px"
    },
    modalEquipment: {
        color: "#8e98a8",
        margin: 0
    },
    detailGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "10px",
        marginTop: "22px"
    },
    detailCard: {
        background: "#101318",
        border: "1px solid #2a303a",
        borderRadius: "13px",
        padding: "14px"
    },
    detailLabel: {
        display: "block",
        color: "#737d8d",
        fontSize: "11px",
        marginBottom: "5px"
    },
    timerEditor: {
        marginTop: "20px",
        padding: "17px",
        borderRadius: "15px",
        background: "rgba(251,191,36,0.055)",
        border: "1px solid rgba(251,191,36,0.12)"
    },
    timerEditorTitle: { margin: 0, fontSize: "17px" },
    timerEditorText: { margin: "5px 0 14px", color: "#8e98a8", fontSize: "12px" },
    timerInputs: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "14px"
    },
    inputLabel: {
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        color: "#aab3c0",
        fontSize: "12px",
        fontWeight: 700
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #343a46",
        borderRadius: "10px",
        background: "#0e1014",
        color: "#fff",
        padding: "11px 12px",
        outline: "none",
        fontSize: "14px"
    },
    formError: {
        marginTop: "15px",
        padding: "11px",
        borderRadius: "10px",
        background: "rgba(239,68,68,0.1)",
        color: "#fca5a5",
        fontSize: "12px"
    },
    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "9px",
        flexWrap: "wrap",
        marginTop: "20px"
    }
};

export default ExerciseLibrary;