// ==========================================
// WORKOUT OUTBOX - never lose a finished workout
// ==========================================
// A finished workout is first stored on the phone (localStorage), then
// sent to the server. If sending fails (no internet, server waking up,
// logged out) it stays here and is sent again automatically:
//   - when the app is opened or comes back to the screen
//   - when the phone goes back online
//   - every minute while something is waiting
//
// Each workout carries a clientId; the server returns the already saved
// workout if the same one arrives twice, so retries never duplicate it.

import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import { getUsername } from "../auth/session";

const STORAGE_KEY = "wt.pendingWorkouts";
const CHANGE_EVENT = "workoutTracker:outboxChanged";
const RETRY_EVERY_MS = 60 * 1000;

let runningSync = null;

// ---------- storage ----------

function readAll() {
    try {
        const list = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function writeAll(list) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
        // Storage full or blocked: nothing more we can do here.
    }

    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function updateEntry(clientId, changes) {
    writeAll(readAll().map((entry) =>
        entry.clientId === clientId ? { ...entry, ...changes } : entry
    ));
}

// Change a waiting workout before it is uploaded (e.g. add "feeling").
export function updatePendingPayload(clientId, changes) {
    const exists = readAll().some((entry) => entry.clientId === clientId);

    if (exists) {
        writeAll(readAll().map((entry) =>
            entry.clientId === clientId
                ? { ...entry, payload: { ...entry.payload, ...changes } }
                : entry
        ));
    }

    return exists;
}

export function removePendingWorkout(clientId) {
    writeAll(readAll().filter((entry) => entry.clientId !== clientId));
}

// ---------- queries ----------

// Waiting / failed workouts of the logged-in user (all users if logged out).
export function pendingWorkouts(owner = getUsername()) {
    const list = readAll();
    return owner ? list.filter((entry) => entry.owner === owner) : list;
}

export function isSyncing() {
    return runningSync !== null;
}

export function newClientId() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// ---------- upload ----------

/*
 * One attempt. retry = true for problems that fix themselves (network,
 * server asleep or busy, login expired); false when the server rejected
 * the workout itself (e.g. an exercise that was deleted).
 */
async function upload(entry) {
    try {
        const response = await api.post("/workout-sessions", entry.payload);
        return { ok: true, session: response.data };
    } catch (error) {
        const status = error.response?.status;
        const retry = !status || status >= 500 || [401, 408, 429].includes(status);

        return {
            ok: false,
            retry,
            message:
                error.response?.data?.message ||
                error.userMessage ||
                "The workout could not be uploaded."
        };
    }
}

function recordFailure(entry, result) {
    updateEntry(entry.clientId, {
        attempts: (entry.attempts || 0) + 1,
        lastTriedAt: Date.now(),
        error: result.message,
        status: result.retry ? "waiting" : "failed"
    });
}

/*
 * Save a finished workout: stored on the phone first, then uploaded.
 * Returns { status: "uploaded", session } | { status: "waiting" | "failed", message }.
 */
export async function saveWorkoutSafely(payload) {
    const entry = {
        clientId: payload.clientId || newClientId(),
        owner: getUsername(),
        queuedAt: Date.now(),
        attempts: 0,
        status: "waiting",
        error: null
    };
    entry.payload = { ...payload, clientId: entry.clientId };

    writeAll([...readAll().filter((item) => item.clientId !== entry.clientId), entry]);

    const result = await upload(entry);

    if (result.ok) {
        removePendingWorkout(entry.clientId);
        return { status: "uploaded", session: result.session };
    }

    recordFailure(entry, result);

    return { status: result.retry ? "waiting" : "failed", message: result.message };
}

/*
 * Upload the logged-in user's waiting workouts (and failed ones when
 * retryFailed is set). Only one run at a time.
 */
export function syncPendingWorkouts({ retryFailed = false } = {}) {
    if (runningSync) {
        return runningSync;
    }

    runningSync = (async () => {
        const owner = getUsername();

        if (!owner) return;

        const due = pendingWorkouts(owner).filter(
            (entry) => entry.status === "waiting" || retryFailed
        );

        for (const entry of due) {
            // Removed meanwhile (e.g. uploaded from another tab)?
            if (!readAll().some((item) => item.clientId === entry.clientId)) continue;

            const result = await upload(entry);

            if (result.ok) {
                removePendingWorkout(entry.clientId);
                continue;
            }

            recordFailure(entry, result);

            // Offline / server asleep: the rest would fail the same way.
            if (result.retry) break;
        }
    })().finally(() => {
        runningSync = null;
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    });

    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));

    return runningSync;
}

// Automatic retries while the app is open. Returns a cleanup function.
export function startBackgroundSync() {
    const trigger = () => {
        if (
            getUsername() &&
            pendingWorkouts().some((entry) => entry.status === "waiting")
        ) {
            syncPendingWorkouts();
        }
    };

    const onVisible = () => {
        if (document.visibilityState === "visible") trigger();
    };

    trigger();

    window.addEventListener("online", trigger);
    window.addEventListener("workoutTracker:sessionChanged", trigger);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(trigger, RETRY_EVERY_MS);

    return () => {
        window.removeEventListener("online", trigger);
        window.removeEventListener("workoutTracker:sessionChanged", trigger);
        document.removeEventListener("visibilitychange", onVisible);
        window.clearInterval(timer);
    };
}

// ---------- React ----------

// { pending: [...], syncing } for the logged-in user, kept up to date.
export function usePendingWorkouts() {
    const read = () => ({ pending: pendingWorkouts(), syncing: isSyncing() });
    const [state, setState] = useState(read);

    useEffect(() => {
        const update = () => setState(read());

        window.addEventListener(CHANGE_EVENT, update);
        window.addEventListener("storage", update);
        window.addEventListener("workoutTracker:sessionChanged", update);

        return () => {
            window.removeEventListener(CHANGE_EVENT, update);
            window.removeEventListener("storage", update);
            window.removeEventListener("workoutTracker:sessionChanged", update);
        };
    }, []);

    return state;
}
