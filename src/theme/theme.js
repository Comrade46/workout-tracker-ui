const THEME_STORAGE_KEY = "workoutTrackerTheme";

export const THEMES = {
    LIGHT: "light",
    DARK: "dark"
};

export const themeValues = {
    /*
     * "Lavender" light theme - near-white lavender-tinted backgrounds with a
     * deep purple accent, from the violet flower palette:
     *   #C0C0C0  #B7A0CC  #4E3677  #342B45  #1A1829
     * Every text colour meets WCAG AA (4.5:1) on the surfaces it is used on.
     */
    light: {
        pageBackground: "#F6F4FA",
        surface: "#FFFFFF",
        surfaceSecondary: "#FAF8FD",
        surfaceTertiary: "#EFEAF6",

        textPrimary: "#1A1829",
        textSecondary: "#463C5C",
        textMuted: "#6A6180",

        border: "#E3DCEE",
        borderStrong: "#C9BCDD",

        inputBackground: "#FFFFFF",
        inputText: "#1A1829",
        inputPlaceholder: "#6A6180",
        inputBorder: "#9C8AB5",

        selectBackground: "#FFFFFF",
        selectText: "#1A1829",
        optionBackground: "#FFFFFF",
        optionText: "#1A1829",

        buttonBackground: "#4E3677",
        buttonText: "#FFFFFF",

        secondaryButtonBackground: "#FFFFFF",
        secondaryButtonText: "#1A1829",

        accent: "#4E3677",
        accentSoft: "rgba(78, 54, 119, 0.10)",
        onAccent: "#FFFFFF",

        success: "#166534",
        successSoft: "rgba(22, 101, 52, 0.10)",
        onSuccess: "#FFFFFF",

        warning: "#B45309",
        onWarning: "#FFFFFF",

        danger: "#C62828",
        dangerSoft: "rgba(198, 40, 40, 0.10)",
        dangerBorder: "rgba(198, 40, 40, 0.30)",
        onDanger: "#FFFFFF",

        shadow:
            "0 8px 30px rgba(52, 43, 69, 0.10)",
        shadowSmall:
            "0 4px 12px rgba(52, 43, 69, 0.07)",

        // Phone status bar colour
        statusBar: "#4E3677"
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
