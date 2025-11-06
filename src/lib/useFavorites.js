import { useEffect, useState, useCallback } from "react";
import { useUserContext } from "../context/UserContext";
import {
    subscribe,
    getIdsSnapshot,
    hydrateFavorites,
    isFavorite as storeIsFavorite,
    toggleFavorite as storeToggleFavorite,
} from "./favoritesStore";

export function useFavorites() {
    const { token } = useUserContext();
    const [version, setVersion] = useState(0);

    useEffect(() => {
        const unsub = subscribe(() => setVersion((v) => v + 1));
        return unsub;
    }, []);

    useEffect(() => {
        if (token) hydrateFavorites(token);
    }, [token]);

    const favoriteIds = getIdsSnapshot();

    const isFavorite = useCallback((id) => storeIsFavorite(id), []);
    const toggle = useCallback((id) => storeToggleFavorite(id, token), [token]);

    return { favoriteIds, version, isFavorite, toggle };
}
