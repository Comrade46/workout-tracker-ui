import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import "./WorkoutPlans.css";

const PLAN_CATEGORIES = [
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

const EMPTY_EXERCISE = {
    exerciseId: "",
    trackingType: "REPS",
    targetValue: 10,
    targetSets: 3,
    restSeconds: 15
};

function WorkoutPlans() {

    const navigate = useNavigate();

    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [exercises, setExercises] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showCreatePlan, setShowCreatePlan] = useState(false);
    const [creatingPlan, setCreatingPlan] = useState(false);
    const [createError, setCreateError] = useState("");
    const [createSuccess, setCreateSuccess] = useState("");

    const [planForm, setPlanForm] = useState({
        name: "",
        description: "",
        category: "Full Body",
        difficulty: "Beginner"
    });

    const [planExercises, setPlanExercises] = useState([]);

    // =========================================================
    // LOAD DATA
    // =========================================================

    useEffect(() => {
        loadWorkoutPlans();
        loadExercises();
    }, []);

    const loadWorkoutPlans = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get("/workout-plans");

            setWorkoutPlans(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (err) {

            console.error("Error loading workout plans:", err);

            if (err.response?.status === 401) {

                setError(
                    "Your session has expired. Please login again."
                );

            } else {

                setError(
                    "Unable to load workout plans."
                );
            }

        } finally {

            setLoading(false);

        }
    };

    const loadExercises = async () => {

        try {

            const response = await api.get("/exercises");

            setExercises(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (err) {

            console.error("Error loading exercises:", err);

        }
    };

    // =========================================================
    // START WORKOUT
    // =========================================================

    const startWorkout = (planId) => {

        navigate(`/workout-player/${planId}`);

    };

    // =========================================================
    // CREATE PLAN FORM
    // =========================================================

    const openCreatePlan = () => {

        setPlanForm({
            name: "",
            description: "",
            category: "Full Body",
            difficulty: "Beginner"
        });

        setPlanExercises([]);

        setCreateError("");
        setCreateSuccess("");

        setShowCreatePlan(true);

    };

    const closeCreatePlan = () => {

        if (creatingPlan) {
            return;
        }

        setShowCreatePlan(false);
        setCreateError("");
        setCreateSuccess("");

    };

    // =========================================================
    // PLAN FORM CHANGES
    // =========================================================

    const handlePlanChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setPlanForm((previous) => ({
            ...previous,
            [name]: value
        }));

    };

    // =========================================================
    // ADD EXERCISE ROW
    // =========================================================

    const addExerciseRow = () => {

        setPlanExercises((previous) => [
            ...previous,
            {
                ...EMPTY_EXERCISE
            }
        ]);

    };

    // =========================================================
    // REMOVE EXERCISE ROW
    // =========================================================

    const removeExerciseRow = (index) => {

        setPlanExercises((previous) =>
            previous.filter(
                (_, exerciseIndex) =>
                    exerciseIndex !== index
            )
        );

    };

    // =========================================================
    // EXERCISE ROW CHANGE
    // =========================================================

    const handleExerciseChange = (
        index,
        field,
        value
    ) => {

        setPlanExercises((previous) =>
            previous.map((exercise, exerciseIndex) => {

                if (exerciseIndex !== index) {
                    return exercise;
                }

                const updatedExercise = {
                    ...exercise,
                    [field]: value
                };

                if (
                    field === "trackingType" &&
                    value === "REPS"
                ) {

                    updatedExercise.targetValue =
                        exercise.targetValue > 0
                            ? exercise.targetValue
                            : 10;

                }

                if (
                    field === "trackingType" &&
                    value === "TIME"
                ) {

                    updatedExercise.targetValue =
                        exercise.targetValue > 0
                            ? exercise.targetValue
                            : 30;

                }

                return updatedExercise;

            })
        );

    };

    // =========================================================
    // VALIDATE PLAN
    // =========================================================

    const validatePlan = () => {

        if (!planForm.name.trim()) {

            return "Please enter a workout plan name.";

        }

        if (!planForm.category) {

            return "Please select a workout category.";

        }

        if (!planForm.difficulty) {

            return "Please select a difficulty.";

        }

        if (planExercises.length === 0) {

            return "Please add at least one exercise.";

        }

        for (
            let index = 0;
            index < planExercises.length;
            index++
        ) {

            const exercise =
                planExercises[index];

            if (!exercise.exerciseId) {

                return `Please select an exercise for exercise ${index + 1}.`;

            }

            if (
                !exercise.targetValue ||
                Number(exercise.targetValue) <= 0
            ) {

                return `Please enter a valid ${
                    exercise.trackingType === "TIME"
                        ? "time"
                        : "target"
                } for exercise ${index + 1}.`;

            }

            if (
                !exercise.targetSets ||
                Number(exercise.targetSets) <= 0
            ) {

                return `Please enter valid sets for exercise ${index + 1}.`;

            }

            if (
                exercise.restSeconds === "" ||
                Number(exercise.restSeconds) < 0
            ) {

                return `Please enter valid rest time for exercise ${index + 1}.`;

            }

        }

        return "";

    };

    // =========================================================
    // CREATE WORKOUT PLAN
    // =========================================================

    const createWorkoutPlan = async (event) => {

        event.preventDefault();

        setCreateError("");
        setCreateSuccess("");

        const validationError =
            validatePlan();

        if (validationError) {

            setCreateError(validationError);
            return;

        }

        try {

            setCreatingPlan(true);

            // -------------------------------------------------
            // STEP 1: CREATE PLAN
            // -------------------------------------------------

            const planResponse =
                await api.post(
                    "/workout-plans",
                    {
                        name: planForm.name.trim(),
                        description:
                            planForm.description.trim(),
                        category:
                            planForm.category,
                        difficulty:
                            planForm.difficulty
                    }
                );

            const createdPlan =
                planResponse.data;

            if (!createdPlan?.id) {

                throw new Error(
                    "Workout plan was created but no plan ID was returned."
                );

            }

            // -------------------------------------------------
            // STEP 2: ADD CONFIGURED EXERCISES
            // -------------------------------------------------

            for (
                let index = 0;
                index < planExercises.length;
                index++
            ) {

                const exercise =
                    planExercises[index];

                await api.post(
                    "/workout-plan-exercises/configured",
                    {
                        workoutPlanId:
                            createdPlan.id,

                        exerciseId:
                            Number(exercise.exerciseId),

                        exerciseOrder:
                            index + 1,

                        restSeconds:
                            Number(exercise.restSeconds),

                        trackingType:
                            exercise.trackingType,

                        targetValue:
                            Number(exercise.targetValue),

                        targetSets:
                            Number(exercise.targetSets)
                    }
                );

            }

            // -------------------------------------------------
            // STEP 3: SUCCESS
            // -------------------------------------------------

            setCreateSuccess(
                "Workout plan created successfully."
            );

            await loadWorkoutPlans();

            setTimeout(() => {

                setShowCreatePlan(false);

                setCreateSuccess("");

                setPlanForm({
                    name: "",
                    description: "",
                    category: "Full Body",
                    difficulty: "Beginner"
                });

                setPlanExercises([]);

            }, 900);

        } catch (err) {

            console.error(
                "Error creating workout plan:",
                err
            );

            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Unable to create workout plan.";

            setCreateError(message);

        } finally {

            setCreatingPlan(false);

        }

    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div style={styles.centerContainer}>

                <div style={styles.loadingIcon}>
                    💪
                </div>

                <h2 style={styles.loadingText}>
                    Loading workout plans...
                </h2>

                <p style={styles.centerSubtext}>
                    Preparing your training plans
                </p>

            </div>

        );

    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error) {

        return (

            <div style={styles.centerContainer}>

                <div style={styles.errorIcon}>
                    ⚠️
                </div>

                <h2 style={styles.errorTitle}>
                    {error}
                </h2>

                <button
                    type="button"
                    style={styles.button}
                    onClick={loadWorkoutPlans}
                >
                    Try Again
                </button>

            </div>

        );

    }

    // =========================================================
    // MAIN PAGE
    // =========================================================

    return (

        <div className="wt-workout-plans-page">

            <div className="wt-workout-plans-container">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div style={styles.header}>

                    <div>

                        <p style={styles.eyebrow}>
                            TRAIN SMART
                        </p>

                        <h1 style={styles.title}>
                            Workout Plans
                        </h1>

                        <p style={styles.subtitle}>
                            Choose a workout plan or create your own.
                        </p>

                    </div>

                    <div style={styles.headerActions}>

                        <button
                            type="button"
                            style={styles.createPlanButton}
                            onClick={openCreatePlan}
                        >

                            <span style={styles.createIcon}>
                                ＋
                            </span>

                            <span>
                                Make Your Own Plan
                            </span>

                        </button>

                        <div style={styles.headerBadge}>

                            <span>
                                🏋️
                            </span>

                            <span>
                                {workoutPlans.length}{" "}
                                {workoutPlans.length === 1
                                    ? "Plan"
                                    : "Plans"}
                            </span>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    WORKOUT PLANS
                ================================================= */}

                {workoutPlans.length === 0 ? (

                    <div style={styles.emptyContainer}>

                        <div style={styles.emptyIcon}>
                            🏋️
                        </div>

                        <h2 style={styles.emptyTitle}>
                            No workout plans found
                        </h2>

                        <p style={styles.emptyText}>
                            Create your first workout plan to get started.
                        </p>

                        <button
                            type="button"
                            style={styles.emptyCreateButton}
                            onClick={openCreatePlan}
                        >
                            ＋ Make Your Own Plan
                        </button>

                    </div>

                ) : (

                    <div style={styles.grid}>

                        {workoutPlans.map(
                            (plan, index) => (

                                <div
                                    key={plan.id}
                                    style={styles.card}
                                >

                                    <div
                                        style={styles.cardTop}
                                    >

                                        <div
                                            style={styles.planIcon}
                                        >
                                            {index % 4 === 0
                                                ? "🔥"
                                                : index % 4 === 1
                                                    ? "💪"
                                                    : index % 4 === 2
                                                        ? "⚡"
                                                        : "🏆"}
                                        </div>

                                        <span
                                            style={styles.planNumber}
                                        >
                                            PLAN {index + 1}
                                        </span>

                                    </div>

                                    <h2
                                        style={styles.cardTitle}
                                    >
                                        {plan.name}
                                    </h2>

                                    <p
                                        style={styles.description}
                                    >
                                        {plan.description ||
                                            "A great workout plan designed to help you improve your fitness."}
                                    </p>

                                    <div
                                        style={styles.infoContainer}
                                    >

                                        {plan.category && (

                                            <span
                                                style={
                                                    styles.categoryBadge
                                                }
                                            >
                                                🏷️{" "}
                                                {plan.category}
                                            </span>

                                        )}

                                        {plan.difficulty && (

                                            <span
                                                style={{
                                                    ...styles.difficultyBadge,
                                                    ...getDifficultyStyle(
                                                        plan.difficulty
                                                    )
                                                }}
                                            >

                                                {
                                                    getDifficultyIcon(
                                                        plan.difficulty
                                                    )
                                                }{" "}

                                                {plan.difficulty}

                                            </span>

                                        )}

                                    </div>

                                    <div
                                        style={styles.cardFooter}
                                    >

                                        <span
                                            style={
                                                styles.planId
                                            }
                                        >
                                            Plan ID: {plan.id}
                                        </span>

                                        {plan.createdAt && (

                                            <span
                                                style={
                                                    styles.createdDate
                                                }
                                            >
                                                {formatDate(
                                                    plan.createdAt
                                                )}
                                            </span>

                                        )}

                                    </div>

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

                                        <span>
                                            Start Workout
                                        </span>

                                        <span
                                            style={
                                                styles.arrow
                                            }
                                        >
                                            →
                                        </span>

                                    </button>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>

            {/* =====================================================
                CREATE PLAN MODAL
            ===================================================== */}

            {showCreatePlan && (

                <div
                    style={styles.modalOverlay}
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeCreatePlan();
                        }

                    }}
                >

                    <div style={styles.modal}>

                        {/* MODAL HEADER */}

                        <div style={styles.modalHeader}>

                            <div>

                                <p
                                    style={
                                        styles.modalEyebrow
                                    }
                                >
                                    CUSTOM WORKOUT
                                </p>

                                <h2
                                    style={
                                        styles.modalTitle
                                    }
                                >
                                    Make Your Own Plan
                                </h2>

                                <p
                                    style={
                                        styles.modalSubtitle
                                    }
                                >
                                    Build a workout with reps,
                                    time and multiple sets.
                                </p>

                            </div>

                            <button
                                type="button"
                                style={
                                    styles.closeButton
                                }
                                onClick={
                                    closeCreatePlan
                                }
                                disabled={
                                    creatingPlan
                                }
                            >
                                ×
                            </button>

                        </div>

                        {/* MODAL BODY */}

                        <form
                            onSubmit={
                                createWorkoutPlan
                            }
                        >

                            {/* PLAN INFORMATION */}

                            <div
                                style={
                                    styles.section
                                }
                            >

                                <h3
                                    style={
                                        styles.sectionTitle
                                    }
                                >
                                    Plan Information
                                </h3>

                                <div
                                    style={
                                        styles.formGrid
                                    }
                                >

                                    <div
                                        style={
                                            styles.formGroup
                                        }
                                    >

                                        <label
                                            style={
                                                styles.label
                                            }
                                        >
                                            Plan Name *
                                        </label>

                                        <input
                                            type="text"
                                            name="name"
                                            value={
                                                planForm.name
                                            }
                                            onChange={
                                                handlePlanChange
                                            }
                                            placeholder="Example: My Full Body Workout"
                                            style={
                                                styles.input
                                            }
                                        />

                                    </div>

                                    <div
                                        style={
                                            styles.formGroup
                                        }
                                    >

                                        <label
                                            style={
                                                styles.label
                                            }
                                        >
                                            Category *
                                        </label>

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

                                            {PLAN_CATEGORIES.map(
                                                (category) => (

                                                    <option
                                                        key={
                                                            category
                                                        }
                                                        value={
                                                            category
                                                        }
                                                    >
                                                        {category}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                    <div
                                        style={
                                            styles.formGroup
                                        }
                                    >

                                        <label
                                            style={
                                                styles.label
                                            }
                                        >
                                            Difficulty *
                                        </label>

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
                                                        {difficulty}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                    <div
                                        style={
                                            styles.formGroup
                                        }
                                    >

                                        <label
                                            style={
                                                styles.label
                                            }
                                        >
                                            Description
                                        </label>

                                        <input
                                            type="text"
                                            name="description"
                                            value={
                                                planForm.description
                                            }
                                            onChange={
                                                handlePlanChange
                                            }
                                            placeholder="Describe your workout"
                                            style={
                                                styles.input
                                            }
                                        />

                                    </div>

                                </div>

                            </div>

                            {/* EXERCISES */}

                            <div
                                style={
                                    styles.section
                                }
                            >

                                <div
                                    style={
                                        styles.exerciseSectionHeader
                                    }
                                >

                                    <div>

                                        <h3
                                            style={
                                                styles.sectionTitle
                                            }
                                        >
                                            Exercises
                                        </h3>

                                        <p
                                            style={
                                                styles.sectionDescription
                                            }
                                        >
                                            Choose whether each exercise
                                            is tracked by repetitions
                                            or time.
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
                                        ＋ Add Exercise
                                    </button>

                                </div>

                                {planExercises.length === 0 ? (

                                    <div
                                        style={
                                            styles.noExerciseBox
                                        }
                                    >

                                        <div
                                            style={
                                                styles.noExerciseIcon
                                            }
                                        >
                                            🏋️
                                        </div>

                                        <strong>
                                            No exercises added
                                        </strong>

                                        <span>
                                            Click "Add Exercise" to
                                            build your workout.
                                        </span>

                                    </div>

                                ) : (

                                    <div
                                        style={
                                            styles.exerciseList
                                        }
                                    >

                                        {planExercises.map(
                                            (
                                                exercise,
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
                                                            styles.exerciseNumber
                                                        }
                                                    >
                                                        {index + 1}
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.exerciseFields
                                                        }
                                                    >

                                                        <div
                                                            style={
                                                                styles.formGroup
                                                            }
                                                        >

                                                            <label
                                                                style={
                                                                    styles.smallLabel
                                                                }
                                                            >
                                                                Exercise
                                                            </label>

                                                            <select
                                                                value={
                                                                    exercise.exerciseId
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleExerciseChange(
                                                                        index,
                                                                        "exerciseId",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                style={
                                                                    styles.input
                                                                }
                                                            >

                                                                <option value="">
                                                                    Select Exercise
                                                                </option>

                                                                {exercises.map(
                                                                    (
                                                                        item
                                                                    ) => (

                                                                        <option
                                                                            key={
                                                                                item.id
                                                                            }
                                                                            value={
                                                                                item.id
                                                                            }
                                                                        >
                                                                            {item.name}
                                                                        </option>

                                                                    )
                                                                )}

                                                            </select>

                                                        </div>

                                                        <div
                                                            style={
                                                                styles.formGroup
                                                            }
                                                        >

                                                            <label
                                                                style={
                                                                    styles.smallLabel
                                                                }
                                                            >
                                                                Tracking
                                                            </label>

                                                            <select
                                                                value={
                                                                    exercise.trackingType
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleExerciseChange(
                                                                        index,
                                                                        "trackingType",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                style={
                                                                    styles.input
                                                                }
                                                            >

                                                                <option value="REPS">
                                                                    REPS
                                                                </option>

                                                                <option value="TIME">
                                                                    TIME
                                                                </option>

                                                            </select>

                                                        </div>

                                                        <div
                                                            style={
                                                                styles.formGroup
                                                            }
                                                        >

                                                            <label
                                                                style={
                                                                    styles.smallLabel
                                                                }
                                                            >
                                                                {exercise.trackingType ===
                                                                "TIME"
                                                                    ? "Seconds"
                                                                    : "Target Reps"}
                                                            </label>

                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={
                                                                    exercise.targetValue
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleExerciseChange(
                                                                        index,
                                                                        "targetValue",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                style={
                                                                    styles.input
                                                                }
                                                            />

                                                        </div>

                                                        <div
                                                            style={
                                                                styles.formGroup
                                                            }
                                                        >

                                                            <label
                                                                style={
                                                                    styles.smallLabel
                                                                }
                                                            >
                                                                Sets
                                                            </label>

                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={
                                                                    exercise.targetSets
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleExerciseChange(
                                                                        index,
                                                                        "targetSets",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                style={
                                                                    styles.input
                                                                }
                                                            />

                                                        </div>

                                                        <div
                                                            style={
                                                                styles.formGroup
                                                            }
                                                        >

                                                            <label
                                                                style={
                                                                    styles.smallLabel
                                                                }
                                                            >
                                                                Rest (sec)
                                                            </label>

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={
                                                                    exercise.restSeconds
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleExerciseChange(
                                                                        index,
                                                                        "restSeconds",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                style={
                                                                    styles.input
                                                                }
                                                            />

                                                        </div>

                                                    </div>

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
                                                        disabled={
                                                            creatingPlan
                                                        }
                                                    >
                                                        🗑
                                                    </button>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>

                            {/* ERROR */}

                            {createError && (

                                <div
                                    style={
                                        styles.errorBox
                                    }
                                >
                                    ⚠️ {createError}
                                </div>

                            )}

                            {/* SUCCESS */}

                            {createSuccess && (

                                <div
                                    style={
                                        styles.successBox
                                    }
                                >
                                    ✅ {createSuccess}
                                </div>

                            )}

                            {/* MODAL FOOTER */}

                            <div
                                style={
                                    styles.modalFooter
                                }
                            >

                                <button
                                    type="button"
                                    style={
                                        styles.cancelButton
                                    }
                                    onClick={
                                        closeCreatePlan
                                    }
                                    disabled={
                                        creatingPlan
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    style={
                                        styles.saveButton
                                    }
                                    disabled={
                                        creatingPlan
                                    }
                                >

                                    {creatingPlan
                                        ? "Creating..."
                                        : "Create Workout Plan"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );

}

// =============================================================
// HELPERS
// =============================================================

function getDifficultyStyle(difficulty) {

    const value =
        String(difficulty || "")
            .toLowerCase();

    if (value === "beginner") {

        return {
            backgroundColor: "#eaf8ee",
            color: "#218739"
        };

    }

    if (value === "intermediate") {

        return {
            backgroundColor: "#fff6dc",
            color: "#a87500"
        };

    }

    if (value === "advanced") {

        return {
            backgroundColor: "#ffeaea",
            color: "#c83232"
        };

    }

    return {
        backgroundColor: "#f1f1f1",
        color: "#333"
    };

}

function getDifficultyIcon(difficulty) {

    const value =
        String(difficulty || "")
            .toLowerCase();

    if (value === "beginner") {
        return "🟢";
    }

    if (value === "intermediate") {
        return "🟡";
    }

    if (value === "advanced") {
        return "🔴";
    }

    return "⚪";

}

function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    try {

        return new Date(
            dateValue
        ).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "numeric",
                year: "numeric"
            }
        );

    } catch {

        return "";

    }

}

// =============================================================
// STYLES
// =============================================================

const styles = {

    centerContainer: {
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px"
    },

    loadingIcon: {
        fontSize: "45px"
    },

    loadingText: {
        color: "var(--wt-text-primary, #111827)",
        margin: 0
    },

    centerSubtext: {
        color: "var(--wt-text-secondary, #6b7280)",
        margin: 0
    },

    errorIcon: {
        fontSize: "45px"
    },

    errorTitle: {
        color: "var(--wt-text-primary, #111827)",
        textAlign: "center"
    },

    button: {
        border: "none",
        borderRadius: "10px",
        padding: "12px 22px",
        backgroundColor: "#111827",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "700"
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "20px",
        marginBottom: "35px",
        flexWrap: "wrap"
    },

    eyebrow: {
        margin: "0 0 8px 0",
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "2px",
        color: "var(--wt-text-secondary, #777)"
    },

    title: {
        margin: "0",
        fontSize: "38px",
        fontWeight: "800",
        letterSpacing: "-1px",
        color: "var(--wt-text-primary, #111)"
    },

    subtitle: {
        margin: "10px 0 0 0",
        color: "var(--wt-text-secondary, #666)",
        fontSize: "16px"
    },

    headerActions: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap"
    },

    createPlanButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        border: "none",
        borderRadius: "13px",
        padding: "13px 18px",
        backgroundColor: "#2563eb",
        color: "#fff",
        fontSize: "14px",
        fontWeight: "800",
        cursor: "pointer",
        boxShadow: "0 8px 18px rgba(37, 99, 235, 0.20)"
    },

    createIcon: {
        fontSize: "20px",
        lineHeight: 1
    },

    headerBadge: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "#111827",
        color: "#fff",
        padding: "11px 16px",
        borderRadius: "30px",
        fontSize: "14px",
        fontWeight: "700"
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(290px, 1fr))",
        gap: "25px"
    },

    card: {
        position: "relative",
        backgroundColor:
            "var(--wt-surface, #fff)",
        borderRadius: "22px",
        padding: "26px",
        boxShadow:
            "0 8px 30px rgba(0, 0, 0, 0.08)",
        border:
            "1px solid var(--wt-border, rgba(0,0,0,0.05))"
    },

    cardTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
    },

    planIcon: {
        width: "52px",
        height: "52px",
        borderRadius: "15px",
        backgroundColor: "#f2f2f2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "25px"
    },

    planNumber: {
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "1px",
        color: "var(--wt-text-secondary, #999)"
    },

    cardTitle: {
        margin: "0 0 12px 0",
        fontSize: "23px",
        fontWeight: "750",
        color: "var(--wt-text-primary, #111)"
    },

    description: {
        margin: "0 0 20px 0",
        color: "var(--wt-text-secondary, #666)",
        lineHeight: "1.6",
        minHeight: "50px"
    },

    infoContainer: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "18px"
    },

    categoryBadge: {
        backgroundColor: "#eef2ff",
        color: "#334155",
        padding: "7px 11px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700"
    },

    difficultyBadge: {
        padding: "7px 11px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700"
    },

    cardFooter: {
        display: "flex",
        justifyContent: "space-between",
        gap: "10px",
        paddingTop: "15px",
        borderTop:
            "1px solid var(--wt-border, #e5e7eb)",
        marginBottom: "16px"
    },

    planId: {
        color: "var(--wt-text-secondary, #777)",
        fontSize: "12px"
    },

    createdDate: {
        color: "var(--wt-text-secondary, #777)",
        fontSize: "12px"
    },

    startButton: {
        width: "100%",
        border: "none",
        borderRadius: "13px",
        padding: "14px 18px",
        backgroundColor: "#111827",
        color: "#fff",
        fontSize: "15px",
        fontWeight: "700",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
    },

    arrow: {
        fontSize: "20px"
    },

    emptyContainer: {
        backgroundColor:
            "var(--wt-surface, #fff)",
        borderRadius: "22px",
        padding: "70px 30px",
        textAlign: "center",
        boxShadow:
            "0 8px 30px rgba(0, 0, 0, 0.06)"
    },

    emptyIcon: {
        fontSize: "55px",
        marginBottom: "15px"
    },

    emptyTitle: {
        margin: "0 0 10px 0",
        fontSize: "24px",
        color:
            "var(--wt-text-primary, #111)"
    },

    emptyText: {
        margin: "0 0 25px 0",
        color:
            "var(--wt-text-secondary, #777)"
    },

    emptyCreateButton: {
        border: "none",
        borderRadius: "12px",
        padding: "13px 20px",
        backgroundColor: "#2563eb",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "800"
    },

    modalOverlay: {
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        backgroundColor:
            "rgba(15, 23, 42, 0.62)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto"
    },

    modal: {
        width: "100%",
        maxWidth: "1050px",
        maxHeight: "92vh",
        overflowY: "auto",
        backgroundColor:
            "var(--wt-surface, #fff)",
        borderRadius: "24px",
        boxShadow:
            "0 30px 80px rgba(0, 0, 0, 0.25)"
    },

    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        padding: "28px 30px",
        borderBottom:
            "1px solid var(--wt-border, #e5e7eb)"
    },

    modalEyebrow: {
        margin: "0 0 7px 0",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "2px",
        color: "#2563eb"
    },

    modalTitle: {
        margin: 0,
        fontSize: "28px",
        color:
            "var(--wt-text-primary, #111827)"
    },

    modalSubtitle: {
        margin: "7px 0 0 0",
        color:
            "var(--wt-text-secondary, #64748b)"
    },

    closeButton: {
        width: "42px",
        height: "42px",
        flexShrink: 0,
        border: "1px solid #e5e7eb",
        borderRadius: "50%",
        backgroundColor: "#fff",
        color: "#111827",
        fontSize: "28px",
        lineHeight: 1,
        cursor: "pointer"
    },

    section: {
        padding: "25px 30px",
        borderBottom:
            "1px solid var(--wt-border, #e5e7eb)"
    },

    sectionTitle: {
        margin: "0 0 6px 0",
        fontSize: "19px",
        color:
            "var(--wt-text-primary, #111827)"
    },

    sectionDescription: {
        margin: 0,
        color:
            "var(--wt-text-secondary, #64748b)",
        fontSize: "13px"
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
        marginTop: "18px"
    },

    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "7px"
    },

    label: {
        fontSize: "13px",
        fontWeight: "750",
        color:
            "var(--wt-text-primary, #334155)"
    },

    smallLabel: {
        fontSize: "11px",
        fontWeight: "750",
        color:
            "var(--wt-text-secondary, #64748b)"
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        minHeight: "43px",
        border:
            "1px solid var(--wt-border, #dbe1e8)",
        borderRadius: "10px",
        padding: "10px 12px",
        backgroundColor:
            "var(--wt-input-bg, #fff)",
        color:
            "var(--wt-text-primary, #111827)",
        fontSize: "14px",
        outline: "none"
    },

    exerciseSectionHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        flexWrap: "wrap",
        marginBottom: "18px"
    },

    addExerciseButton: {
        border: "none",
        borderRadius: "10px",
        padding: "11px 15px",
        backgroundColor: "#2563eb",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "800"
    },

    noExerciseBox: {
        border:
            "2px dashed #dbe1e8",
        borderRadius: "15px",
        padding: "35px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        color:
            "var(--wt-text-secondary, #64748b)",
        textAlign: "center"
    },

    noExerciseIcon: {
        fontSize: "35px",
        marginBottom: "4px"
    },

    exerciseList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },

    exerciseRow: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "15px",
        border:
            "1px solid var(--wt-border, #e5e7eb)",
        borderRadius: "15px",
        backgroundColor:
            "var(--wt-surface-secondary, #f8fafc)"
    },

    exerciseNumber: {
        width: "32px",
        height: "32px",
        flexShrink: 0,
        borderRadius: "50%",
        backgroundColor: "#111827",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: "800"
    },

    exerciseFields: {
        flex: 1,
        display: "grid",
        gridTemplateColumns:
            "2fr 1fr 1fr 0.8fr 0.9fr",
        gap: "10px"
    },

    removeButton: {
        width: "38px",
        height: "38px",
        flexShrink: 0,
        border: "1px solid #fecaca",
        borderRadius: "9px",
        backgroundColor: "#fff1f2",
        cursor: "pointer",
        fontSize: "15px"
    },

    errorBox: {
        margin: "20px 30px 0 30px",
        padding: "12px 14px",
        borderRadius: "10px",
        backgroundColor: "#fff1f2",
        color: "#b91c1c",
        border: "1px solid #fecaca",
        fontSize: "14px",
        fontWeight: "600"
    },

    successBox: {
        margin: "20px 30px 0 30px",
        padding: "12px 14px",
        borderRadius: "10px",
        backgroundColor: "#ecfdf5",
        color: "#047857",
        border: "1px solid #a7f3d0",
        fontSize: "14px",
        fontWeight: "600"
    },

    modalFooter: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        padding: "22px 30px"
    },

    cancelButton: {
        border:
            "1px solid var(--wt-border, #dbe1e8)",
        borderRadius: "10px",
        padding: "12px 18px",
        backgroundColor:
            "var(--wt-surface, #fff)",
        color:
            "var(--wt-text-primary, #111827)",
        cursor: "pointer",
        fontWeight: "700"
    },

    saveButton: {
        border: "none",
        borderRadius: "10px",
        padding: "12px 20px",
        backgroundColor: "#2563eb",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "800"
    }

};

export default WorkoutPlans;