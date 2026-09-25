import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "./pwaManager";

// Current PWA state: { canInstall, isInstalled, updateAvailable, latestVersion, updating }
export default function usePwa() {
    return useSyncExternalStore(subscribe, getSnapshot);
}
