// ==========================================
// INSTALL INSTRUCTIONS PER DEVICE
// ==========================================
// Used by the 📲 guide in the Navbar and by the /install page.
// Keys match detectPlatform() in pwaManager.js.

export const INSTALL_GUIDES = {
    "android-chrome": {
        title: "Android (Chrome)",
        icon: "🤖",
        steps: [
            "Open this site in Chrome.",
            "Tap the 📲 Install button, or open the ⋮ menu and tap \"Install app\".",
            "Tap Install. Workout Tracker appears on your home screen."
        ]
    },

    "android-samsung": {
        title: "Android (Samsung Internet)",
        icon: "🤖",
        steps: [
            "Tap the ☰ menu at the bottom.",
            "Tap \"Add page to\", then \"Home screen\".",
            "Tap Add. Open Workout Tracker from your home screen."
        ]
    },

    "android-firefox": {
        title: "Android (Firefox)",
        icon: "🤖",
        steps: [
            "Tap the ⋮ menu.",
            "Tap \"Install\" (or \"Add to Home screen\").",
            "Confirm. Open Workout Tracker from your home screen."
        ]
    },

    ios: {
        title: "iPhone / iPad",
        icon: "🍎",
        steps: [
            "Open this site in Safari (Chrome and Edge also work on iOS 16.4+).",
            "Tap the Share button ⬆️ at the bottom (on iPad: top right).",
            "Scroll down and tap \"Add to Home Screen\", then tap Add.",
            "Open Workout Tracker from your home screen."
        ]
    },

    "desktop-chromium": {
        title: "Windows / Mac / Linux (Chrome or Edge)",
        icon: "💻",
        steps: [
            "Click the 📲 Install button, or the install icon at the right end of the address bar.",
            "Click Install. Workout Tracker opens in its own window and appears in your Start menu / Dock."
        ]
    },

    "mac-safari": {
        title: "Mac (Safari)",
        icon: "💻",
        steps: [
            "In the menu bar choose File → \"Add to Dock\" (Safari 17 or newer).",
            "Click Add. Workout Tracker appears in your Dock."
        ]
    },

    "desktop-firefox": {
        title: "Computer (Firefox)",
        icon: "💻",
        steps: [
            "Firefox on computers cannot install web apps.",
            "Open this site in Chrome or Edge and use their Install option,",
            "or simply bookmark it and use it in Firefox."
        ]
    }
};

/*
 * Link to share with friends: the site root with ?install.
 * The root always loads (no server rewrite needed) and the app then
 * opens the /install page.
 */
export function getShareUrl() {
    return `${window.location.origin}/?install`;
}

// Order used on the /install page
export const INSTALL_GUIDE_ORDER = [
    "android-chrome",
    "ios",
    "desktop-chromium",
    "mac-safari",
    "android-samsung",
    "android-firefox",
    "desktop-firefox"
];
