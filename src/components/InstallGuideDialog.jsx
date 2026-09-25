import { useEffect } from "react";
import { Link } from "react-router-dom";
import { INSTALL_GUIDES } from "../pwa/installSteps";

// Small popup with install steps for the current device. Used where the
// browser has no one-tap install (iPhone, Safari, Firefox).
function InstallGuideDialog({ platform, onClose }) {
    const guide =
        INSTALL_GUIDES[platform] || INSTALL_GUIDES["desktop-chromium"];

    useEffect(() => {
        const handleKey = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKey);

        return () => document.removeEventListener("keydown", handleKey);
    }, [onClose]);

    return (
        <>
            <style>
                {`
                    .wt-install-overlay {
                        position: fixed;
                        inset: 0;
                        z-index: 2000;

                        display: flex;
                        align-items: center;
                        justify-content: center;

                        padding: 16px;

                        background: rgba(0, 0, 0, 0.55);
                    }

                    .wt-install-dialog {
                        width: min(420px, 100%);
                        max-height: calc(100vh - 32px);
                        overflow-y: auto;

                        padding: 22px;

                        border: 1px solid var(--wt-border);
                        border-radius: 16px;

                        background: var(--wt-surface);
                        color: var(--wt-text-primary);
                        box-shadow: var(--wt-shadow);
                    }

                    .wt-install-dialog h2 {
                        margin: 0 0 4px;
                        font-size: 20px;
                    }

                    .wt-install-dialog .wt-install-device {
                        margin: 0 0 16px;
                        color: var(--wt-text-muted);
                        font-size: 14px;
                        font-weight: 600;
                    }

                    .wt-install-dialog ol {
                        margin: 0;
                        padding-left: 22px;

                        display: flex;
                        flex-direction: column;
                        gap: 10px;

                        color: var(--wt-text-secondary);
                        font-size: 15px;
                        line-height: 1.5;
                    }

                    .wt-install-dialog-actions {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;

                        margin-top: 20px;
                        padding-top: 16px;

                        border-top: 1px solid var(--wt-border);
                    }

                    .wt-install-dialog-actions a {
                        color: var(--wt-accent);
                        font-weight: 600;
                        text-decoration: none;
                        font-size: 14px;
                    }

                    .wt-install-dialog-close {
                        padding: 10px 18px;

                        border: none;
                        border-radius: 10px;

                        background: var(--wt-button-background);
                        color: var(--wt-button-text);

                        font-weight: 700;
                        cursor: pointer;
                    }
                `}
            </style>

            <div
                className="wt-install-overlay"
                onClick={onClose}
            >
                <div
                    className="wt-install-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="wt-install-title"
                    onClick={(event) => event.stopPropagation()}
                >
                    <h2 id="wt-install-title">
                        📲 Install Workout Tracker
                    </h2>

                    <p className="wt-install-device">
                        {guide.icon} {guide.title}
                    </p>

                    <ol>
                        {guide.steps.map((step) => (
                            <li key={step}>{step}</li>
                        ))}
                    </ol>

                    <div className="wt-install-dialog-actions">
                        <Link to="/install" onClick={onClose}>
                            Other devices →
                        </Link>

                        <button
                            type="button"
                            className="wt-install-dialog-close"
                            onClick={onClose}
                            autoFocus
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default InstallGuideDialog;
