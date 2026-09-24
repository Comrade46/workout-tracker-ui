import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../theme/ThemeToggle";
import { APP_VERSION_LABEL } from "../config/appVersion";

const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Workouts", path: "/workouts" },
    { label: "Workout Plans", path: "/workout-plans" },
    { label: "Exercise Library", path: "/exercises" },
    { label: "History", path: "/workout-history" },
    { label: "Analytics", path: "/analytics" },
    { label: "Progress", path: "/progress" },
];

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const token = localStorage.getItem("token");

    const isAuthPage =
        location.pathname === "/login" ||
        location.pathname === "/register";

    const shouldHideNavbar = !token || isAuthPage;

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!mobileMenuOpen) {
            return;
        }

        const handleResize = () => {
            if (window.innerWidth > 768) {
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

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("user");

        setMobileMenuOpen(false);

        navigate("/login", {
            replace: true,
        });
    };

    const isActive = (path) => {
        return location.pathname === path;
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

                        box-shadow:
                            0 4px 10px rgba(37, 99, 235, 0.22);
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

                    @media (max-width: 768px) {
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
                            src="/icons/icon-192.png"
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
                        <ThemeToggle />

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

                            {navItems.map((item) => (
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