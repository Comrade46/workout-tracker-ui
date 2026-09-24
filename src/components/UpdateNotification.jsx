import { useEffect, useState } from "react";
import { APP_VERSION } from "../config/appVersion";

function compareVersions(current, latest) {
    const currentParts = current.split(".").map(Number);
    const latestParts = latest.split(".").map(Number);

    const length = Math.max(
        currentParts.length,
        latestParts.length
    );

    for (let i = 0; i < length; i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;

        if (latestPart > currentPart) {
            return 1;
        }

        if (latestPart < currentPart) {
            return -1;
        }
    }

    return 0;
}


export default function UpdateNotification() {

    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [latestVersion, setLatestVersion] = useState("");
    const [updateMessage, setUpdateMessage] = useState("");
    const [updating, setUpdating] = useState(false);


    useEffect(() => {

        const checkForUpdate = async () => {

            try {

                const response = await fetch(
                    `/version.json?t=${Date.now()}`,
                    {
                        cache: "no-store"
                    }
                );


                if (!response.ok) {
                    return;
                }


                const data = await response.json();


                if (!data.version) {
                    return;
                }


                const comparison = compareVersions(
                    APP_VERSION,
                    data.version
                );


                if (comparison > 0) {

                    setLatestVersion(data.version);

                    setUpdateMessage(
                        data.message ||
                        "A new version of Workout Tracker is available."
                    );

                    setUpdateAvailable(true);
                }

            } catch (error) {

                console.log(
                    "Unable to check for application updates.",
                    error
                );

            }

        };


        checkForUpdate();

    }, []);


    if (!updateAvailable) {
        return null;
    }


    const refreshApplication = async () => {

        setUpdating(true);


        try {

            // Ask the active service worker to check for
            // a newer application version.
            if ("serviceWorker" in navigator) {

                const registration =
                    await navigator.serviceWorker.getRegistration();

                if (registration) {
                    await registration.update();
                }
            }

        } catch (error) {

            console.log(
                "Service worker update check failed.",
                error
            );

        } finally {

            // Reload the application after the update check.
            window.location.reload();

        }
    };


    return (

        <div className="update-notification">

            <div className="update-notification-content">

                <div>

                    <strong>
                        New version available
                    </strong>

                    <p>
                        {updateMessage}
                    </p>

                    <small>
                        Version {latestVersion} is available.
                    </small>

                </div>


                <button
                    type="button"
                    onClick={refreshApplication}
                    disabled={updating}
                >
                    {updating ? "Updating..." : "Update"}
                </button>

            </div>

        </div>

    );
}