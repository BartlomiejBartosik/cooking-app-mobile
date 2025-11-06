import api from "./api";

export async function listFavorites(page = 0, size = 20, token) {
    const { data } = await api.get("/api/favorites", {
        params: { page, size },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data;
}

export async function getFavoriteIds(token) {
    const { data } = await api.get("/api/favorites/ids", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return Array.isArray(data) ? data : [];
}

export async function addFavorite(recipeId, token) {
    const { data } = await api.post(`/api/recipes/${recipeId}/favorite`, null, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return !!data?.favorite;
}

export async function removeFavorite(recipeId, token) {
    const { data } = await api.delete(`/api/recipes/${recipeId}/favorite`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return !data?.favorite;
}
