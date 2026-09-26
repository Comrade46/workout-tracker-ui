import { useEffect, useMemo, useState } from "react";
import api from "../api/axiosConfig";
import "./Exercises.css";
import ExerciseImage from "./ExerciseImage";
import ExerciseHowTo from "./ExerciseHowTo";

const EMPTY_FORM = {
    name: "",
    category: "Chest",
    workoutType: "HOME",
    equipment: "No Equipment",
    trackingType: "REPS",
    defaultReps: 12,
    durationSeconds: 30,
    restSeconds: 15
};

const NUMBER_FIELDS = [
    "defaultReps",
    "durationSeconds",
    "restSeconds"
];

function workoutTypeLabel(type) {
    if (type === "GYM") return "🏋️ Gym";
    if (type === "BOTH") return "🏠🏋️ Home & Gym";
    return "🏠 Home";
}

function Exercises() {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [workoutType, setWorkoutType] = useState("All");

    const [showAddForm, setShowAddForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Exercise being edited, or null when adding a new one
    const [editingExercise, setEditingExercise] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/exercises");

            setExercises(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (requestError) {
            console.error(
                "Error loading exercises:",
                requestError
            );

            if (requestError.response?.status === 401) {
                setError(
                    "Your session has expired. Please login again."
                );
            } else {
                setError(
                    "Unable to load exercises."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const values = exercises
            .map((exercise) => exercise.category)
            .filter(Boolean);

        return [
            "All",
            ...new Set(values)
        ];
    }, [exercises]);

    const filteredExercises = useMemo(() => {
        const keyword = search
            .trim()
            .toLowerCase();

        return exercises.filter((exercise) => {
            const name =
                exercise.name?.toLowerCase() || "";

            const exerciseCategory =
                exercise.category?.toLowerCase() || "";

            const matchesSearch =
                !keyword ||
                name.includes(keyword) ||
                exerciseCategory.includes(keyword);

            const matchesCategory =
                category === "All" ||
                exercise.category === category;

            const type =
                exercise.workoutType
                    ?.toString()
                    .toUpperCase();

            const matchesWorkoutType =
                workoutType === "All" ||
                type === workoutType;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesWorkoutType
            );
        });
    }, [
        exercises,
        search,
        category,
        workoutType
    ]);

    const handleFormChange = (event) => {
        const { name, value } =
            event.target;

        setForm((previous) => ({
            ...previous,
            [name]:
                NUMBER_FIELDS.includes(name)
                    ? Number(value)
                    : value
        }));
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingExercise(null);
    };

    const closeForm = () => {
        resetForm();
        setShowAddForm(false);
    };

    const startEdit = (exercise) => {
        setEditingExercise(exercise);

        setForm({
            name: exercise.name || "",
            category: exercise.category || "Chest",
            workoutType: exercise.workoutType || "HOME",
            equipment: exercise.equipment || "No Equipment",
            trackingType: exercise.trackingType || "REPS",
            defaultReps: exercise.defaultReps ?? 12,
            durationSeconds: exercise.durationSeconds ?? 30,
            restSeconds: exercise.restSeconds ?? 15
        });

        setShowAddForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const deleteExercise = async (exercise) => {
        const confirmed = window.confirm(
            `Delete "${exercise.name}"?\n\nIt will also be removed from any workout plans that use it. This cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(exercise.id);

            await api.delete(
                `/exercises/${exercise.id}`
            );

            setExercises((previous) =>
                previous.filter(
                    (item) => item.id !== exercise.id
                )
            );

            if (editingExercise?.id === exercise.id) {
                closeForm();
            }
        } catch (requestError) {
            console.error(
                "Error deleting exercise:",
                requestError
            );

            alert(
                requestError.response?.data?.message ||
                requestError.userMessage ||
                "Unable to delete exercise."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const saveExercise = async (event) => {
        event.preventDefault();

        if (!form.name.trim()) {
            alert(
                "Please enter an exercise name."
            );
            return;
        }

        const isTime =
            form.trackingType === "TIME";

        if (isTime && form.durationSeconds < 1) {
            alert(
                "Duration must be at least 1 second."
            );
            return;
        }

        if (!isTime && form.defaultReps < 1) {
            alert(
                "Reps must be at least 1."
            );
            return;
        }

        if (form.restSeconds < 0) {
            alert(
                "Rest time cannot be negative."
            );
            return;
        }

        try {
            setSaving(true);

            const payload = {
                name: form.name.trim(),
                category: form.category,
                workoutType: form.workoutType,
                equipment:
                    form.equipment.trim() ||
                    "No Equipment",
                trackingType:
                    form.trackingType,
                defaultReps: isTime
                    ? null
                    : form.defaultReps,
                durationSeconds: isTime
                    ? form.durationSeconds
                    : null,
                restSeconds:
                    form.restSeconds
            };

            if (editingExercise) {
                const response =
                    await api.put(
                        `/exercises/${editingExercise.id}`,
                        payload
                    );

                setExercises((previous) =>
                    previous.map((item) =>
                        item.id === editingExercise.id
                            ? response.data
                            : item
                    )
                );
            } else {
                const response =
                    await api.post(
                        "/exercises",
                        payload
                    );

                setExercises((previous) => [
                    response.data,
                    ...previous
                ]);
            }

            const wasEditing =
                Boolean(editingExercise);

            closeForm();

            alert(
                wasEditing
                    ? "Exercise updated successfully!"
                    : "Exercise added successfully!"
            );
        } catch (requestError) {
            console.error(
                "Error creating exercise:",
                requestError
            );

            const validationErrors =
                requestError.response?.data?.validationErrors;

            alert(
                (validationErrors &&
                    Object.values(validationErrors).join("\n")) ||
                requestError.response?.data?.message ||
                "Unable to save exercise."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.center}>
                <div style={styles.loadingIcon}>
                    🏋️
                </div>

                <h2 style={styles.centerTitle}>
                    Loading exercises...
                </h2>

                <p style={styles.muted}>
                    Preparing your exercise library
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.center}>
                <div style={styles.errorIcon}>
                    ⚠️
                </div>

                <h2 style={styles.centerTitle}>
                    {error}
                </h2>

                <button
                    type="button"
                    style={styles.primaryButton}
                    onClick={loadExercises}
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
    <div
        className="wt-exercises-page"
        style={styles.page}
    >
            <div style={styles.container}>

                {/* =========================
                    HEADER
                ========================= */}

                <div style={styles.hero}>
                    <div>
                        <div style={styles.eyebrow}>
                            WORKOUT LIBRARY
                        </div>

                        <h1 style={styles.title}>
                            Exercise Library
                        </h1>

                        <p style={styles.subtitle}>
                            Discover exercises,
                            customize your training,
                            and build your perfect
                            workout.
                        </p>
                    </div>

                    <button
                        type="button"
                        style={styles.addButton}
                        onClick={() => {
                            if (showAddForm) {
                                closeForm();
                            } else {
                                resetForm();
                                setShowAddForm(true);
                            }
                        }}
                    >
                        {showAddForm
                            ? "✕ Close"
                            : "＋ Add Exercise"}
                    </button>
                </div>

                {/* =========================
                    ADD EXERCISE FORM
                ========================= */}

                {showAddForm && (
                    <div style={styles.formCard}>

                        <div
                            style={styles.formHeader}
                        >
                            <div>
                                <h2
                                    style={
                                        styles.formTitle
                                    }
                                >
                                    {editingExercise
                                        ? `Edit "${editingExercise.name}"`
                                        : "Create Your Exercise"}
                                </h2>

                                <p
                                    style={
                                        styles.formSubtitle
                                    }
                                >
                                    {editingExercise
                                        ? "Update how this exercise is tracked and its defaults."
                                        : "Add your own exercise with reps or time and rest."}
                                </p>
                            </div>

                            <span
                                style={
                                    styles.customBadge
                                }
                            >
                                {editingExercise
                                    ? "✏️ EDIT"
                                    : "⭐ CUSTOM"}
                            </span>
                        </div>

                        <form
                            onSubmit={saveExercise}
                        >
                            <div
                                style={
                                    styles.formGrid
                                }
                            >

                                {/* NAME */}

                                <div
                                    style={
                                        styles.field
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Exercise Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="e.g. Incline Push-Ups"
                                        style={
                                            styles.input
                                        }
                                    />
                                </div>

                                {/* CATEGORY */}

                                <div
                                    style={
                                        styles.field
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Category
                                    </label>

                                    <select
                                        name="category"
                                        value={
                                            form.category
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        style={
                                            styles.select
                                        }
                                    >
                                        <option value="Chest">
                                            Chest
                                        </option>

                                        <option value="Back">
                                            Back
                                        </option>

                                        <option value="Shoulders">
                                            Shoulders
                                        </option>

                                        <option value="Arms">
                                            Arms
                                        </option>

                                        <option value="Legs">
                                            Legs
                                        </option>

                                        <option value="Core">
                                            Core
                                        </option>

                                        <option value="Cardio">
                                            Cardio
                                        </option>

                                        <option value="Full Body">
                                            Full Body
                                        </option>
                                    </select>
                                </div>

                                {/* WORKOUT TYPE */}

                                <div
                                    style={
                                        styles.field
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Workout Type
                                    </label>

                                    <select
                                        name="workoutType"
                                        value={
                                            form.workoutType
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        style={
                                            styles.select
                                        }
                                    >
                                        <option value="HOME">
                                            🏠 Home
                                        </option>

                                        <option value="GYM">
                                            🏋️ Gym
                                        </option>

                                        <option value="BOTH">
                                            🏠🏋️ Home & Gym
                                        </option>
                                    </select>
                                </div>

                                {/* EQUIPMENT */}

                                <div
                                    style={
                                        styles.field
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Equipment
                                    </label>

                                    <input
                                        type="text"
                                        name="equipment"
                                        value={
                                            form.equipment
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="e.g. Dumbbells"
                                        style={
                                            styles.input
                                        }
                                    />
                                </div>

                                {/* TRACKING TYPE */}

                                <div
                                    style={
                                        styles.field
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Tracked By
                                    </label>

                                    <select
                                        name="trackingType"
                                        value={
                                            form.trackingType
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        style={
                                            styles.select
                                        }
                                    >
                                        <option value="REPS">
                                            🔁 Repetitions (e.g. Push-Ups)
                                        </option>

                                        <option value="TIME">
                                            ⏱️ Time (e.g. Plank)
                                        </option>
                                    </select>
                                </div>

                                {/* REPS */}

                                {form.trackingType !== "TIME" && (
                                <div
                                    style={
                                        styles.field
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Default Reps
                                    </label>

                                    <div
                                        style={
                                            styles.inputWithUnit
                                        }
                                    >
                                        <input
                                            type="number"
                                            name="defaultReps"
                                            min="1"
                                            value={
                                                form.defaultReps
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            style={
                                                styles.numberInput
                                            }
                                        />

                                        <span
                                            style={
                                                styles.unit
                                            }
                                        >
                                            reps
                                        </span>
                                    </div>
                                </div>
                                )}

                                {/* DURATION */}

                                {form.trackingType === "TIME" && (
                                <div
                                    style={
                                        styles.field
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Exercise Duration
                                    </label>

                                    <div
                                        style={
                                            styles.inputWithUnit
                                        }
                                    >
                                        <input
                                            type="number"
                                            name="durationSeconds"
                                            min="1"
                                            value={
                                                form.durationSeconds
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            style={
                                                styles.numberInput
                                            }
                                        />

                                        <span
                                            style={
                                                styles.unit
                                            }
                                        >
                                            seconds
                                        </span>
                                    </div>
                                </div>
                                )}

                                {/* REST */}

                                <div
                                    style={
                                        styles.field
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Rest Time
                                    </label>

                                    <div
                                        style={
                                            styles.inputWithUnit
                                        }
                                    >
                                        <input
                                            type="number"
                                            name="restSeconds"
                                            min="0"
                                            value={
                                                form.restSeconds
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            style={
                                                styles.numberInput
                                            }
                                        />

                                        <span
                                            style={
                                                styles.unit
                                            }
                                        >
                                            seconds
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div
                                style={
                                    styles.formActions
                                }
                            >
                                <button
                                    type="button"
                                    style={
                                        styles.cancelButton
                                    }
                                    onClick={() => {
                                        if (saving) return;

                                        closeForm();
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    style={
                                        styles.saveButton
                                    }
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingExercise
                                        ? "✓ Save Changes"
                                        : "＋ Create Exercise"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* =========================
                    SEARCH + FILTERS
                ========================= */}

                <div
                    style={
                        styles.filterCard
                    }
                >
                    <div
                        style={
                            styles.searchBox
                        }
                    >
                        <span
                            style={
                                styles.searchIcon
                            }
                        >
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder="Search exercises..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            style={
                                styles.searchInput
                            }
                        />
                    </div>

                    <div
                        style={
                            styles.filterRow
                        }
                    >
                        <div
                            style={
                                styles.filterGroup
                            }
                        >
                            <span
                                style={
                                    styles.filterLabel
                                }
                            >
                                Category
                            </span>

                            <select
                                value={category}
                                onChange={(event) =>
                                    setCategory(
                                        event.target.value
                                    )
                                }
                                style={
                                    styles.filterSelect
                                }
                            >
                                {categories.map(
                                    (item) => (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {item}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div
                            style={
                                styles.filterGroup
                            }
                        >
                            <span
                                style={
                                    styles.filterLabel
                                }
                            >
                                Workout
                            </span>

                            <select
                                value={
                                    workoutType
                                }
                                onChange={(event) =>
                                    setWorkoutType(
                                        event.target.value
                                    )
                                }
                                style={
                                    styles.filterSelect
                                }
                            >
                                <option value="All">
                                    All
                                </option>

                                <option value="HOME">
                                    🏠 Home
                                </option>

                                <option value="GYM">
                                    🏋️ Gym
                                </option>

                                <option value="BOTH">
                                    🏠🏋️ Home & Gym
                                </option>
                            </select>
                        </div>

                        <div
                            style={
                                styles.resultCount
                            }
                        >
                            <strong
                                style={
                                    styles.resultNumber
                                }
                            >
                                {
                                    filteredExercises.length
                                }
                            </strong>

                            <span
                                style={
                                    styles.resultLabel
                                }
                            >
                                exercises
                            </span>
                        </div>
                    </div>
                </div>

                {/* =========================
                    EMPTY STATE
                ========================= */}

                {filteredExercises.length === 0 ? (
                    <div
                        style={
                            styles.emptyCard
                        }
                    >
                        <div
                            style={
                                styles.emptyIcon
                            }
                        >
                            🔎
                        </div>

                        <h2
                            style={
                                styles.emptyTitle
                            }
                        >
                            No exercises found
                        </h2>

                        <p
                            style={
                                styles.muted
                            }
                        >
                            Try changing your search
                            or filters.
                        </p>

                        <button
                            type="button"
                            style={
                                styles.primaryButton
                            }
                            onClick={() => {
                                setSearch("");
                                setCategory("All");
                                setWorkoutType("All");
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    /* =========================
                       EXERCISE GRID
                    ========================= */

                    <div style={styles.grid}>
                        {filteredExercises.map(
                            (exercise) => {
                                const isTime =
                                    exercise.trackingType ===
                                    "TIME";

                                const duration =
                                    exercise.durationSeconds ??
                                    30;

                                const reps =
                                    exercise.defaultReps ??
                                    12;

                                const rest =
                                    exercise.restSeconds ??
                                    15;

                                const type =
                                    exercise.workoutType
                                        ?.toString()
                                        .toUpperCase();

                                const isCustom =
                                    exercise.isCustom ===
                                    true;

                                return (
                                    <div
                                        key={
                                            exercise.id
                                        }
                                        style={
                                            styles.card
                                        }
                                    >
                                        {/* Picture (when available) */}
                                        <ExerciseImage
                                            name={
                                                exercise.name
                                            }
                                            height={150}
                                            style={{
                                                marginBottom: 14
                                            }}
                                        />

                                        <div
                                            style={
                                                styles.cardTop
                                            }
                                        >
                                            <div
                                                style={
                                                    styles.exerciseIcon
                                                }
                                            >
                                                {exercise.category ===
                                                "Legs"
                                                    ? "🦵"
                                                    : exercise.category ===
                                                      "Chest"
                                                    ? "💪"
                                                    : exercise.category ===
                                                      "Back"
                                                    ? "🔙"
                                                    : exercise.category ===
                                                      "Shoulders"
                                                    ? "🏋️"
                                                    : exercise.category ===
                                                      "Core"
                                                    ? "🔥"
                                                    : exercise.category ===
                                                      "Cardio"
                                                    ? "🏃"
                                                    : "⚡"}
                                            </div>

                                            {isCustom && (
                                                <span
                                                    style={
                                                        styles.customSmallBadge
                                                    }
                                                >
                                                    ⭐ Custom
                                                </span>
                                            )}
                                        </div>

                                        <h2
                                            style={
                                                styles.exerciseName
                                            }
                                        >
                                            {
                                                exercise.name
                                            }
                                        </h2>

                                        <div
                                            style={
                                                styles.badges
                                            }
                                        >
                                            <span
                                                style={
                                                    styles.categoryBadge
                                                }
                                            >
                                                {
                                                    exercise.category
                                                }
                                            </span>

                                            <span
                                                style={
                                                    styles.typeBadge
                                                }
                                            >
                                                {workoutTypeLabel(
                                                    type
                                                )}
                                            </span>
                                        </div>

                                        <div
                                            style={
                                                styles.equipment
                                            }
                                        >
                                            <span>
                                                🧰
                                            </span>

                                            <span
                                                style={
                                                    styles.equipmentText
                                                }
                                            >
                                                {
                                                    exercise.equipment ||
                                                    "No Equipment"
                                                }
                                            </span>
                                        </div>

                                        <ExerciseHowTo
                                            name={
                                                exercise.name
                                            }
                                            compact
                                        />

                                        <div
                                            style={
                                                styles.timeContainer
                                            }
                                        >
                                            <div
                                                style={
                                                    styles.timeBox
                                                }
                                            >
                                                <span
                                                    style={
                                                        styles.timeIcon
                                                    }
                                                >
                                                    {isTime
                                                        ? "⏱️"
                                                        : "🔁"}
                                                </span>

                                                <div
                                                    style={
                                                        styles.timeContent
                                                    }
                                                >
                                                    <strong
                                                        style={
                                                            styles.timeValue
                                                        }
                                                    >
                                                        {isTime
                                                            ? `${duration}s`
                                                            : `${reps} reps`}
                                                    </strong>

                                                    <small
                                                        style={
                                                            styles.timeLabel
                                                        }
                                                    >
                                                        {isTime
                                                            ? "Duration"
                                                            : "Reps / set"}
                                                    </small>
                                                </div>
                                            </div>

                                            <div
                                                style={
                                                    styles.timeBox
                                                }
                                            >
                                                <span
                                                    style={
                                                        styles.timeIcon
                                                    }
                                                >
                                                    😴
                                                </span>

                                                <div
                                                    style={
                                                        styles.timeContent
                                                    }
                                                >
                                                    <strong
                                                        style={
                                                            styles.timeValue
                                                        }
                                                    >
                                                        {rest}
                                                        s
                                                    </strong>

                                                    <small
                                                        style={
                                                            styles.timeLabel
                                                        }
                                                    >
                                                        Rest
                                                    </small>
                                                </div>
                                            </div>
                                        </div>

                                        {exercise.editable ? (
                                        <div
                                            style={
                                                styles.cardActions
                                            }
                                        >
                                            <button
                                                type="button"
                                                style={
                                                    styles.editButton
                                                }
                                                onClick={() =>
                                                    startEdit(
                                                        exercise
                                                    )
                                                }
                                            >
                                                ✏️ Edit
                                            </button>

                                            <button
                                                type="button"
                                                style={
                                                    styles.deleteButton
                                                }
                                                disabled={
                                                    deletingId ===
                                                    exercise.id
                                                }
                                                onClick={() =>
                                                    deleteExercise(
                                                        exercise
                                                    )
                                                }
                                            >
                                                {deletingId ===
                                                exercise.id
                                                    ? "Deleting..."
                                                    : "🗑️ Delete"}
                                            </button>
                                        </div>
                                        ) : (
                                        <div
                                            style={
                                                styles.readOnlyNote
                                            }
                                        >
                                            🔒 Built-in exercise
                                        </div>
                                        )}
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}

                <p style={styles.mediaCredit}>
                    Exercise photos and instructions:{" "}
                    <a
                        href="https://github.com/yuhonas/free-exercise-db"
                        target="_blank"
                        rel="noreferrer"
                        style={styles.mediaCreditLink}
                    >
                        free-exercise-db
                    </a>{" "}
                    (public domain).
                </p>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        backgroundColor:
            "var(--wt-page-background)",
        color:
            "var(--wt-text-primary)",
        padding: "40px 20px"
    },

    container: {
        maxWidth: "1200px",
        margin: "0 auto"
    },

    hero: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        marginBottom: "30px",
        flexWrap: "wrap"
    },

    eyebrow: {
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "2px",
        color: "var(--wt-text-muted)",
        marginBottom: "8px"
    },

    title: {
        margin: 0,
        fontSize: "38px",
        fontWeight: "800",
        color: "var(--wt-text-primary)"
    },

    subtitle: {
        marginTop: "8px",
        color: "var(--wt-text-secondary)",
        fontSize: "16px",
        lineHeight: 1.6
    },

    addButton: {
        border: "none",
        borderRadius: "12px",
        padding: "14px 22px",
        background:
            "var(--wt-button-background)",
        color:
            "var(--wt-button-text)",
        fontSize: "15px",
        fontWeight: "700",
        cursor: "pointer",
        boxShadow: "var(--wt-shadow)"
    },

    filterCard: {
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)",
        borderRadius: "18px",
        padding: "20px",
        marginBottom: "25px",
        boxShadow: "var(--wt-shadow)",
        border:
            "1px solid var(--wt-border)"
    },

    searchBox: {
        display: "flex",
        alignItems: "center",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "12px",
        padding: "0 15px",
        backgroundColor:
            "var(--wt-input-background)"
    },

    searchIcon: {
        fontSize: "18px"
    },

    searchInput: {
        width: "100%",
        border: "none",
        outline: "none",
        background: "transparent",
        color: "var(--wt-input-text)",
        padding: "14px",
        fontSize: "15px"
    },

    filterRow: {
        display: "flex",
        alignItems: "end",
        gap: "20px",
        marginTop: "18px",
        flexWrap: "wrap"
    },

    filterGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "7px"
    },

    filterLabel: {
        fontSize: "12px",
        fontWeight: "700",
        color: "var(--wt-text-muted)",
        textTransform: "uppercase"
    },

    filterSelect: {
        border:
            "1px solid var(--wt-border)",
        borderRadius: "10px",
        padding: "10px 14px",
        backgroundColor:
            "var(--wt-select-background)",
        color:
            "var(--wt-select-text)",
        outline: "none",
        fontSize: "14px",
        minWidth: "150px",
        WebkitTextFillColor:
            "var(--wt-select-text)"
    },

    resultCount: {
        marginLeft: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8px 20px"
    },

    resultNumber: {
        color: "var(--wt-text-primary)",
        fontSize: "20px"
    },

    resultLabel: {
        color: "var(--wt-text-muted)",
        fontSize: "12px"
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "22px"
    },

    card: {
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)",
        borderRadius: "20px",
        padding: "22px",
        boxShadow: "var(--wt-shadow)",
        border:
            "1px solid var(--wt-border)"
    },

    cardTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px"
    },

    exerciseIcon: {
        width: "55px",
        height: "55px",
        borderRadius: "16px",
        backgroundColor:
            "var(--wt-surface-tertiary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "27px"
    },

    customSmallBadge: {
        backgroundColor:
            "var(--wt-success-soft)",
        color:
            "var(--wt-success)",
        borderRadius: "20px",
        padding: "6px 10px",
        fontSize: "11px",
        fontWeight: "700"
    },

    exerciseName: {
        margin: "0 0 12px",
        fontSize: "20px",
        fontWeight: "750",
        color: "var(--wt-text-primary)"
    },

    badges: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "16px"
    },

    categoryBadge: {
        backgroundColor:
            "var(--wt-accent-soft)",
        color:
            "var(--wt-accent)",
        padding: "6px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700"
    },

    typeBadge: {
        backgroundColor:
            "var(--wt-surface-tertiary)",
        color:
            "var(--wt-text-secondary)",
        padding: "6px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700"
    },

    equipment: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        color: "var(--wt-text-secondary)",
        fontSize: "14px",
        paddingBottom: "17px",
        borderBottom:
            "1px solid var(--wt-border)"
    },

    equipmentText: {
        color: "var(--wt-text-secondary)"
    },

    timeContainer: {
        display: "grid",
        gridTemplateColumns:
            "1fr 1fr",
        gap: "10px",
        marginTop: "17px"
    },

    timeBox: {
        backgroundColor:
            "var(--wt-surface-secondary)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "12px",
        padding: "12px",
        display: "flex",
        alignItems: "center",
        gap: "9px"
    },

    timeIcon: {
        fontSize: "18px"
    },

    timeContent: {
        display: "flex",
        flexDirection: "column",
        gap: "3px"
    },

    timeValue: {
        color: "var(--wt-text-primary)"
    },

    timeLabel: {
        color: "var(--wt-text-muted)"
    },

    mediaCredit: {
        marginTop: "28px",
        textAlign: "center",
        fontSize: "12px",
        color: "var(--wt-text-muted)"
    },

    mediaCreditLink: {
        color: "var(--wt-text-secondary)"
    },

    cardActions: {
        display: "grid",
        gridTemplateColumns:
            "1fr 1fr",
        gap: "10px",
        marginTop: "14px"
    },

    readOnlyNote: {
        marginTop: "14px",
        padding: "10px",
        textAlign: "center",
        fontSize: "12px",
        fontWeight: "600",
        color: "var(--wt-text-muted)"
    },

    editButton: {
        border:
            "1px solid var(--wt-border)",
        borderRadius: "10px",
        padding: "10px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-primary)",
        fontWeight: "700",
        cursor: "pointer"
    },

    deleteButton: {
        border:
            "1px solid var(--wt-danger)",
        borderRadius: "10px",
        padding: "10px",
        backgroundColor:
            "transparent",
        color:
            "var(--wt-danger)",
        fontWeight: "700",
        cursor: "pointer"
    },

    emptyCard: {
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)",
        borderRadius: "20px",
        padding: "60px 30px",
        textAlign: "center",
        boxShadow: "var(--wt-shadow)",
        border:
            "1px solid var(--wt-border)"
    },

    emptyIcon: {
        fontSize: "45px",
        marginBottom: "10px"
    },

    emptyTitle: {
        color: "var(--wt-text-primary)"
    },

    primaryButton: {
        border: "none",
        borderRadius: "10px",
        padding: "12px 22px",
        backgroundColor:
            "var(--wt-button-background)",
        color:
            "var(--wt-button-text)",
        fontWeight: "600",
        cursor: "pointer"
    },

    muted: {
        color: "var(--wt-text-muted)"
    },

    center: {
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        backgroundColor:
            "var(--wt-page-background)",
        color:
            "var(--wt-text-primary)"
    },

    centerTitle: {
        color: "var(--wt-text-primary)"
    },

    loadingIcon: {
        fontSize: "45px"
    },

    errorIcon: {
        fontSize: "45px"
    },

    formCard: {
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)",
        borderRadius: "20px",
        padding: "25px",
        marginBottom: "25px",
        boxShadow: "var(--wt-shadow)",
        border:
            "1px solid var(--wt-border)"
    },

    formHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
        marginBottom: "25px"
    },

    formTitle: {
        margin: 0,
        fontSize: "23px",
        color: "var(--wt-text-primary)"
    },

    formSubtitle: {
        margin: "6px 0 0",
        color: "var(--wt-text-secondary)",
        fontSize: "14px"
    },

    customBadge: {
        backgroundColor:
            "var(--wt-success-soft)",
        color:
            "var(--wt-success)",
        padding: "7px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "800"
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(230px, 1fr))",
        gap: "18px"
    },

    field: {
        display: "flex",
        flexDirection: "column",
        gap: "7px"
    },

    label: {
        fontSize: "13px",
        fontWeight: "700",
        color: "var(--wt-text-primary)"
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "10px",
        padding: "12px",
        outline: "none",
        fontSize: "14px",
        backgroundColor:
            "var(--wt-input-background)",
        color:
            "var(--wt-input-text)",
        WebkitTextFillColor:
            "var(--wt-input-text)"
    },

    select: {
        width: "100%",
        boxSizing: "border-box",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "10px",
        padding: "12px",
        outline: "none",
        fontSize: "14px",
        backgroundColor:
            "var(--wt-select-background)",
        color:
            "var(--wt-select-text)",
        WebkitTextFillColor:
            "var(--wt-select-text)",
        cursor: "pointer"
    },

    inputWithUnit: {
        display: "flex",
        alignItems: "center",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "10px",
        overflow: "hidden",
        backgroundColor:
            "var(--wt-input-background)"
    },

    numberInput: {
        width: "100%",
        border: "none",
        outline: "none",
        padding: "12px",
        fontSize: "14px",
        backgroundColor:
            "var(--wt-input-background)",
        color:
            "var(--wt-input-text)",
        WebkitTextFillColor:
            "var(--wt-input-text)"
    },

    unit: {
        padding: "0 12px",
        color: "var(--wt-text-muted)",
        fontSize: "13px",
        whiteSpace: "nowrap"
    },

    formActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        marginTop: "25px",
        paddingTop: "20px",
        borderTop:
            "1px solid var(--wt-border)"
    },

    cancelButton: {
        border:
            "1px solid var(--wt-border)",
        borderRadius: "10px",
        padding: "12px 20px",
        backgroundColor:
            "var(--wt-secondary-button-background)",
        color:
            "var(--wt-secondary-button-text)",
        cursor: "pointer",
        fontWeight: "600"
    },

    saveButton: {
        border: "none",
        borderRadius: "10px",
        padding: "12px 20px",
        backgroundColor:
            "var(--wt-button-background)",
        color:
            "var(--wt-button-text)",
        cursor: "pointer",
        fontWeight: "700"
    }
};

export default Exercises;
