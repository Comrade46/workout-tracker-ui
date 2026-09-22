import { useEffect, useState } from "react";
import {
    THEMES,
    applyTheme,
    getStoredTheme,
    saveTheme
} from "./theme";

function ThemeToggle() {
    const [theme, setTheme] = useState(
        getStoredTheme()
    );

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const toggleTheme = () => {
        const nextTheme =
            theme === THEMES.DARK
                ? THEMES.LIGHT
                : THEMES.DARK;

        setTheme(nextTheme);
        saveTheme(nextTheme);
        applyTheme(nextTheme);
    };

    const isDark = theme === THEMES.DARK;

    return (
        <button
            type="button"
            onClick={toggleTheme}
            title={
                isDark
                    ? "Switch to Light Theme"
                    : "Switch to Dark Theme"
            }
            aria-label={
                isDark
                    ? "Switch to Light Theme"
                    : "Switch to Dark Theme"
            }
            style={{
                ...styles.button,
                backgroundColor: isDark
                    ? "#1e293b"
                    : "#ffffff",
                color: isDark
                    ? "#f8fafc"
                    : "#111827",
                borderColor: isDark
                    ? "#334155"
                    : "#d1d5db"
            }}
        >
            <span style={styles.icon}>
                {isDark ? "☀️" : "🌙"}
            </span>

            <span>
                {isDark ? "Light" : "Dark"}
            </span>
        </button>
    );
}

const styles = {
    button: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        border: "1px solid",
        borderRadius: "10px",
        padding: "9px 13px",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap"
    },

    icon: {
        fontSize: "15px"
    }
};

export default ThemeToggle;