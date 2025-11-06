import api from "./api";

export async function searchIngredients(query, token, signal) {
    if (!query || !query.trim()) return [];

    const { data } = await api.get("/api/ingredients", {
        params: { query },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal,
    });

    return Array.isArray(data) ? data : [];
}
