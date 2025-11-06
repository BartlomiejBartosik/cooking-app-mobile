import api from "./api";

const DEFAULT_SIZE = 20;

export async function searchByName(q, page = 0, size = DEFAULT_SIZE) {
    const { data } = await api.get("/api/recipes/search", { params: { q, page, size } });
    return data;
}

export async function searchByIngredients(csv, page = 0, size = DEFAULT_SIZE) {
    const normalized = csv
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .join(",");
    const { data } = await api.get("/api/recipes/search", {
        params: { ingredients: normalized, page, size }
    });
    return data;
}

export async function searchFromPantry(page = 0, size = DEFAULT_SIZE) {
    const { data } = await api.get("/api/recipes/search", {
        params: { inPantryOnly: true, page, size }
    });
    return data;
}

export async function fetchTopRecipes(page = 0, size = DEFAULT_SIZE) {
    const { data } = await api.get("/api/recipes", { params: { page, size } });
    return data;
}

export async function fetchRecipes(page = 0, size = DEFAULT_SIZE) {
    const { data } = await api.get("/api/recipes", { params: { page, size } });
    return data;
}
export async function getRecipeDetails(id) {
    const { data } = await api.get(`/api/recipes/${id}`);
    return data;
}
