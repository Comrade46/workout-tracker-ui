import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import "./WorkoutPlans.css";

const CATEGORIES = [
    "Upper Body",
    "Lower Body",
    "Legs",
    "Arms",
    "Chest",
    "Back",
    "Core/Abs",
    "Full Body",
    "Cardio",
    "HIIT"
];

const DIFFICULTIES = [
    "Beginner",
    "Intermediate",
    "Advanced"
];

const emptyPlanForm = {
    name: "",
    description: "",
    category: "Full Body",
    difficulty: "Beginner"
};

const createEmptyExerciseRow = () => ({
    exerciseId: "",
    trackingType: "REPS",
    targetValue: 10,
    targetSets: 3,
    restSeconds: 30
});

function normalizeCategory(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ");
}

function categoryMatches(
    selectedCategory,
    exerciseCategory
) {
    const selected =
        normalizeCategory(selectedCategory);

    const exercise =
        normalizeCategory(exerciseCategory);

    if (!selected || !exercise) {
        return false;
    }

    if (
        selected === "core/abs" ||
        selected === "core abs" ||
        selected === "core"
    ) {
        return (
            exercise === "core" ||
            exercise === "abs" ||
            exercise === "core/abs" ||
            exercise === "core abs"
        );
    }

    if (selected === "upper body") {
        return (
            exercise === "upper body" ||
            exercise === "upper"
        );
    }

    if (selected === "lower body") {
        return (
            exercise === "lower body" ||
            exercise === "lower"
        );
    }

    return exercise === selected;
}

function WorkoutPlans() {

    const navigate = useNavigate();

    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [exercises, setExercises] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [editingPlan, setEditingPlan] =
        useState(null);

    const [planForm, setPlanForm] =
        useState(emptyPlanForm);

    const [exerciseRows, setExerciseRows] =
        useState([
            createEmptyExerciseRow()
        ]);

    const [newlyCreatedPlanId, setNewlyCreatedPlanId] =
        useState(null);

    // =====================================================
    // LOAD DATA
    // =====================================================

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                plansResponse,
                exercisesResponse
            ] = await Promise.all([
                api.get("/workout-plans"),
                api.get("/exercises")
            ]);

            setWorkoutPlans(
                Array.isArray(plansResponse.data)
                    ? plansResponse.data
                    : []
            );

            setExercises(
                Array.isArray(exercisesResponse.data)
                    ? exercisesResponse.data
                    : []
            );

        } catch (requestError) {

            console.error(
                "Error loading workout plans:",
                requestError
            );

            if (
                requestError.response?.status === 401
            ) {
                setError(
                    "Your session has expired. Please login again."
                );
            } else {
                setError(
                    requestError.response?.data?.message ||
                    "Unable to load workout plans."
                );
            }

        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // FILTER EXERCISES BY CATEGORY
    // =====================================================

    const filteredExercises = useMemo(() => {

        return exercises.filter(
            (exercise) =>
                categoryMatches(
                    planForm.category,
                    exercise.category
                )
        );

    }, [exercises, planForm.category]);

    // =====================================================
    // OPEN CREATE
    // =====================================================

    const openCreateForm = () => {

        setEditingPlan(null);

        setPlanForm({
            ...emptyPlanForm
        });

        setExerciseRows([
            createEmptyExerciseRow()
        ]);

        setNewlyCreatedPlanId(null);
        setActionError("");

        setShowForm(true);
    };

    // =====================================================
    // OPEN EDIT
    // =====================================================

    const openEditForm = async (plan) => {

        try {

            setActionError("");
            setEditingPlan(plan);

            setPlanForm({
                name: plan.name || "",
                description:
                    plan.description || "",
                category:
                    plan.category || "Full Body",
                difficulty:
                    plan.difficulty || "Beginner"
            });

            const response =
                await api.get(
                    `/workout-plan-exercises/plan/${plan.id}`
                );

            const existingExercises =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            if (existingExercises.length === 0) {

                setExerciseRows([
                    createEmptyExerciseRow()
                ]);

            } else {

                setExerciseRows(
                    existingExercises.map(
                        (item) => {

                            const trackingType =
                                item.trackingType ===
                                "TIME"
                                    ? "TIME"
                                    : "REPS";

                            return {
                                exerciseId:
                                    String(
                                        item.exerciseId ||
                                        ""
                                    ),

                                trackingType,

                                targetValue:
                                    Number(
                                        item.targetValue ||
                                        item.durationSeconds ||
                                        10
                                    ),

                                targetSets:
                                    Number(
                                        item.targetSets ||
                                        1
                                    ),

                                restSeconds:
                                    Number(
                                        item.restSeconds ||
                                        0
                                    )
                            };
                        }
                    )
                );
            }

            setShowForm(true);

        } catch (requestError) {

            console.error(
                "Error loading plan for editing:",
                requestError
            );

            setEditingPlan(null);

            setActionError(
                requestError.response?.data?.message ||
                "Unable to load this workout plan for editing."
            );
        }
    };

    // =====================================================
    // CLOSE FORM
    // =====================================================

    const closeForm = () => {

        if (saving) {
            return;
        }

        setShowForm(false);
        setEditingPlan(null);

        setPlanForm({
            ...emptyPlanForm
        });

        setExerciseRows([
            createEmptyExerciseRow()
        ]);

        setNewlyCreatedPlanId(null);
        setActionError("");
    };

    // =====================================================
    // PLAN FORM CHANGE
    // =====================================================

    const handlePlanChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setPlanForm(
            (previous) => ({
                ...previous,
                [name]: value
            })
        );

        /*
         * Changing category changes the available
         * exercises, so reset the selected rows.
         */
        if (name === "category") {

            setExerciseRows([
                createEmptyExerciseRow()
            ]);
        }
    };

    // =====================================================
    // EXERCISE ROW CHANGE
    // =====================================================

    const updateExerciseRow = (
        index,
        field,
        value
    ) => {

        setExerciseRows(
            (previous) =>
                previous.map(
                    (row, rowIndex) => {

                        if (
                            rowIndex !== index
                        ) {
                            return row;
                        }

                        /*
                         * Picking an exercise pre-fills the
                         * target from its library defaults.
                         */
                        if (field === "exerciseId") {

                            const selected =
                                exercises.find(
                                    (exercise) =>
                                        String(exercise.id) ===
                                        String(value)
                                );

                            if (selected?.trackingType) {

                                const isTime =
                                    selected.trackingType ===
                                    "TIME";

                                return {
                                    ...row,
                                    exerciseId: value,
                                    trackingType:
                                        selected.trackingType,
                                    targetValue: isTime
                                        ? selected.durationSeconds || 30
                                        : selected.defaultReps || 12,
                                    restSeconds:
                                        selected.restSeconds ??
                                        row.restSeconds
                                };
                            }
                        }

                        return {
                            ...row,
                            [field]: value
                        };
                    }
                )
        );
    };

    // =====================================================
    // ADD EXERCISE ROW
    // =====================================================

    const addExerciseRow = () => {

        setExerciseRows(
            (previous) => [
                ...previous,
                createEmptyExerciseRow()
            ]
        );
    };

    // =====================================================
    // REMOVE EXERCISE ROW
    // =====================================================

    const removeExerciseRow = (index) => {

        setExerciseRows(
            (previous) => {

                if (previous.length === 1) {
                    return [
                        createEmptyExerciseRow()
                    ];
                }

                return previous.filter(
                    (_, rowIndex) =>
                        rowIndex !== index
                );
            }
        );
    };

    // =====================================================
    // CREATE / UPDATE PLAN
    // =====================================================

    const savePlan = async (event) => {

        event.preventDefault();

        if (!planForm.name.trim()) {

            setActionError(
                "Please enter a Plan Name."
            );

            return;
        }

        const validRows =
            exerciseRows.filter(
                (row) =>
                    row.exerciseId &&
                    Number(row.targetValue) > 0 &&
                    Number(row.targetSets) > 0
            );

        if (validRows.length === 0) {

            setActionError(
                "Please add at least one valid exercise."
            );

            return;
        }

        // Local copy: state updates are not visible
        // inside this handler until the next render.
        let createdPlanId = null;

        try {

            setSaving(true);
            setActionError("");

            let planId;

            // =================================================
            // UPDATE EXISTING PLAN
            // =================================================

            if (editingPlan) {

                const planPayload = {
                    name: planForm.name.trim(),
                    description:
                        planForm.description.trim(),
                    category:
                        planForm.category,
                    difficulty:
                        planForm.difficulty
                };

                const planResponse =
                    await api.put(
                        `/workout-plans/${editingPlan.id}`,
                        planPayload
                    );

                planId =
                    planResponse.data?.id ||
                    editingPlan.id;

            } else {

                // =================================================
                // CREATE NEW PLAN
                // =================================================

                const planPayload = {
                    name: planForm.name.trim(),
                    description:
                        planForm.description.trim(),
                    category:
                        planForm.category,
                    difficulty:
                        planForm.difficulty
                };

                const planResponse =
                    await api.post(
                        "/workout-plans",
                        planPayload
                    );

                planId =
                    planResponse.data?.id;

                if (!planId) {
                    throw new Error(
                        "Workout plan was created but no plan ID was returned."
                    );
                }

                createdPlanId = planId;
            }

            // =================================================
            // SAVE CONFIGURED EXERCISES
            // =================================================
            // One request, one backend transaction: the old
            // exercises are replaced only if every new one is valid.

            const exercisesPayload =
                validRows.map((row) => {

                const targetValue =
                    Math.max(
                        1,
                        Number(
                            row.targetValue
                        ) || 1
                    );

                const targetSets =
                    Math.max(
                        1,
                        Number(
                            row.targetSets
                        ) || 1
                    );

                const restSeconds =
                    Math.max(
                        0,
                        Number(
                            row.restSeconds
                        ) || 0
                    );

                return {
                    exerciseId:
                        Number(
                            row.exerciseId
                        ),

                    restSeconds,

                    trackingType:
                        row.trackingType,

                    targetValue,

                    targetSets
                };
            });

            try {

                await api.put(
                    `/workout-plan-exercises/plan/${planId}`,
                    {
                        exercises:
                            exercisesPayload
                    }
                );

            } catch (exerciseError) {

                /*
                 * A new plan without exercises is useless:
                 * remove it so the user can simply retry.
                 */
                if (createdPlanId) {

                    try {

                        await api.delete(
                            `/workout-plans/${createdPlanId}`
                        );

                        createdPlanId = null;

                    } catch (cleanupError) {

                        console.error(
                            "Error removing incomplete plan:",
                            cleanupError
                        );
                    }
                }

                throw exerciseError;
            }

            // =================================================
            // REFRESH PLANS
            // =================================================

            const refreshed =
                await api.get(
                    "/workout-plans"
                );

            setWorkoutPlans(
                Array.isArray(
                    refreshed.data
                )
                    ? refreshed.data
                    : []
            );

            setNewlyCreatedPlanId(null);

            closeForm();

        } catch (requestError) {

            console.error(
                "Error saving workout plan:",
                requestError
            );

            let message =
                requestError.response?.data?.message ||
                requestError.response?.data?.error ||
                requestError.message ||
                "Unable to save workout plan.";

            /*
             * Automatic cleanup failed: keep the created
             * plan ID so the user can delete it.
             */
            if (createdPlanId) {

                setNewlyCreatedPlanId(
                    createdPlanId
                );

                message +=
                    " The plan was partially created. You can delete it below.";
            }

            setActionError(message);

        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // DELETE EXISTING PLAN
    // =====================================================

    const deletePlan = async (plan) => {

        const confirmed =
            window.confirm(
                `Delete "${plan.name}"?\n\nThis will remove the workout plan and its configured exercises. This action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        try {

            setActionError("");

            await api.delete(
                `/workout-plans/${plan.id}`
            );

            setWorkoutPlans(
                (previous) =>
                    previous.filter(
                        (item) =>
                            item.id !== plan.id
                    )
            );

        } catch (requestError) {

            console.error(
                "Error deleting workout plan:",
                requestError
            );

            setActionError(
                requestError.response?.data?.message ||
                requestError.response?.data?.error ||
                "Unable to delete this workout plan."
            );
        }
    };

    // =====================================================
    // DELETE PARTIALLY CREATED PLAN
    // =====================================================

    const deletePartialPlan = async () => {

        if (!newlyCreatedPlanId) {
            return;
        }

        const confirmed =
            window.confirm(
                "Delete the partially created workout plan?"
            );

        if (!confirmed) {
            return;
        }

        try {

            await api.delete(
                `/workout-plans/${newlyCreatedPlanId}`
            );

            setNewlyCreatedPlanId(null);

            setActionError(
                "Partially created plan deleted."
            );

            const refreshed =
                await api.get(
                    "/workout-plans"
                );

            setWorkoutPlans(
                Array.isArray(
                    refreshed.data
                )
                    ? refreshed.data
                    : []
            );

        } catch (requestError) {

            console.error(
                "Error deleting partial plan:",
                requestError
            );

            setActionError(
                requestError.response?.data?.message ||
                "Unable to delete the partially created plan."
            );
        }
    };

    // =====================================================
    // START WORKOUT
    // =====================================================

    const startWorkout = (planId) => {

        navigate(
            `/workout-player/${planId}`
        );
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div style={styles.center}>
                <div style={styles.loadingIcon}>
                    🏋️
                </div>

                <h2>
                    Loading Workout Plans...
                </h2>
            </div>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (
            <div style={styles.center}>

                <div style={styles.errorIcon}>
                    ⚠️
                </div>

                <h2>
                    Unable to load Workout Plans
                </h2>

                <p style={styles.errorText}>
                    {error}
                </p>

                <button
                    style={styles.primaryButton}
                    onClick={loadData}
                >
                    Try Again
                </button>

            </div>
        );
    }

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div style={styles.page}>

            <div style={styles.container}>

                {/* HEADER */}

                <div style={styles.header}>

                    <div>

                        <div style={styles.eyebrow}>
                            TRAIN SMARTER
                        </div>

                        <h1 style={styles.title}>
                            Workout Plans
                        </h1>

                        <p style={styles.subtitle}>
                            Choose a plan or build your
                            own personalized workout.
                        </p>

                    </div>

                    <button
                        style={styles.createButton}
                        onClick={
                            openCreateForm
                        }
                    >
                        + Make Your Own Plan
                    </button>

                </div>

                {/* ERROR */}

                {actionError && (
                    <div style={styles.actionError}>

                        <span>
                            {actionError}
                        </span>

                        {newlyCreatedPlanId && (
                            <button
                                type="button"
                                style={
                                    styles.partialDeleteButton
                                }
                                onClick={
                                    deletePartialPlan
                                }
                            >
                                Delete Partial Plan
                            </button>
                        )}

                    </div>
                )}

                {/* PLANS */}

                {workoutPlans.length === 0 ? (

                    <div style={styles.emptyCard}>

                        <div style={styles.emptyIcon}>
                            🏋️
                        </div>

                        <h2>
                            No workout plans yet
                        </h2>

                        <p>
                            Create your first
                            personalized workout plan.
                        </p>

                        <button
                            style={
                                styles.primaryButton
                            }
                            onClick={
                                openCreateForm
                            }
                        >
                            Create Workout Plan
                        </button>

                    </div>

                ) : (

                    <div style={styles.grid}>

                        {workoutPlans.map(
                            (plan) => (

                                <div
                                    key={plan.id}
                                    style={styles.card}
                                >

                                    <div
                                        style={
                                            styles.cardTop
                                        }
                                    >

                                        <div>

                                            <div
                                                style={
                                                    styles.categoryBadge
                                                }
                                            >
                                                {
                                                    plan.category ||
                                                    "General"
                                                }
                                            </div>

                                            <h2
                                                style={
                                                    styles.cardTitle
                                                }
                                            >
                                                {
                                                    plan.name
                                                }
                                            </h2>

                                        </div>

                                        <span
                                            style={
                                                styles.difficultyBadge
                                            }
                                        >
                                            {
                                                plan.difficulty ||
                                                "Beginner"
                                            }
                                        </span>

                                    </div>

                                    <p
                                        style={
                                            styles.description
                                        }
                                    >
                                        {
                                            plan.description ||
                                            "Personalized workout plan"
                                        }
                                    </p>

                                    <div
                                        style={
                                            styles.cardActions
                                        }
                                    >

                                        <button
                                            type="button"
                                            style={
                                                styles.startButton
                                            }
                                            onClick={() =>
                                                startWorkout(
                                                    plan.id
                                                )
                                            }
                                        >
                                            ▶ Start Workout
                                        </button>

                                        <button
                                            type="button"
                                            style={
                                                styles.editButton
                                            }
                                            onClick={() =>
                                                openEditForm(
                                                    plan
                                                )
                                            }
                                        >
                                            ✎ Edit
                                        </button>

                                        <button
                                            type="button"
                                            style={
                                                styles.deleteButton
                                            }
                                            onClick={() =>
                                                deletePlan(
                                                    plan
                                                )
                                            }
                                        >
                                            🗑 Delete
                                        </button>

                                    </div>

                                </div>
                            )
                        )}

                    </div>
                )}

            </div>

            {/* =================================================
                CREATE / EDIT MODAL
            ================================================= */}

            {showForm && (

                <div
                    style={styles.overlay}
                    onMouseDown={closeForm}
                >

                    <form
                        style={styles.modal}
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                        onSubmit={savePlan}
                    >

                        <div
                            style={
                                styles.modalHeader
                            }
                        >

                            <div>

                                <div
                                    style={
                                        styles.eyebrow
                                    }
                                >
                                    {editingPlan
                                        ? "UPDATE PLAN"
                                        : "CREATE PLAN"}
                                </div>

                                <h2
                                    style={
                                        styles.modalTitle
                                    }
                                >
                                    {editingPlan
                                        ? "Edit Workout Plan"
                                        : "Make Your Own Plan"}
                                </h2>

                            </div>

                            <button
                                type="button"
                                style={
                                    styles.closeButton
                                }
                                onClick={
                                    closeForm
                                }
                            >
                                ✕
                            </button>

                        </div>

                        {/* PLAN DETAILS */}

                        <div
                            style={
                                styles.formGrid
                            }
                        >

                            <label
                                style={
                                    styles.inputLabel
                                }
                            >
                                Plan Name *

                                <input
                                    name="name"
                                    value={
                                        planForm.name
                                    }
                                    onChange={
                                        handlePlanChange
                                    }
                                    placeholder="e.g. My Chest Workout"
                                    style={
                                        styles.input
                                    }
                                    required
                                />

                            </label>

                            <label
                                style={
                                    styles.inputLabel
                                }
                            >
                                Description

                                <textarea
                                    name="description"
                                    value={
                                        planForm.description
                                    }
                                    onChange={
                                        handlePlanChange
                                    }
                                    placeholder="Describe your workout..."
                                    style={
                                        styles.textarea
                                    }
                                    rows="3"
                                />

                            </label>

                            <label
                                style={
                                    styles.inputLabel
                                }
                            >
                                Category *

                                <select
                                    name="category"
                                    value={
                                        planForm.category
                                    }
                                    onChange={
                                        handlePlanChange
                                    }
                                    style={
                                        styles.input
                                    }
                                >

                                    {CATEGORIES.map(
                                        (category) => (
                                            <option
                                                key={
                                                    category
                                                }
                                                value={
                                                    category
                                                }
                                            >
                                                {
                                                    category
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                            </label>

                            <label
                                style={
                                    styles.inputLabel
                                }
                            >
                                Difficulty *

                                <select
                                    name="difficulty"
                                    value={
                                        planForm.difficulty
                                    }
                                    onChange={
                                        handlePlanChange
                                    }
                                    style={
                                        styles.input
                                    }
                                >

                                    {DIFFICULTIES.map(
                                        (difficulty) => (
                                            <option
                                                key={
                                                    difficulty
                                                }
                                                value={
                                                    difficulty
                                                }
                                            >
                                                {
                                                    difficulty
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                            </label>

                        </div>

                        {/* EXERCISES */}

                        <div
                            style={
                                styles.exerciseSection
                            }
                        >

                            <div
                                style={
                                    styles.exerciseHeader
                                }
                            >

                                <div>

                                    <h3
                                        style={
                                            styles.exerciseTitle
                                        }
                                    >
                                        Add Exercises
                                    </h3>

                                    <p
                                        style={
                                            styles.exerciseHint
                                        }
                                    >
                                        Showing exercises
                                        from{" "}
                                        <strong>
                                            {
                                                planForm.category
                                            }
                                        </strong>
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    style={
                                        styles.addExerciseButton
                                    }
                                    onClick={
                                        addExerciseRow
                                    }
                                >
                                    + Add Exercise
                                </button>

                            </div>

                            {filteredExercises.length ===
                                0 ? (

                                <div
                                    style={
                                        styles.noExercises
                                    }
                                >
                                    No exercises found
                                    for this category.
                                </div>

                            ) : (

                                <div
                                    style={
                                        styles.exerciseRows
                                    }
                                >

                                    {exerciseRows.map(
                                        (
                                            row,
                                            index
                                        ) => (

                                            <div
                                                key={
                                                    index
                                                }
                                                style={
                                                    styles.exerciseRow
                                                }
                                            >

                                                <div
                                                    style={
                                                        styles.rowNumber
                                                    }
                                                >
                                                    {index +
                                                        1}
                                                </div>

                                                <select
                                                    value={
                                                        row.exerciseId
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateExerciseRow(
                                                            index,
                                                            "exerciseId",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    style={
                                                        styles.exerciseSelect
                                                    }
                                                >

                                                    <option value="">
                                                        Select exercise
                                                    </option>

                                                    {filteredExercises.map(
                                                        (
                                                            exercise
                                                        ) => (

                                                            <option
                                                                key={
                                                                    exercise.id
                                                                }
                                                                value={
                                                                    exercise.id
                                                                }
                                                            >
                                                                {
                                                                    exercise.name
                                                                }
                                                            </option>

                                                        )
                                                    )}

                                                </select>

                                                <select
                                                    value={
                                                        row.trackingType
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateExerciseRow(
                                                            index,
                                                            "trackingType",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    style={
                                                        styles.smallSelect
                                                    }
                                                >

                                                    <option value="REPS">
                                                        REPS
                                                    </option>

                                                    <option value="TIME">
                                                        TIME
                                                    </option>

                                                </select>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={
                                                        row.targetValue
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateExerciseRow(
                                                            index,
                                                            "targetValue",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    style={
                                                        styles.numberInput
                                                    }
                                                    placeholder={
                                                        row.trackingType ===
                                                        "TIME"
                                                            ? "Seconds"
                                                            : "Reps"
                                                    }
                                                />

                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={
                                                        row.targetSets
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateExerciseRow(
                                                            index,
                                                            "targetSets",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    style={
                                                        styles.numberInput
                                                    }
                                                    placeholder="Sets"
                                                />

                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={
                                                        row.restSeconds
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateExerciseRow(
                                                            index,
                                                            "restSeconds",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    style={
                                                        styles.numberInput
                                                    }
                                                    placeholder="Rest"
                                                />

                                                <button
                                                    type="button"
                                                    style={
                                                        styles.removeButton
                                                    }
                                                    onClick={() =>
                                                        removeExerciseRow(
                                                            index
                                                        )
                                                    }
                                                >
                                                    ✕
                                                </button>

                                            </div>

                                        )
                                    )}

                                </div>
                            )}

                        </div>

                        {/* FORM ERROR */}

                        {actionError && (
                            <div
                                style={
                                    styles.formError
                                }
                            >
                                {actionError}
                            </div>
                        )}

                        {/* ACTIONS */}

                        <div
                            style={
                                styles.modalActions
                            }
                        >

                            <button
                                type="button"
                                style={
                                    styles.cancelButton
                                }
                                onClick={
                                    closeForm
                                }
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                style={
                                    styles.saveButton
                                }
                                disabled={
                                    saving ||
                                    filteredExercises.length ===
                                        0
                                }
                            >
                                {saving
                                    ? "Saving..."
                                    : editingPlan
                                        ? "Update Plan"
                                        : "Create Plan"}
                            </button>

                        </div>

                    </form>

                </div>
            )}

        </div>
    );
}

// =====================================================
// STYLES
// =====================================================

const styles = {

    page: {
        minHeight: "calc(100vh - 70px)",
        backgroundColor:
            "var(--wt-page-background)",
        color:
            "var(--wt-text-primary)",
        padding: "40px 20px",
        boxSizing: "border-box"
    },

    container: {
        maxWidth: "1150px",
        margin: "0 auto"
    },

    header: {
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
        color: "var(--wt-accent)",
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
        fontSize: "16px"
    },

    createButton: {
        border: "none",
        borderRadius: "12px",
        padding: "13px 20px",
        backgroundColor: "var(--wt-accent)",
        color: "#ffffff",
        cursor: "pointer",
        fontWeight: "800"
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "20px"
    },

    card: {
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "18px",
        padding: "22px",
        boxShadow:
            "var(--wt-shadow)"
    },

    cardTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px"
    },

    categoryBadge: {
        display: "inline-block",
        fontSize: "11px",
        fontWeight: "800",
        padding: "5px 9px",
        borderRadius: "7px",
        backgroundColor:
            "rgba(37, 99, 235, 0.12)",
        color:
            "var(--wt-accent)"
    },

    cardTitle: {
        margin: "10px 0 0",
        fontSize: "22px",
        color: "var(--wt-text-primary)"
    },

    difficultyBadge: {
        padding: "6px 10px",
        borderRadius: "8px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-secondary)",
        fontSize: "11px",
        fontWeight: "700"
    },

    description: {
        color:
            "var(--wt-text-secondary)",
        lineHeight: 1.5,
        minHeight: "45px"
    },

    cardActions: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginTop: "20px"
    },

    startButton: {
        flex: 1,
        minWidth: "140px",
        border: "none",
        borderRadius: "10px",
        padding: "11px 14px",
        backgroundColor:
            "var(--wt-accent)",
        color: "#ffffff",
        cursor: "pointer",
        fontWeight: "800"
    },

    editButton: {
        border:
            "1px solid var(--wt-border)",
        borderRadius: "10px",
        padding: "11px 14px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-primary)",
        cursor: "pointer",
        fontWeight: "700"
    },

    deleteButton: {
        border: "none",
        borderRadius: "10px",
        padding: "11px 14px",
        backgroundColor:
            "rgba(220, 38, 38, 0.12)",
        color:
            "var(--wt-danger, #dc2626)",
        cursor: "pointer",
        fontWeight: "700"
    },

    actionError: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap",
        marginBottom: "20px",
        padding: "14px 16px",
        borderRadius: "12px",
        backgroundColor:
            "rgba(220, 38, 38, 0.10)",
        color:
            "var(--wt-danger, #dc2626)",
        border:
            "1px solid rgba(220, 38, 38, 0.25)"
    },

    partialDeleteButton: {
        border: "none",
        borderRadius: "8px",
        padding: "8px 12px",
        backgroundColor:
            "var(--wt-danger, #dc2626)",
        color: "#ffffff",
        cursor: "pointer",
        fontWeight: "700"
    },

    emptyCard: {
        backgroundColor:
            "var(--wt-surface)",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "20px",
        padding: "60px 30px",
        textAlign: "center"
    },

    emptyIcon: {
        fontSize: "50px"
    },

    center: {
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        backgroundColor:
            "var(--wt-page-background)",
        color:
            "var(--wt-text-primary)"
    },

    loadingIcon: {
        fontSize: "45px"
    },

    errorIcon: {
        fontSize: "45px"
    },

    errorText: {
        color:
            "var(--wt-danger, #dc2626)"
    },

    primaryButton: {
        border: "none",
        borderRadius: "10px",
        padding: "12px 20px",
        backgroundColor:
            "var(--wt-accent)",
        color: "#ffffff",
        cursor: "pointer",
        fontWeight: "700"
    },

    overlay: {
        position: "fixed",
        inset: 0,
        backgroundColor:
            "rgba(0,0,0,0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        zIndex: 1000,
        boxSizing: "border-box"
    },

    modal: {
        width: "100%",
        maxWidth: "1000px",
        maxHeight: "90vh",
        overflowY: "auto",
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)",
        borderRadius: "20px",
        padding: "28px",
        boxSizing: "border-box",
        border:
            "1px solid var(--wt-border)",
        boxShadow:
            "0 20px 60px rgba(0,0,0,0.35)"
    },

    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
        marginBottom: "25px"
    },

    modalTitle: {
        margin: "5px 0 0",
        fontSize: "28px"
    },

    closeButton: {
        width: "38px",
        height: "38px",
        border: "none",
        borderRadius: "50%",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-primary)",
        cursor: "pointer",
        fontSize: "16px"
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap: "16px",
        marginBottom: "25px"
    },

    inputLabel: {
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        color:
            "var(--wt-text-primary)",
        fontWeight: "700",
        fontSize: "13px"
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "9px",
        padding: "11px 12px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-primary)",
        outline: "none"
    },

    textarea: {
        width: "100%",
        boxSizing: "border-box",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "9px",
        padding: "11px 12px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-primary)",
        resize: "vertical",
        outline: "none"
    },

    exerciseSection: {
        borderTop:
            "1px solid var(--wt-border)",
        paddingTop: "22px"
    },

    exerciseHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "15px",
        flexWrap: "wrap"
    },

    exerciseTitle: {
        margin: 0,
        color:
            "var(--wt-text-primary)"
    },

    exerciseHint: {
        margin: "5px 0 0",
        color:
            "var(--wt-text-secondary)",
        fontSize: "13px"
    },

    addExerciseButton: {
        border: "none",
        borderRadius: "9px",
        padding: "10px 14px",
        backgroundColor:
            "var(--wt-accent)",
        color: "#ffffff",
        cursor: "pointer",
        fontWeight: "700"
    },

    noExercises: {
        padding: "20px",
        textAlign: "center",
        borderRadius: "12px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-secondary)"
    },

    exerciseRows: {
        display: "flex",
        flexDirection: "column",
        gap: "10px"
    },

    exerciseRow: {
        display: "grid",
        gridTemplateColumns:
            "35px minmax(180px, 2fr) 100px 100px 90px 90px 38px",
        gap: "8px",
        alignItems: "center",
        padding: "10px",
        borderRadius: "12px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        border:
            "1px solid var(--wt-border)"
    },

    rowNumber: {
        width: "28px",
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        backgroundColor:
            "var(--wt-accent)",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: "800"
    },

    exerciseSelect: {
        minWidth: 0,
        border:
            "1px solid var(--wt-border)",
        borderRadius: "8px",
        padding: "9px",
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)"
    },

    smallSelect: {
        border:
            "1px solid var(--wt-border)",
        borderRadius: "8px",
        padding: "9px",
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)"
    },

    numberInput: {
        width: "100%",
        boxSizing: "border-box",
        border:
            "1px solid var(--wt-border)",
        borderRadius: "8px",
        padding: "9px",
        backgroundColor:
            "var(--wt-surface)",
        color:
            "var(--wt-text-primary)"
    },

    removeButton: {
        width: "34px",
        height: "34px",
        border: "none",
        borderRadius: "8px",
        backgroundColor:
            "rgba(220, 38, 38, 0.12)",
        color:
            "var(--wt-danger, #dc2626)",
        cursor: "pointer",
        fontWeight: "800"
    },

    formError: {
        marginTop: "18px",
        padding: "12px",
        borderRadius: "10px",
        backgroundColor:
            "rgba(220, 38, 38, 0.10)",
        color:
            "var(--wt-danger, #dc2626)"
    },

    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "25px"
    },

    cancelButton: {
        border:
            "1px solid var(--wt-border)",
        borderRadius: "10px",
        padding: "12px 20px",
        backgroundColor:
            "var(--wt-surface-secondary)",
        color:
            "var(--wt-text-primary)",
        cursor: "pointer",
        fontWeight: "700"
    },

    saveButton: {
        border: "none",
        borderRadius: "10px",
        padding: "12px 22px",
        backgroundColor:
            "var(--wt-accent)",
        color: "#ffffff",
        cursor: "pointer",
        fontWeight: "800"
    }
};

export default WorkoutPlans;