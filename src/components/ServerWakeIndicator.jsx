import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "../api/serverStatus";

// Small pill shown while a request is unusually slow, typically because
// the free-plan backend is waking up. Hidden the rest of the time.
function ServerWakeIndicator() {
    const { slowRequests } = useSyncExternalStore(subscribe, getSnapshot);

    if (slowRequests === 0) {
        return null;
    }

    return (
        <>
            <style>
                {`
                    .wt-server-wake {
                        position: fixed;
                        left: 50%;
                        bottom: 20px;
                        transform: translateX(-50%);
                        z-index: 1100;

                        max-width: calc(100vw - 32px);

                        display: flex;
                        align-items: center;
                        gap: 10px;

                        padding: 10px 16px;

                        border: 1px solid var(--wt-border);
                        border-radius: 999px;

                        background: var(--wt-surface);
                        color: var(--wt-text-primary);
                        box-shadow: var(--wt-shadow);

                        font-size: 13px;
                        font-weight: 600;
                        line-height: 1.35;
                    }

                    .wt-server-wake-spinner {
                        flex-shrink: 0;

                        width: 16px;
                        height: 16px;

                        border: 2px solid var(--wt-border-strong);
                        border-top-color: var(--wt-accent);
                        border-radius: 50%;

                        animation: wtServerWakeSpin 0.9s linear infinite;
                    }

                    .wt-server-wake small {
                        display: block;
                        color: var(--wt-text-muted);
                        font-weight: 500;
                    }

                    @keyframes wtServerWakeSpin {
                        to {
                            transform: rotate(360deg);
                        }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        .wt-server-wake-spinner {
                            animation: none;
                        }
                    }
                `}
            </style>

            <div
                className="wt-server-wake"
                role="status"
                aria-live="polite"
            >
                <span
                    className="wt-server-wake-spinner"
                    aria-hidden="true"
                />

                <span>
                    Waking up the server…
                    <small>
                        First load after a break can take up to 2 minutes.
                    </small>
                </span>
            </div>
        </>
    );
}

export default ServerWakeIndicator;
