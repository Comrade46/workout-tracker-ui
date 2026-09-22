const THEME_STORAGE_KEY = "workoutTrackerTheme";

export const THEMES = {
    LIGHT: "light",
    DARK: "dark"
};

export const themeValues = {
    light: {
        pageBackground: "#f5f7fb",
        surface: "#ffffff",
        surfaceSecondary: "#f8fafc",
        surfaceTertiary: "#eef2f7",

        textPrimary: "#111827",
        textSecondary: "#4b5563",
        textMuted: "#6b7280",

        border: "#dfe3e8",
        borderStrong: "#cbd5e1",

        inputBackground: "#ffffff",
        inputText: "#111827",
        inputPlaceholder: "#6b7280",

        selectBackground: "#ffffff",
        selectText: "#111827",
        optionBackground: "#ffffff",
        optionText: "#111827",

        buttonBackground: "#111827",
        buttonText: "#ffffff",

        secondaryButtonBackground: "#ffffff",
        secondaryButtonText: "#111827",

        accent: "#2563eb",
        accentSoft: "rgba(37, 99, 235, 0.10)",

        success: "#15803d",
        successSoft: "rgba(22, 163, 74, 0.10)",

        danger: "#dc2626",
        dangerSoft: "rgba(220, 38, 38, 0.10)",

        shadow:
            "0 8px 30px rgba(15, 23, 42, 0.08)"
    },

    dark: {
        pageBackground: "#0b0f14",
        surface: "#121821",
        surfaceSecondary: "#171f2a",
        surfaceTertiary: "#1d2733",

        textPrimary: "#f8fafc",
        textSecondary: "#cbd5e1",
        textMuted: "#94a3b8",

        border: "#293544",
        borderStrong: "#3a4858",

        inputBackground: "#0f151d",
        inputText: "#f8fafc",
        inputPlaceholder: "#94a3b8",

        selectBackground: "#0f151d",
        selectText: "#f8fafc",
        optionBackground: "#121821",
        optionText: "#f8fafc",

        buttonBackground: "#f8fafc",
        buttonText: "#0f172a",

        secondaryButtonBackground: "#1a2330",
        secondaryButtonText: "#f8fafc",

        accent: "#60a5fa",
        accentSoft: "rgba(96, 165, 250, 0.14)",

        success: "#4ade80",
        successSoft: "rgba(74, 222, 128, 0.12)",

        danger: "#f87171",
        dangerSoft: "rgba(248, 113, 113, 0.12)",

        shadow:
            "0 10px 35px rgba(0, 0, 0, 0.35)"
    }
};

export function getStoredTheme() {
    try {
        const savedTheme =
            localStorage.getItem(
                THEME_STORAGE_KEY
            );

        if (
            savedTheme === THEMES.DARK ||
            savedTheme === THEMES.LIGHT
        ) {
            return savedTheme;
        }
    } catch {
        // Ignore localStorage errors.
    }

    return THEMES.LIGHT;
}

export function saveTheme(theme) {
    try {
        localStorage.setItem(
            THEME_STORAGE_KEY,
            theme
        );
    } catch {
        // Ignore localStorage errors.
    }
}

export function applyTheme(theme) {
    const selectedTheme =
        theme === THEMES.DARK
            ? THEMES.DARK
            : THEMES.LIGHT;

    document.documentElement.dataset.theme =
        selectedTheme;

    document.body.dataset.theme =
        selectedTheme;

    const values =
        themeValues[selectedTheme];

    document.documentElement.style.setProperty(
        "--wt-page-background",
        values.pageBackground
    );

    document.documentElement.style.setProperty(
        "--wt-surface",
        values.surface
    );

    document.documentElement.style.setProperty(
        "--wt-surface-secondary",
        values.surfaceSecondary
    );

    document.documentElement.style.setProperty(
        "--wt-surface-tertiary",
        values.surfaceTertiary
    );

    document.documentElement.style.setProperty(
        "--wt-text-primary",
        values.textPrimary
    );

    document.documentElement.style.setProperty(
        "--wt-text-secondary",
        values.textSecondary
    );

    document.documentElement.style.setProperty(
        "--wt-text-muted",
        values.textMuted
    );

    document.documentElement.style.setProperty(
        "--wt-border",
        values.border
    );

    document.documentElement.style.setProperty(
        "--wt-border-strong",
        values.borderStrong
    );

    document.documentElement.style.setProperty(
        "--wt-input-background",
        values.inputBackground
    );

    document.documentElement.style.setProperty(
        "--wt-input-text",
        values.inputText
    );

    document.documentElement.style.setProperty(
        "--wt-input-placeholder",
        values.inputPlaceholder
    );

    document.documentElement.style.setProperty(
        "--wt-select-background",
        values.selectBackground
    );

    document.documentElement.style.setProperty(
        "--wt-select-text",
        values.selectText
    );

    document.documentElement.style.setProperty(
        "--wt-option-background",
        values.optionBackground
    );

    document.documentElement.style.setProperty(
        "--wt-option-text",
        values.optionText
    );

    document.documentElement.style.setProperty(
        "--wt-button-background",
        values.buttonBackground
    );

    document.documentElement.style.setProperty(
        "--wt-button-text",
        values.buttonText
    );

    document.documentElement.style.setProperty(
        "--wt-secondary-button-background",
        values.secondaryButtonBackground
    );

    document.documentElement.style.setProperty(
        "--wt-secondary-button-text",
        values.secondaryButtonText
    );

    document.documentElement.style.setProperty(
        "--wt-accent",
        values.accent
    );

    document.documentElement.style.setProperty(
        "--wt-accent-soft",
        values.accentSoft
    );

    document.documentElement.style.setProperty(
        "--wt-success",
        values.success
    );

    document.documentElement.style.setProperty(
        "--wt-success-soft",
        values.successSoft
    );

    document.documentElement.style.setProperty(
        "--wt-danger",
        values.danger
    );

    document.documentElement.style.setProperty(
        "--wt-danger-soft",
        values.dangerSoft
    );

    document.documentElement.style.setProperty(
        "--wt-shadow",
        values.shadow
    );
}

export {
    THEME_STORAGE_KEY
};