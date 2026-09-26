import { useCallback, useEffect, useState } from "react";
import api from "../api/axiosConfig";
import { latestWeight, rememberWeight } from "./motivation";

const EMPTY_PROFILE = { heightCm: null, weeklyGoal: null, fitnessGoal: null, targetWeightKg: null };

/*
 * Body stats, goals and the weight log of the logged-in user.
 * { profile, weights (oldest first), loading, error, saveWeight, deleteWeight, saveProfile }
 */
export default function useBody() {
    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [weights, setWeights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        api.get("/users/me/body")
            .then((response) => {
                if (cancelled) return;

                const list = response.data?.weights || [];
                setProfile({ ...EMPTY_PROFILE, ...(response.data?.profile || {}) });
                setWeights(list);
                rememberWeight(latestWeight(list)?.weightKg);
            })
            .catch((requestError) => {
                if (!cancelled) setError(requestError.userMessage || "Body data could not be loaded.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Adds or replaces the reading for that date; keeps the list sorted.
    const saveWeight = useCallback(async (date, weightKg) => {
        const response = await api.put("/users/me/body/weights", { date, weightKg });
        const saved = response.data;

        setWeights((list) => {
            const next = [...list.filter((entry) => entry.date !== saved.date), saved]
                .sort((a, b) => a.date.localeCompare(b.date));
            rememberWeight(latestWeight(next)?.weightKg);
            return next;
        });

        return saved;
    }, []);

    const deleteWeight = useCallback(async (id) => {
        await api.delete(`/users/me/body/weights/${id}`);
        setWeights((list) => list.filter((entry) => entry.id !== id));
    }, []);

    const saveProfile = useCallback(async (changes) => {
        const response = await api.put("/users/me/body/profile", changes);
        setProfile({ ...EMPTY_PROFILE, ...response.data });
        return response.data;
    }, []);

    return { profile, weights, loading, error, saveWeight, deleteWeight, saveProfile };
}
