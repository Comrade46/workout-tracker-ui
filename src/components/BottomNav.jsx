import { Link, useLocation } from "react-router-dom";
import { getToken } from "../auth/session";
import { usePendingWorkouts } from "../offline/workoutOutbox";
import "./BottomNav.css";

/*
 * Phone tab bar (like the Home Workout app): the main places one tap
 * away. Shown on small screens only; other pages stay in the ☰ menu.
 */
const TABS = [
    { label: "Home", path: "/dashboard", icon: "🏠" },
    { label: "Workouts", path: "/programs", icon: "🏋️", match: ["/programs", "/workout-plans"] },
    { label: "History", path: "/workout-history", icon: "📅" },
    { label: "Stats", path: "/analytics", icon: "📊", match: ["/analytics", "/progress", "/body"] },
    { label: "Me", path: "/profile", icon: "👤", match: ["/profile", "/admin"] }
];

const HIDDEN_ON = ["/login", "/register", "/forgot-password", "/install"];

function isWorkoutPlayer(pathname) {
    return pathname.startsWith("/workout-player/") || /^\/programs\/[^/]+\/[^/]+\/play$/.test(pathname);
}

function BottomNav() {
    const { pathname } = useLocation();
    const { pending } = usePendingWorkouts();

    if (!getToken() || HIDDEN_ON.includes(pathname) || isWorkoutPlayer(pathname)) {
        return null;
    }

    const isActive = (tab) =>
        (tab.match || [tab.path]).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

    return (
        <>
            {/* Keeps the last bit of every page above the bar */}
            <div className="wt-bottom-nav-spacer" aria-hidden="true" />

            <nav className="wt-bottom-nav" aria-label="Main">
                {TABS.map((tab) => {
                    const active = isActive(tab);

                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={`wt-bottom-tab${active ? " active" : ""}`}
                            aria-current={active ? "page" : undefined}
                        >
                            <span className="wt-bottom-icon" aria-hidden="true">
                                {tab.icon}
                                {tab.path === "/profile" && pending.length > 0 && (
                                    <span className="wt-bottom-dot" />
                                )}
                            </span>
                            <span className="wt-bottom-label">{tab.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}

export default BottomNav;
