import usePwa from "../pwa/usePwa";
import { applyUpdate, promptInstall } from "../pwa/pwaManager";

// Compact 📲 Install / 🔄 Update icons for the Navbar.
// Each icon only appears when that action is actually available.
function PwaActions() {
    const {
        canInstall,
        isInstalled,
        updateAvailable,
        latestVersion,
        updating
    } = usePwa();

    const showInstall = canInstall && !isInstalled;

    if (!showInstall && !updateAvailable) {
        return null;
    }

    const updateLabel = latestVersion
        ? `Update to version ${latestVersion}`
        : "Update available";

    return (
        <>
            <style>
                {`
                    .wt-pwa-actions {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .wt-pwa-button {
                        position: relative;

                        width: 40px;
                        height: 40px;
                        min-height: 0;

                        padding: 0;

                        display: inline-flex;
                        align-items: center;
                        justify-content: center;

                        border: 1px solid var(--wt-border);
                        border-radius: 9px;

                        background: var(--wt-surface);
                        color: var(--wt-text-primary);

                        font-size: 18px;
                        line-height: 1;

                        cursor: pointer;

                        transition:
                            background-color 0.2s ease,
                            border-color 0.2s ease;
                    }

                    .wt-pwa-button:hover {
                        background: var(--wt-surface-tertiary);
                        border-color: var(--wt-border-strong);
                    }

                    .wt-pwa-button:disabled {
                        cursor: progress;
                        opacity: 0.7;
                    }

                    .wt-pwa-button.update {
                        border-color: var(--wt-accent);
                        background: var(--wt-accent-soft);
                    }

                    /* Small dot so the update is noticeable without a banner */
                    .wt-pwa-button.update::after {
                        content: "";

                        position: absolute;
                        top: -3px;
                        right: -3px;

                        width: 10px;
                        height: 10px;

                        border-radius: 50%;

                        background: var(--wt-accent);
                        border: 2px solid var(--wt-surface);
                    }

                    .wt-pwa-button.updating .wt-pwa-icon {
                        display: inline-block;
                        animation: wtPwaSpin 1s linear infinite;
                    }

                    @keyframes wtPwaSpin {
                        to {
                            transform: rotate(360deg);
                        }
                    }

                    @media (max-width: 768px) {
                        .wt-pwa-actions {
                            gap: 6px;
                        }

                        /* Same size as the ☰ menu button */
                        .wt-pwa-button {
                            width: 42px;
                            height: 42px;
                            font-size: 18px;
                        }
                    }

                    @media (max-width: 420px) {
                        .wt-pwa-button {
                            width: 38px;
                            height: 38px;
                            font-size: 16px;
                        }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        .wt-pwa-button.updating .wt-pwa-icon {
                            animation: none;
                        }
                    }
                `}
            </style>

            <div className="wt-pwa-actions">
                {showInstall && (
                    <button
                        type="button"
                        className="wt-pwa-button"
                        onClick={promptInstall}
                        title="Install Workout Tracker"
                        aria-label="Install Workout Tracker app"
                    >
                        <span className="wt-pwa-icon" aria-hidden="true">
                            📲
                        </span>
                    </button>
                )}

                {updateAvailable && (
                    <button
                        type="button"
                        className={`wt-pwa-button update ${updating ? "updating" : ""}`}
                        onClick={applyUpdate}
                        disabled={updating}
                        title={updating ? "Updating..." : updateLabel}
                        aria-label={updating ? "Updating application" : updateLabel}
                    >
                        <span className="wt-pwa-icon" aria-hidden="true">
                            🔄
                        </span>
                    </button>
                )}
            </div>
        </>
    );
}

export default PwaActions;
