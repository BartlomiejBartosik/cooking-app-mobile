import api from "./api";

export async function fetchPantry(token) {
    const { data } = await api.get("/api/pantry", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return data;
}

export async function updatePantryItem(token, ingredientId, amount) {
    const { data } = await api.post(
        "/api/pantry",
        { ingredientId, amount },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return data;
}

export async function deletePantryItem(token, pantryItemId) {
    await api.delete(`/api/pantry/${pantryItemId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}
