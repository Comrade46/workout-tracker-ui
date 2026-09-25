import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),

        VitePWA({
            registerType: "autoUpdate",

            includeAssets: [
                "favicon.png",
                "icons/icon-192.png",
                "icons/icon-512.png"
            ],

            manifest: {
                name: "Workout Tracker",
                short_name: "Workout Tracker",

                description:
                    "Track workouts, exercises, sets and fitness progress.",

                theme_color: "#2563eb",
                background_color: "#0f172a",

                display: "standalone",
                orientation: "portrait-primary",

                start_url: "/",
                scope: "/",

                icons: [
                    {
                        src: "/icons/icon-192.png",
                        sizes: "192x192",
                        type: "image/png"
                    },
                    {
                        src: "/icons/icon-512.png",
                        sizes: "512x512",
                        type: "image/png"
                    },
                    {
                        src: "/icons/icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable"
                    }
                ]
            },

            workbox: {
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) =>
                            url.pathname.startsWith("/api/"),

                        handler: "NetworkOnly"
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