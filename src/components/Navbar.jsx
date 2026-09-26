import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../theme/ThemeToggle";
import PwaActions from "./PwaActions";
import { APP_VERSION_LABEL } from "../config/appVersion";
import { clearSession, isAdmin } from "../auth/session";
import { usePendingWorkouts } from "../offline/workoutOutbox";
import "./Account.css";

const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Programs", path: "/programs" },
    { label: "Workout Plans", path: "/workout-plans" },
    { label: "Exercise Library", path: "/exercises" },
    { label: "History", path: "/workout-history" },
    { label: "Analytics", path: "/analytics" },
    { label: "Progress", path: "/progress" },
];

// Narrower than this, the links move into the ☰ menu.
const NAV_FULL_WIDTH = 1300;

// Account pages: icon buttons on wide screens, text links in the menu.
// Admin is shown only to admins (ADMIN_USERNAMES on the server).
const profileItem = { label: "Profile", path: "/profile", icon: "👤" };
const adminItem = { label: "Admin", path: "/admin", icon: "🛡️" };

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const { pending } = usePendingWorkouts();

    const token = localStorage.getItem("token");

    const isAuthPage =
        location.pathname === "/login" ||
        location.pathname === "/register" ||
        location.pathname === "/forgot-password";

    // The workout player is full screen.
    const inWorkout =
        location.pathname.startsWith("/workout-player/") ||
        /^\/programs\/[^/]+\/[^/]+\/play$/.test(location.pathname);

    const shouldHideNavbar = !token || isAuthPage || inWorkout;

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!mobileMenuOpen) {
            return;
        }

        const handleResize = () => {
            if (window.innerWidth >= NAV_FULL_WIDTH) {
                setMobileMenuOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        if (!mobileMenuOpen) {
            return;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [mobileMenuOpen]);

    if (shouldHideNavbar) {
        return null;
    }

    const accountItems = isAdmin() ? [profileItem, adminItem] : [profileItem];

    const handleLogout = () => {
        clearSession();

        setMobileMenuOpen(false);

        navigate("/login", {
            replace: true,
        });
    };

    const isActive = (path) => {
        return (
            location.pathname === path ||
            (path === "/programs" && location.pathname.startsWith("/programs/"))
        );
    };

    return (
        <>
            <style>
                {`
                    .wt-navbar {
                        position: sticky;
                        top: 0;
                        z-index: 1000;

                        width: 100%;

                        background: var(--wt-surface);
                        color: var(--wt-text-primary);

                        border-bottom: 1px solid var(--wt-border);

                        box-shadow: var(--wt-shadow-small);
                    }

                    .wt-navbar-inner {
                        width: 100%;
                        max-width: 1440px;
                        min-height: 68px;

                        margin: 0 auto;
                        padding: 0 24px;

                        display: flex;
                        align-items: center;
                        gap: 24px;
                    }

                    .wt-brand {
                        display: flex;
                        align-items: center;
                        gap: 10px;

                        flex-shrink: 0;

                        color: var(--wt-text-primary);
                        text-decoration: none;
                    }

                    .wt-brand-icon {
                        width: 38px;
                        height: 38px;

                        border-radius: 10px;

                        object-fit: cover;

                        box-shadow: var(--wt-shadow-small);
                    }

                    .wt-brand-content {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        min-width: 0;
                    }

                    .wt-brand-text {
                        white-space: nowrap;

                        font-size: 20px;
                        font-weight: 800;
                        letter-spacing: -0.4px;

                        line-height: 1.15;
                    }

                    .wt-version-label {
                        margin-top: 3px;

                        color: var(--wt-text-secondary);

                        font-size: 10px;
                        font-weight: 600;

                        line-height: 1;

                        letter-spacing: 0.2px;

                        white-space: nowrap;
                    }

                    .wt-desktop-nav {
                        flex: 1;

                        display: flex;
                        align-items: center;
                        justify-content: center;

                        gap: 4px;
                    }

                    .wt-account-link {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;

                        width: 40px;
                        height: 40px;
                        flex-shrink: 0;

                        border-radius: 10px;
                        border: 1px solid var(--wt-border);
                        background: var(--wt-surface-secondary);

                        font-size: 18px;
                        text-decoration: none;
                    }

                    .wt-account-link.active {
                        border-color: var(--wt-accent);
                        background: var(--wt-accent-soft);
                    }

                    .wt-account-link:focus-visible {
                        outline: 2px solid var(--wt-accent);
                        outline-offset: 2px;
                    }

                    .wt-nav-link {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;

                        min-height: 40px;

                        padding: 8px 11px;

                        border-radius: 8px;

                        color: var(--wt-text-secondary);
                        text-decoration: none;

                        font-size: 14px;
                        font-weight: 600;

                        white-space: nowrap;

                        transition:
                            background-color 0.2s ease,
                            color 0.2s ease;
                    }

                    .wt-nav-link:hover {
                        background: var(--wt-surface-tertiary);
                        color: var(--wt-text-primary);
                    }

                    .wt-nav-link.active {
                        background: var(--wt-accent-soft);
                        color: var(--wt-accent);
                    }

                    .wt-navbar-actions {
                        display: flex;
                        align-items: center;
                        gap: 10px;

                        flex-shrink: 0;
                    }

                    .wt-logout-button {
                        min-height: 40px;

                        padding: 8px 14px;

                        border: 1px solid var(--wt-border);
                        border-radius: 8px;

                        background: var(--wt-surface);
                        color: var(--wt-text-primary);

                        font-size: 14px;
                        font-weight: 600;

                        transition:
                            background-color 0.2s ease,
                            border-color 0.2s ease,
                            color 0.2s ease;
                    }

                    .wt-logout-button:hover {
                        background: var(--wt-surface-tertiary);
                        border-color: var(--wt-border-strong);
                    }

                    .wt-mobile-menu-button {
                        display: none;

                        width: 42px;
                        height: 42px;

                        padding: 0;

                        border: 1px solid var(--wt-border);
                        border-radius: 9px;

                        background: var(--wt-surface);
                        color: var(--wt-text-primary);

                        align-items: center;
                        justify-content: center;

                        font-size: 23px;
                        line-height: 1;

                        cursor: pointer;
                    }

                    .wt-mobile-menu-button:hover {
                        background: var(--wt-surface-tertiary);
                    }

                    .wt-mobile-menu {
                        display: none;

                        border-top: 1px solid var(--wt-border);

                        background: var(--wt-surface);

                        padding: 10px 16px 16px;
                    }

                    .wt-mobile-menu-inner {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .wt-mobile-nav-link {
                        display: flex;
                        align-items: center;

                        min-height: 46px;

                        padding: 10px 13px;

                        border-radius: 9px;

                        color: var(--wt-text-secondary);
                        text-decoration: none;

                        font-size: 15px;
                        font-weight: 600;
                    }

                    .wt-mobile-nav-link:hover {
                        background: var(--wt-surface-tertiary);
                        color: var(--wt-text-primary);
                    }

                    .wt-mobile-nav-link.active {
                        background: var(--wt-accent-soft);
                        color: var(--wt-accent);
                    }

                    .wt-mobile-version {
                        padding: 4px 13px 8px;

                        color: var(--wt-text-secondary);

                        font-size: 11px;
                        font-weight: 600;
                    }

                    .wt-mobile-actions {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;

                        gap: 12px;

                        margin-top: 10px;
                        padding-top: 12px;

                        border-top: 1px solid var(--wt-border);
                    }

                    .wt-mobile-logout {
                        flex: 1;

                        min-height: 44px;

                        border: 1px solid var(--wt-border);
                        border-radius: 9px;

                        background: var(--wt-surface);
                        color: var(--wt-text-primary);

                        font-weight: 600;
                    }

                    @media (max-width: 1100px) {
                        .wt-navbar-inner {
                            gap: 12px;
                            padding-left: 16px;
                            padding-right: 16px;
                        }

                        .wt-desktop-nav {
                            gap: 2px;
                        }

                        .wt-nav-link {
                            padding-left: 8px;
                            padding-right: 8px;
                            font-size: 13px;
                        }

                        .wt-brand-text {
                            font-size: 18px;
                        }
                    }

                    /* Below 1300px the links no longer fit: use the ☰ menu */
                    @media (max-width: ${NAV_FULL_WIDTH - 0.02}px) {
                        .wt-navbar-inner {
                            min-height: 60px;
                            padding: 8px 14px;
                        }

                        .wt-desktop-nav {
                            display: none;
                        }

                        .wt-navbar-actions {
                            margin-left: auto;
                        }

                        .wt-navbar-actions .wt-logout-button {
                            display: none;
                        }

                        /* In the ☰ menu instead */
                        .wt-account-link {
                            display: none;
                        }

                        .wt-mobile-menu-button {
                            display: inline-flex;
                        }

                        .wt-mobile-menu {
                            display: block;
                        }

                        .wt-brand-icon {
                            width: 36px;
                            height: 36px;
                            border-radius: 9px;
                        }

                        .wt-brand-text {
                            font-size: 17px;
                        }

                        .wt-version-label {
                            font-size: 9px;
                        }
                    }

                    /*
                     * On narrow phones, when the 📲 / 🔄 icons are showing,
                     * make room by hiding the top-bar theme toggle.
                     * It is still available inside the ☰ menu.
                     */
                    .wt-navbar-theme {
                        display: inline-flex;
                    }

                    @media (max-width: 480px) {
                        .wt-navbar-actions:has(.wt-pwa-actions) .wt-navbar-theme,
                        .wt-navbar-actions:has(.wt-sync-chip) .wt-navbar-theme {
                            display: none;
                        }
                    }

                    @media (max-width: 420px) {
                        .wt-navbar-inner {
                            padding-left: 10px;
                            padding-right: 10px;
                        }

                        .wt-brand-text {
                            font-size: 16px;
                        }

                        .wt-brand-icon {
                            width: 34px;
                            height: 34px;
                        }

                        .wt-mobile-menu {
                            padding-left: 10px;
                            padding-right: 10px;
                        }
                    }
                `}
            </style>

            <nav className="wt-navbar">
                <div className="wt-navbar-inner">

                    <Link
                        to="/dashboard"
                        className="wt-brand"
                        aria-label="Workout Tracker Dashboard"
                    >
                        <img
                            src="/icons/icon-192-v2.png"
                            alt="Workout Tracker"
                            className="wt-brand-icon"
                        />

                        <div className="wt-brand-content">
                            <span className="wt-brand-text">
                                Workout Tracker
                            </span>

                            <span className="wt-version-label">
                                {APP_VERSION_LABEL}
                            </span>
                        </div>
                    </Link>

                    <div className="wt-desktop-nav">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`wt-nav-link ${
                                    isActive(item.path) ? "active" : ""
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <div className="wt-navbar-actions">
                        {pending.length > 0 && (
                            <Link
                                to="/profile"
                                className="wt-sync-chip"
                                title="Workouts saved on this phone, waiting to upload"
                                aria-label={`${pending.length} workout${pending.length === 1 ? "" : "s"} waiting to upload`}
                            >
                                ⏳ {pending.length}
                            </Link>
                        )}

                        <PwaActions />

                        {accountItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`wt-account-link ${isActive(item.path) ? "active" : ""}`}
                                title={item.label}
                                aria-label={item.label}
                            >
                                <span aria-hidden="true">{item.icon}</span>
                            </Link>
                        ))}

                        <span className="wt-navbar-theme">
                            <ThemeToggle />
                        </span>

                        <button
                            type="button"
                            className="wt-logout-button"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>

                        <button
                            type="button"
                            className="wt-mobile-menu-button"
                            onClick={() =>
                                setMobileMenuOpen((previous) => !previous)
                            }
                            aria-label={
                                mobileMenuOpen
                                    ? "Close navigation menu"
                                    : "Open navigation menu"
                            }
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? "×" : "☰"}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="wt-mobile-menu">
                        <div className="wt-mobile-menu-inner">

                            {[...navItems, ...accountItems].map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`wt-mobile-nav-link ${
                                        isActive(item.path) ? "active" : ""
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            <div className="wt-mobile-version">
                                {APP_VERSION_LABEL}
                            </div>

                            <div className="wt-mobile-actions">
                                <ThemeToggle />

                                <button
                                    type="button"
                                    className="wt-mobile-logout"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}

export default Navbar;