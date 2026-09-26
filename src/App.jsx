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
import BottomNav from "./components/BottomNav";
import api from "./api/axiosConfig";
import {
    clearSession,
    getToken,
    isAdmin,
    mustChangePassword,
    saveSession,
    shouldRenewToken
} from "./auth/session";
import { startBackgroundSync } from "./offline/workoutOutbox";

/*
 * Pages are loaded when first opened, so the first start on a phone
 * only downloads what the first screen needs. The service worker still
 * caches every page for offline use after the first visit.
 */
const Dashboard = lazy(() => import("./components/Dashboard"));
const Workouts = lazy(() => import("./components/Workouts"));
const WorkoutPlans = lazy(() => import("./components/WorkoutPlans"));
// Follow-along player (Ready -> exercise -> rest -> finish)
const WorkoutPlayer = lazy(() => import("./player/FollowAlongPlayer"));
const Analytics = lazy(() => import("./components/Analytics"));
const ProgressTracking = lazy(() => import("./components/ProgressTracking"));
const Exercises = lazy(() => import("./components/Exercises"));
const WorkoutHistory = lazy(() => import("./components/WorkoutHistory"));
const InstallPage = lazy(() => import("./components/InstallPage"));
const ProgramsPage = lazy(() => import("./components/ProgramsPage"));
const ProgramDetailPage = lazy(() => import("./components/ProgramDetailPage"));
const ProgramWorkoutPage = lazy(() => import("./components/ProgramWorkoutPage"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));
const AdminPage = lazy(() => import("./components/AdminPage"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword"));
const BodyPage = lazy(() => import("./progress/BodyPage"));


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

    const location = useLocation();

    if (!getToken()) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    // Logged in with a temporary password: choose a new one first.
    if (mustChangePassword() && location.pathname !== "/profile") {
        return (
            <Navigate
                to="/profile"
                replace
            />
        );
    }

    return children;
}


// Admin tools; the server checks this again for every request.
function AdminRoute({ children }) {

    if (!isAdmin()) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    );
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

            clearSession();

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


    /*
     * On start: renew an older login token (keeps active users logged
     * in) and keep uploading workouts saved on this phone.
     */
    useEffect(() => {

        if (getToken() && shouldRenewToken()) {
            api.post("/users/me/token")
                .then((response) => saveSession(response.data))
                .catch(() => {
                    // Offline or server asleep: the current token still works.
                });
        }

        return startBackgroundSync();

    }, []);


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

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                {/* Account: password, uploads waiting, feedback */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />

                {/* Weight log, chart and BMI */}
                <Route
                    path="/body"
                    element={
                        <ProtectedRoute>
                            <BodyPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminPage />
                        </AdminRoute>
                    }
                />

                {/* Ready-made programs */}
                <Route
                    path="/programs"
                    element={
                        <ProtectedRoute>
                            <ProgramsPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/programs/:programId"
                    element={
                        <ProtectedRoute>
                            <ProgramDetailPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/programs/:programId/:dayKey"
                    element={
                        <ProtectedRoute>
                            <ProgramWorkoutPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/programs/:programId/:dayKey/play"
                    element={
                        <ProtectedRoute>
                            <WorkoutPlayer />
                        </ProtectedRoute>
                    }
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

            {/* Phones: Home · Workouts · History · Stats · Me */}
            <BottomNav />

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