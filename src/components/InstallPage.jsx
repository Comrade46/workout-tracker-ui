import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import usePwa from "../pwa/usePwa";
import { promptInstall } from "../pwa/pwaManager";
import {
    INSTALL_GUIDES,
    INSTALL_GUIDE_ORDER,
    getShareUrl
} from "../pwa/installSteps";
import { APP_VERSION_LABEL } from "../config/appVersion";

// Public "Get the app" page (no login needed).

function InstallPage() {
    const { canInstall, isInstalled, platform } = usePwa();

    const [qrCode, setQrCode] = useState("");
    const [shareMessage, setShareMessage] = useState("");

    const shareUrl = getShareUrl();
    const myGuide = INSTALL_GUIDES[platform];

    useEffect(() => {
        let cancelled = false;

        // Loaded only on this page to keep the main app small.
        import("qrcode")
            .then(({ default: QRCode }) =>
                QRCode.toDataURL(shareUrl, {
                    width: 220,
                    margin: 1,
                    color: { dark: "#0f172a", light: "#ffffff" }
                })
            )
            .then((url) => {
                if (!cancelled) setQrCode(url);
            })
            .catch(() => {
                // QR code is optional; the link still works.
            });

        return () => {
            cancelled = true;
        };
    }, [shareUrl]);

    const shareWithFriend = async () => {
        const shareData = {
            title: "Workout Tracker",
            text: "Track your workouts with me - free app, install it from here:",
            url: shareUrl
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                return;
            }

            await navigator.clipboard.writeText(shareUrl);
            setShareMessage("Link copied - paste it in WhatsApp or anywhere.");
        } catch (error) {
            if (error?.name !== "AbortError") {
                setShareMessage(shareUrl);
            }
        }
    };

    return (
        <div className="wt-install-page">
            <style>
                {`
                    .wt-install-page {
                        min-height: calc(100vh - 70px);
                        padding: 32px 16px 48px;

                        background: var(--wt-page-background);
                        color: var(--wt-text-primary);
                    }

                    .wt-install-container {
                        max-width: 760px;
                        margin: 0 auto;

                        display: flex;
                        flex-direction: column;
                        gap: 18px;
                    }

                    .wt-install-hero {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }

                    .wt-install-hero img {
                        width: 72px;
                        height: 72px;
                        border-radius: 18px;
                        box-shadow: var(--wt-shadow-small);
                    }

                    .wt-install-hero h1 {
                        margin: 0;
                        font-size: 28px;
                    }

                    .wt-install-hero p {
                        margin: 4px 0 0;
                        color: var(--wt-text-secondary);
                        line-height: 1.5;
                    }

                    .wt-install-card {
                        padding: 20px;

                        border: 1px solid var(--wt-border);
                        border-radius: 16px;

                        background: var(--wt-surface);
                        box-shadow: var(--wt-shadow-small);
                    }

                    .wt-install-card h2 {
                        margin: 0 0 12px;
                        font-size: 18px;
                    }

                    .wt-install-card ol {
                        margin: 0;
                        padding-left: 22px;

                        display: flex;
                        flex-direction: column;
                        gap: 8px;

                        color: var(--wt-text-secondary);
                        line-height: 1.5;
                    }

                    .wt-install-primary {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;

                        min-height: 48px;
                        padding: 12px 22px;

                        border: none;
                        border-radius: 12px;

                        background: var(--wt-accent);
                        color: var(--wt-on-accent);

                        font-size: 16px;
                        font-weight: 700;
                        text-decoration: none;
                        cursor: pointer;
                    }

                    .wt-install-secondary {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;

                        min-height: 44px;
                        padding: 10px 18px;

                        border: 1px solid var(--wt-border);
                        border-radius: 12px;

                        background: var(--wt-surface);
                        color: var(--wt-text-primary);

                        font-size: 15px;
                        font-weight: 600;
                        text-decoration: none;
                        cursor: pointer;
                    }

                    .wt-install-status {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        gap: 12px;
                    }

                    .wt-install-status p {
                        margin: 0;
                        flex: 1 1 240px;
                        color: var(--wt-text-secondary);
                        line-height: 1.5;
                    }

                    .wt-install-share {
                        display: grid;
                        grid-template-columns: 1fr auto;
                        gap: 20px;
                        align-items: center;
                    }

                    .wt-install-share p {
                        margin: 0 0 14px;
                        color: var(--wt-text-secondary);
                        line-height: 1.5;
                    }

                    .wt-install-link {
                        display: block;
                        margin-top: 10px;

                        color: var(--wt-text-muted);
                        font-size: 13px;
                        word-break: break-all;
                    }

                    .wt-install-qr {
                        width: 180px;
                        height: 180px;
                        padding: 8px;

                        border-radius: 12px;
                        background: #ffffff;
                    }

                    .wt-install-qr img {
                        width: 100%;
                        height: 100%;
                        display: block;
                    }

                    .wt-install-devices details {
                        border-top: 1px solid var(--wt-border);
                        padding: 12px 0;
                    }

                    .wt-install-devices details:first-of-type {
                        border-top: none;
                        padding-top: 0;
                    }

                    .wt-install-devices summary {
                        cursor: pointer;
                        font-weight: 700;
                        color: var(--wt-text-primary);
                    }

                    .wt-install-devices ol {
                        margin-top: 10px;
                    }

                    .wt-install-footer {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: space-between;
                        gap: 12px;

                        color: var(--wt-text-muted);
                        font-size: 13px;
                    }

                    .wt-install-footer a {
                        color: var(--wt-accent);
                        font-weight: 600;
                        text-decoration: none;
                    }

                    @media (max-width: 560px) {
                        .wt-install-hero h1 {
                            font-size: 24px;
                        }

                        .wt-install-share {
                            grid-template-columns: 1fr;
                            justify-items: start;
                        }
                    }
                `}
            </style>

            <div className="wt-install-container">

                <div className="wt-install-hero">
                    <img src="/icons/icon-192.png" alt="" />

                    <div>
                        <h1>Get Workout Tracker</h1>
                        <p>
                            Free workout tracker for Android, iPhone,
                            Windows and Mac. Install it in a few seconds,
                            with no app store needed.
                        </p>
                    </div>
                </div>

                {/* ---------- Status / one-tap install ---------- */}

                <div className="wt-install-card wt-install-status">
                    {isInstalled ? (
                        <>
                            <p>✅ You are using the installed app.</p>

                            <Link to="/dashboard" className="wt-install-primary">
                                Open Workout Tracker
                            </Link>
                        </>
                    ) : canInstall ? (
                        <>
                            <p>Your browser can install the app with one tap.</p>

                            <button
                                type="button"
                                className="wt-install-primary"
                                onClick={promptInstall}
                            >
                                📲 Install app
                            </button>
                        </>
                    ) : (
                        <p>
                            Follow the steps for your device below. After
                            installing, open Workout Tracker from your
                            home screen like any other app.
                        </p>
                    )}
                </div>

                {/* ---------- Steps for this device ---------- */}

                {!isInstalled && myGuide && (
                    <div className="wt-install-card">
                        <h2>
                            {myGuide.icon} Your device: {myGuide.title}
                        </h2>

                        <ol>
                            {myGuide.steps.map((step) => (
                                <li key={step}>{step}</li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* ---------- Share with friends ---------- */}

                <div className="wt-install-card wt-install-share">
                    <div>
                        <h2>👥 Share with a friend</h2>

                        <p>
                            Send this link, or let them scan the QR code
                            with their phone camera.
                        </p>

                        <button
                            type="button"
                            className="wt-install-secondary"
                            onClick={shareWithFriend}
                        >
                            🔗 Share link
                        </button>

                        <span className="wt-install-link">
                            {shareMessage || shareUrl}
                        </span>
                    </div>

                    <div className="wt-install-qr" aria-label="QR code for the install link">
                        {qrCode && <img src={qrCode} alt="QR code to install Workout Tracker" />}
                    </div>
                </div>

                {/* ---------- All devices ---------- */}

                <div className="wt-install-card wt-install-devices">
                    <h2>📱 Other devices</h2>

                    {INSTALL_GUIDE_ORDER.filter((key) => key !== platform).map((key) => {
                        const guide = INSTALL_GUIDES[key];

                        return (
                            <details key={key}>
                                <summary>
                                    {guide.icon} {guide.title}
                                </summary>

                                <ol>
                                    {guide.steps.map((step) => (
                                        <li key={step}>{step}</li>
                                    ))}
                                </ol>
                            </details>
                        );
                    })}
                </div>

                <div className="wt-install-footer">
                    <span>{APP_VERSION_LABEL} · updates install automatically</span>

                    <span>
                        <Link to="/login">Log in</Link>
                        {" · "}
                        <Link to="/register">Create an account</Link>
                    </span>
                </div>

            </div>
        </div>
    );
}

export default InstallPage;
