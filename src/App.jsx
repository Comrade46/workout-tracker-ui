import { lazy, Suspense, useEffect, useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import Navbar from "./components/Navbar";
import ServerWakeIndicator from "./components/ServerWakeIndicator";

/*
 * Pages are loaded when first opened, so the first start on a phone
 * only downloads what the first screen needs. The service worker still
 * caches every page for offline use after the first visit.
 */
const Dashboard = lazy(() => import("./components/Dashboard"));
const Workouts = lazy(() => import("./components/Workouts"));
const WorkoutPlans = lazy(() => import("./components/WorkoutPlans"));
const WorkoutPlayer = lazy(() => import("./components/WorkoutPlayer"));
const Analytics = lazy(() => import("./components/Analytics"));
const ProgressTracking = lazy(() => import("./components/ProgressTracking"));
const Exercises = lazy(() => import("./components/Exercises"));
const WorkoutHistory = lazy(() => import("./components/WorkoutHistory"));
const InstallPage = lazy(() => import("./components/InstallPage"));


function PageLoading() {
    return (
        <div
            role="status"
            style={{
                minHeight: "50vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--wt-text-muted)",
                fontWeight: 600
            }}
        >
            Loading…
        </div>
    );
}


function ProtectedRoute({ children }) {

    const token = localStorage.getItem("token");

    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return children;
}


/*
 * "/" goes to the dashboard, except the shared install link "/?install"
 * which opens the Get the app page.
 */
function RootRedirect() {
    const location = useLocation();

    const wantsInstall =
        new URLSearchParams(location.search).has("install");

    return (
        <Navigate
            to={wantsInstall ? "/install" : "/dashboard"}
            replace
        />
    );
}


function AppContent() {

    const navigate = useNavigate();

    const [sessionMessage, setSessionMessage] = useState("");


    useEffect(() => {

        const handleSessionExpired = () => {

            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("user");

            setSessionMessage(
                "Your session has expired. Please login again."
            );

            navigate("/login", {
                replace: true
            });
        };


        window.addEventListener(
            "workoutTracker:sessionExpired",
            handleSessionExpired
        );


        return () => {

            window.removeEventListener(
                "workoutTracker:sessionExpired",
                handleSessionExpired
            );

        };

    }, [navigate]);


    return (

        <>

            <Navbar />

            {/* Shown only while the backend is slow / waking up */}
            <ServerWakeIndicator />

            <Suspense fallback={<PageLoading />}>

            <Routes>

                {/* =========================
                    PUBLIC ROUTES
                ========================= */}

                <Route
                    path="/login"
                    element={
                        <Login
                            sessionMessage={sessionMessage}
                            clearSessionMessage={() =>
                                setSessionMessage("")
                            }
                        />
                    }
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* Public "Get the app" page */}
                <Route
                    path="/install"
                    element={<InstallPage />}
                />

                <Route
                    path="/"
                    element={<RootRedirect />}
                />


                {/* =========================
                    DASHBOARD
                ========================= */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    EXERCISE LIBRARY
                ========================= */}

                <Route
                    path="/exercises"
                    element={
                        <ProtectedRoute>
                            <Exercises />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    WORKOUTS
                ========================= */}

                <Route
                    path="/workouts"
                    element={
                        <ProtectedRoute>
                            <Workouts />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    WORKOUT PLANS
                ========================= */}

                <Route
                    path="/workout-plans"
                    element={
                        <ProtectedRoute>
                            <WorkoutPlans />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    WORKOUT PLAYER
                ========================= */}

                <Route
                    path="/workout-player/:planId"
                    element={
                        <ProtectedRoute>
                            <WorkoutPlayer />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    ANALYTICS
                ========================= */}

                <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute>
                            <Analytics />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    PROGRESS TRACKING
                ========================= */}

                <Route
                    path="/progress"
                    element={
                        <ProtectedRoute>
                            <ProgressTracking />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    WORKOUT HISTORY
                ========================= */}

                <Route
                    path="/workout-history"
                    element={
                        <ProtectedRoute>
                            <WorkoutHistory />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    DEFAULT ROUTE
                ========================= */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />

            </Routes>

            </Suspense>

        </>

    );
}


function App() {

    return (

        <Router>

            <AppContent />

        </Router>

    );

}


export default App;