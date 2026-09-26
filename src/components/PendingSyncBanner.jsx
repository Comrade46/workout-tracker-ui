import { Link } from "react-router-dom";
import { syncPendingWorkouts, usePendingWorkouts } from "../offline/workoutOutbox";
import "./Account.css";

function plural(count, word) {
    return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// "Saved on this phone, waiting to upload" notice with an Upload now button.
function PendingSyncBanner() {
    const { pending, syncing } = usePendingWorkouts();

    if (pending.length === 0) {
        return null;
    }

    const failed = pending.filter((entry) => entry.status === "failed").length;
    const waiting = pending.length - failed;

    return (
        <div className={`wt-sync-banner${failed && !waiting ? " failed" : ""}`} role="status">
            <span>
                {waiting > 0 && (
                    <>
                        ⏳ <strong>{plural(waiting, "workout")}</strong> saved on this phone,
                        waiting to upload. It appears here once uploaded.{" "}
                    </>
                )}
                {failed > 0 && (
                    <>
                        ⚠️ <strong>{plural(failed, "workout")}</strong> could not be uploaded.{" "}
                        <Link to="/profile" className="wt-acc-link">See Profile</Link>
                    </>
                )}
            </span>

            <button
                type="button"
                className="wt-acc-button small"
                onClick={() => syncPendingWorkouts({ retryFailed: true })}
                disabled={syncing}
            >
                {syncing ? "Uploading…" : "Upload now"}
            </button>
        </div>
    );
}

export default PendingSyncBanner;
