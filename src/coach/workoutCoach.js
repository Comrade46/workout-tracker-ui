// ==========================================
// WORKOUT COACH: voice, beeps, vibration, screen awake
// ==========================================
// Uses only built-in browser features (no cost, works offline):
//   - speechSynthesis    -> voice coach ("Plank Hold, 30 seconds")
//   - Web Audio          -> countdown beeps
//   - navigator.vibrate  -> buzz on phones when a timer ends
//   - Screen Wake Lock   -> screen stays on during a workout
//
// Every feature silently does nothing where the browser lacks it.

const SOUND_STORAGE_KEY = "workoutTrackerCoachSound";

let audioContext = null;
let englishVoice = null;

// ------------------------------------------
// Sound on / off (remembered on this device)
// ------------------------------------------

export function isSoundOn() {
    try {
        return localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
    } catch {
        return true;
    }
}

export function setSoundOn(on) {
    try {
        localStorage.setItem(SOUND_STORAGE_KEY, on ? "on" : "off");
    } catch {
        // Ignore storage errors.
    }

    if (!on) {
        window.speechSynthesis?.cancel();
    }
}

// ------------------------------------------
// Unlock audio: phones only allow sound after a tap, so call this
// from a button click (e.g. Start).
// ------------------------------------------

export function unlockAudio() {
    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (AudioContextClass && !audioContext) {
            audioContext = new AudioContextClass();
        }

        audioContext?.resume?.();

        // iOS needs one utterance inside a user gesture before it will
        // speak later from timers.
        if (window.speechSynthesis && !englishVoice) {
            const warmUp = new SpeechSynthesisUtterance("");
            warmUp.volume = 0;
            window.speechSynthesis.speak(warmUp);
        }
    } catch {
        // Audio not available.
    }
}

function pickEnglishVoice() {
    const voices = window.speechSynthesis?.getVoices?.() || [];

    return (
        voices.find((voice) => /^en(-|_)IN/i.test(voice.lang)) ||
        voices.find((voice) => /^en(-|_)(US|GB)/i.test(voice.lang)) ||
        voices.find((voice) => /^en/i.test(voice.lang)) ||
        null
    );
}

if (typeof window !== "undefined" && window.speechSynthesis) {
    englishVoice = pickEnglishVoice();
    window.speechSynthesis.addEventListener?.("voiceschanged", () => {
        englishVoice = pickEnglishVoice();
    });
}

// ------------------------------------------
// Voice
// ------------------------------------------

export function speak(text) {
    if (!isSoundOn() || !window.speechSynthesis || !text) {
        return;
    }

    try {
        // Newest message wins, so the coach never lags behind.
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        if (englishVoice) {
            utterance.voice = englishVoice;
            utterance.lang = englishVoice.lang;
        }

        utterance.rate = 1;
        utterance.pitch = 1;

        window.speechSynthesis.speak(utterance);
    } catch {
        // Speech not available.
    }
}

// ------------------------------------------
// Beeps and vibration
// ------------------------------------------

export function beep({ frequency = 880, durationMs = 150 } = {}) {
    if (!isSoundOn() || !audioContext) {
        return;
    }

    try {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;

        const now = audioContext.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + durationMs / 1000 + 0.02);
    } catch {
        // Audio not available.
    }
}

export function vibrate(pattern) {
    try {
        navigator.vibrate?.(pattern);
    } catch {
        // Vibration not available.
    }
}

// ------------------------------------------
// Keep the screen on
// ------------------------------------------

let wakeLock = null;
let wantWakeLock = false;

async function requestWakeLock() {
    if (!("wakeLock" in navigator) || wakeLock) {
        return;
    }

    try {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => {
            wakeLock = null;
        });
    } catch {
        // Denied (e.g. battery saver) - the workout still works.
    }
}

// The browser drops the lock when the app goes to the background;
// take it again when the user comes back.
if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
        if (wantWakeLock && document.visibilityState === "visible") {
            requestWakeLock();
        }
    });
}

export function keepScreenOn(on) {
    wantWakeLock = on;

    if (on) {
        requestWakeLock();
    } else if (wakeLock) {
        wakeLock.release().catch(() => {});
        wakeLock = null;
    }
}

// ------------------------------------------
// Phrases
// ------------------------------------------

export function describeTarget(trackingType, targetValue, targetSets) {
    const target =
        trackingType === "TIME"
            ? `${targetValue} seconds`
            : `${targetValue} reps`;

    return targetSets > 1
        ? `${targetSets} sets of ${target}`
        : target;
}
