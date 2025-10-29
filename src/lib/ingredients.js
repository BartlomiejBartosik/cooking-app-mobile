import api from "./api";

export async function searchIngredients(query, token) {
    if (!query || !query.trim()) return [];

    const { data } = await api.get("/api/ingredients", {
        params: { query },
        headers: token
            ? { Authorization: `Bearer ${token}` }
            : undefined,
    });

    return Array.isArray(data) ? data : [];
}