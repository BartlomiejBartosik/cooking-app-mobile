import { getFavoriteIds, addFavorite, removeFavorite } from "./favorites";

let ids = new Set();
let hydrating = false;
const listeners = new Set();   

function emit() {
    listeners.forEach((fn) => {
        try { fn(); } catch {}
    });
}

export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getIdsSnapshot() {
    return ids;
}

export async function hydrateFavorites(token) {
    if (!token || hydrating) return;
    hydrating = true;
    try {
        const list = await getFavoriteIds(token);
        ids = new Set((list || []).map(Number));
        emit();
    } finally {
        hydrating = false;
    }
}

export function isFavorite(id) {
    return ids.has(Number(id));
}

export async function toggleFavorite(id, token) {
    id = Number(id);
    const shouldAdd = !ids.has(id);

    if (shouldAdd) ids.add(id);
    else ids.delete(id);
    emit();

    try {
        if (shouldAdd) await addFavorite(id, token);
        else await removeFavorite(id, token);
    } catch (e) {
        if (shouldAdd) ids.delete(id);
        else ids.add(id);
        emit();
        throw e;
    }
}
