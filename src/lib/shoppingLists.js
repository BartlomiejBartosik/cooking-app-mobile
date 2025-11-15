import api from "./api";

export async function listShoppingLists(token) {
    const res = await api.get("/api/shopping-lists", {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    return [];
}


export async function getShoppingList(listId, token) {
    const res = await api.get(`/api/shopping-lists/${listId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
}


export async function createShoppingList(name, token) {
    const body = name ? { name } : {};
    const res = await api.post("/api/shopping-lists", body, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
}


export async function addShoppingListItem(listId, payload, token) {
    const res = await api.post(
        `/api/shopping-lists/${listId}/items`,
        payload,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    const data = res.data;


    if (data && Array.isArray(data.items)) {
        let last = data.items[0] || null;
        for (const it of data.items) {
            if (!last || (it.id != null && it.id > (last.id ?? -1))) {
                last = it;
            }
        }
        return last;
    }

    return data;
}


export async function updateShoppingListItem(listId, itemId, payload, token) {
    const res = await api.put(
        `/api/shopping-lists/${listId}/items/${itemId}`,
        payload,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    return res.data;
}


export async function deleteShoppingListItem(listId, itemId, token) {
    await api.delete(`/api/shopping-lists/${listId}/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}
export async function finalizeShoppingList(listId, addToPantry, token) {
    const res = await api.post(
        `/api/shopping-lists/${listId}/finalize`,
        {},
        {
            headers: { Authorization: `Bearer ${token}` },
            params: { addToPantry: !!addToPantry },
        }
    );
    return res.data;
}
export async function addRecipeIngredientsToList(listId, ingredients, token) {
    if (!listId || !token) return;
    if (!Array.isArray(ingredients) || ingredients.length === 0) return;

    let list;
    try {
        list = await getShoppingList(listId, token);
    } catch (e) {
        console.log(
            "addRecipeIngredientsToList: getShoppingList error",
            e?.response?.data || e.message
        );
        list = {};
    }

    let items = Array.isArray(list.items) ? [...list.items] : [];

    const normalize = (ing) => {
        const name =
            (ing.ingredientName || ing.name || "").trim();
        if (!name) return null;

        const unit = (ing.unit || ing.ingredientUnit || "szt")
            .trim();
        const amountRaw =
            typeof ing.amount === "number"
                ? ing.amount
                : parseFloat(
                    String(ing.amount ?? "1").replace(",", ".")
                );
        const amount = !isNaN(amountRaw) && amountRaw > 0 ? amountRaw : 1;

        const ingredientId = ing.ingredientId ?? ing.id ?? null;

        return {
            ingredientId,
            name,
            unit,
            amount,
        };
    };

    const findExisting = (ni) => {
        return (
            items.find((it) => {
                const itemIngId =
                    it.ingredientId ?? it.ingredient?.id ?? null;
                const itemName = (
                    it.name ||
                    it.ingredientName ||
                    it.ingredient?.name ||
                    ""
                )
                    .trim()
                    .toLowerCase();
                const itemUnit = (
                    it.unit ||
                    it.ingredientUnit ||
                    it.ingredient?.unit ||
                    ""
                )
                    .trim()
                    .toLowerCase();

                if (
                    ni.ingredientId &&
                    itemIngId &&
                    ni.ingredientId === itemIngId
                ) {
                    return true;
                }

                return (
                    ni.name.toLowerCase() === itemName &&
                    ni.unit.toLowerCase() === itemUnit
                );
            }) || null
        );
    };

    for (const raw of ingredients) {
        const ni = normalize(raw);
        if (!ni) continue;

        const existing = findExisting(ni);

        if (existing) {
            const current = Number(existing.amount ?? 0) || 0;
            const newAmount = current + ni.amount;

            try {
                const updated = await updateShoppingListItem(
                    listId,
                    existing.id,
                    { amount: newAmount },
                    token
                );

                items = items.map((it) =>
                    it.id === updated.id ? updated : it
                );
            } catch (e) {
                console.log(
                    "addRecipeIngredientsToList: update error",
                    e?.response?.data || e.message
                );
            }
        } else {
            try {
                const created = await addShoppingListItem(
                    listId,
                    {
                        ingredientId: ni.ingredientId,
                        name: ni.name,
                        unit: ni.unit,
                        amount: ni.amount,
                    },
                    token
                );
                if (created) {
                    items.push(created);
                }
            } catch (e) {
                console.log(
                    "addRecipeIngredientsToList: add error",
                    e?.response?.data || e.message
                );
            }
        }
    }
    return items;
}
export async function renameShoppingList(id, name, token) {
    const res = await api.patch(
        `/api/shopping-lists/${id}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
}

