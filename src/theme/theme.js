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
        inputBorder: "#cbd5e1",

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
        onAccent: "#ffffff",

        success: "#15803d",
        successSoft: "rgba(22, 163, 74, 0.10)",
        onSuccess: "#ffffff",

        warning: "#d97706",
        onWarning: "#ffffff",

        danger: "#dc2626",
        dangerSoft: "rgba(220, 38, 38, 0.10)",
        dangerBorder: "#fecaca",
        onDanger: "#ffffff",

        shadow:
            "0 8px 30px rgba(15, 23, 42, 0.08)",
        shadowSmall:
            "0 4px 12px rgba(15, 23, 42, 0.06)",

        // Phone status bar colour
        statusBar: "#2563eb"
    },

    /*
     * "Storm" dark theme - deep navy-teal backgrounds with a mint accent,
     * from the storm-over-the-sea palette:
     *   #D0D8D6  #88B9AE  #537774  #03222E  #05141E
     * Every text colour meets WCAG AA (4.5:1) on the surfaces it is used on.
     */
    dark: {
        pageBackground: "#05141E",
        surface: "#0B2531",
        surfaceSecondary: "#10303C",
        surfaceTertiary: "#173B47",

        textPrimary: "#E6EDEB",
        textSecondary: "#BFD0CC",
        textMuted: "#8FAAA5",

        border: "#214652",
        borderStrong: "#537774",

        inputBackground: "#071B25",
        inputText: "#E6EDEB",
        inputPlaceholder: "#8FAAA5",
        inputBorder: "#537774",

        selectBackground: "#071B25",
        selectText: "#E6EDEB",
        optionBackground: "#0B2531",
        optionText: "#E6EDEB",

        buttonBackground: "#88B9AE",
        buttonText: "#05141E",

        secondaryButtonBackground: "#10303C",
        secondaryButtonText: "#E6EDEB",

        accent: "#88B9AE",
        accentSoft: "rgba(136, 185, 174, 0.16)",
        onAccent: "#05141E",

        success: "#7ED9A8",
        successSoft: "rgba(126, 217, 168, 0.14)",
        onSuccess: "#05141E",

        warning: "#F2C572",
        onWarning: "#05141E",

        danger: "#F4978E",
        dangerSoft: "rgba(244, 151, 142, 0.14)",
        dangerBorder: "rgba(244, 151, 142, 0.35)",
        onDanger: "#05141E",

        shadow:
            "0 10px 35px rgba(0, 0, 0, 0.45)",
        shadowSmall:
            "0 4px 12px rgba(0, 0, 0, 0.3)",

        statusBar: "#05141E"
    }
};

// Theme value -> CSS variable used throughout the app
const CSS_VARIABLES = {
    pageBackground: "--wt-page-background",
    surface: "--wt-surface",
    surfaceSecondary: "--wt-surface-secondary",
    surfaceTertiary: "--wt-surface-tertiary",
    textPrimary: "--wt-text-primary",
    textSecondary: "--wt-text-secondary",
    textMuted: "--wt-text-muted",
    border: "--wt-border",
    borderStrong: "--wt-border-strong",
    inputBackground: "--wt-input-background",
    inputText: "--wt-input-text",
    inputPlaceholder: "--wt-input-placeholder",
    inputBorder: "--wt-input-border",
    selectBackground: "--wt-select-background",
    selectText: "--wt-select-text",
    optionBackground: "--wt-option-background",
    optionText: "--wt-option-text",
    buttonBackground: "--wt-button-background",
    buttonText: "--wt-button-text",
    secondaryButtonBackground: "--wt-secondary-button-background",
    secondaryButtonText: "--wt-secondary-button-text",
    accent: "--wt-accent",
    accentSoft: "--wt-accent-soft",
    onAccent: "--wt-on-accent",
    success: "--wt-success",
    successSoft: "--wt-success-soft",
    onSuccess: "--wt-on-success",
    warning: "--wt-warning",
    onWarning: "--wt-on-warning",
    danger: "--wt-danger",
    dangerSoft: "--wt-danger-soft",
    dangerBorder: "--wt-danger-border",
    onDanger: "--wt-on-danger",
    shadow: "--wt-shadow",
    shadowSmall: "--wt-shadow-small"
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

    Object.entries(CSS_VARIABLES).forEach(([key, variable]) => {
        document.documentElement.style.setProperty(
            variable,
            values[key]
        );
    });

    // Match the phone's status bar / browser toolbar to the theme.
    document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", values.statusBar);
}

export {
    THEME_STORAGE_KEY
};
