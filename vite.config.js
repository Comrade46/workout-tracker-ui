import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/*
 * The app version lives in three places:
 *   package.json            -> "version"
 *   src/config/appVersion.js -> APP_VERSION (shown in the app)
 *   public/version.json     -> "version" (what installed apps check for updates)
 *
 * This plugin stops the build if they do not match, so a release can
 * never ship with a version that does not trigger (or wrongly triggers)
 * the update icon.
 */
function versionConsistencyCheck() {
    return {
        name: "workout-tracker-version-check",

        // Only for `npm run build`: a mismatch while developing must not
        // stop the dev server.
        apply: "build",

        buildStart() {
            const read = (path) =>
                readFileSync(new URL(path, import.meta.url), "utf-8");

            const packageVersion =
                JSON.parse(read("./package.json")).version;

            const appVersion =
                read("./src/config/appVersion.js")
                    .match(/APP_VERSION\s*=\s*["']([^"']+)["']/)?.[1];

            const remoteVersion =
                JSON.parse(read("./public/version.json")).version;

            if (
                packageVersion !== appVersion ||
                appVersion !== remoteVersion
            ) {
                throw new Error(
                    "Version mismatch - update all three to the same version:\n" +
                    `  package.json             ${packageVersion}\n` +
                    `  src/config/appVersion.js ${appVersion}\n` +
                    `  public/version.json      ${remoteVersion}`
                );
            }
        }
    };
}

export default defineConfig({
    plugins: [
        react(),

        versionConsistencyCheck(),

        VitePWA({
            /*
             * "prompt": a new version is downloaded in the background but
             * only activated when the user clicks the 🔄 icon in the Navbar.
             */
            registerType: "prompt",

            // Icon files carry a version in their names: a new name makes
            // phones fetch the new home-screen icon instead of a cached one.
            includeAssets: [
                "favicon-v2.png",
                "icons/icon-192-v2.png",
                "icons/icon-512-v2.png",
                "icons/icon-maskable-512-v2.png",
                "icons/apple-touch-icon-v2.png"
            ],

            manifest: {
                // Stable app identity (same as the start URL)
                id: "/",

                name: "Workout Tracker",
                short_name: "Workout Tracker",

                description:
                    "Track workouts, exercises, sets and fitness progress.",

                // Matches the black logo, so the launch screen and the
                // icon look like one piece.
                theme_color: "#0b0b0b",
                background_color: "#0b0b0b",

                display: "standalone",
                orientation: "portrait-primary",

                start_url: "/",
                scope: "/",

                categories: ["health", "fitness", "lifestyle"],

                // Long-press the app icon on the phone for these shortcuts.
                shortcuts: [
                    {
                        name: "Start workout",
                        short_name: "Workout",
                        url: "/programs",
                        icons: [{ src: "/icons/icon-192-v2.png", sizes: "192x192", type: "image/png" }]
                    },
                    {
                        name: "Log weight",
                        short_name: "Weight",
                        url: "/body",
                        icons: [{ src: "/icons/icon-192-v2.png", sizes: "192x192", type: "image/png" }]
                    },
                    {
                        name: "Workout history",
                        short_name: "History",
                        url: "/workout-history",
                        icons: [{ src: "/icons/icon-192-v2.png", sizes: "192x192", type: "image/png" }]
                    }
                ],

                icons: [
                    {
                        src: "/icons/icon-192-v2.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: "/icons/icon-512-v2.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        // Logo shrunk into the safe zone so Android's
                        // round / squircle mask never cuts it off
                        src: "/icons/icon-maskable-512-v2.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable"
                    }
                ]
            },

            workbox: {
                // Remove caches left behind by older app versions.
                cleanupOutdatedCaches: true,

                runtimeCaching: [
                    {
                        urlPattern: ({ url }) =>
                            url.pathname.startsWith("/api/"),

                        handler: "NetworkOnly"
                    },
                    {
                        // Exercise pictures: cached after first view, so
                        // they show instantly and work offline.
                        urlPattern: ({ url }) =>
                            url.pathname.startsWith("/exercise-media/"),

                        handler: "CacheFirst",

                        options: {
                            cacheName: "exercise-media",
                            expiration: {
                                maxEntries: 300,
                                maxAgeSeconds: 60 * 60 * 24 * 180
                            }
                        }
                    }
                ]
            },

            devOptions: {
                enabled: false
            }
        })
    ],

    preview: {
        port: 4174,
        strictPort: true
    }
});
