import { useEffect, useState } from "react";
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
import Dashboard from "./components/Dashboard";
import Workouts from "./components/Workouts";
import WorkoutPlans from "./components/WorkoutPlans";
import WorkoutPlayer from "./components/WorkoutPlayer";
import Analytics from "./components/Analytics";
import ProgressTracking from "./components/ProgressTracking";
import Exercises from "./components/Exercises";
import Navbar from "./components/Navbar";
import WorkoutHistory from "./components/WorkoutHistory";
import ServerWakeIndicator from "./components/ServerWakeIndicator";
import InstallPage from "./components/InstallPage";


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