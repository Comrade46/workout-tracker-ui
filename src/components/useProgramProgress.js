import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import { completedProgramDays } from "../data/programs";

// Completed program days for the logged-in user, read from saved workouts.
// Returns { done: { "programId:dayKey": count }, loading }.
export default function useProgramProgress() {
    const [done, setDone] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        api.get("/workout-sessions")
            .then((response) => {
                if (!cancelled) {
                    setDone(completedProgramDays(response.data));
                }
            })
            .catch(() => {
                // Progress is optional - programs still work without it.
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { done, loading };
}

export function countDone(done, program) {
    return program.days.filter(
        (day) => !day.rest && done[`${program.id}:${day.key}`]
    ).length;
}

export function nextDay(done, program) {
    return (
        program.days.find(
            (day) => !day.rest && !done[`${program.id}:${day.key}`]
        ) || null
    );
}
