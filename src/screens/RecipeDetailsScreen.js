// screens/RecipeDetailsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    Pressable,
} from "react-native";
import { useUserContext } from "../context/UserContext";
import { getRecipeDetails } from "../lib/recipes";
import { fetchPantry } from "../lib/pantry";
import {
    listShoppingLists,
    createShoppingList,
    addRecipeIngredientsToList,
} from "../lib/shoppingLists";

export default function RecipeDetailsScreen({ route, navigation }) {
    const { id } = route.params || {};
    const { token } = useUserContext();

    const [loading, setLoading] = useState(true);
    const [recipe, setRecipe] = useState(null);
    const [pantry, setPantry] = useState([]);

    // bottom sheet 1: wybór trybu + istniejąca / nowa
    const [listChoiceVisible, setListChoiceVisible] = useState(false);
    const [pendingMode, setPendingMode] = useState(null); // "all" | "missing"

    // bottom sheet 2: wybór konkretnej istniejącej listy
    const [listSelectVisible, setListSelectVisible] = useState(false);
    const [availableLists, setAvailableLists] = useState([]);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);
                const r = await getRecipeDetails(id);
                let p = [];
                if (token) p = await fetchPantry(token);
                if (!mounted) return;
                setRecipe(r);
                setPantry(Array.isArray(p) ? p : []);
            } catch (e) {
                console.log("RecipeDetails error:", e?.response?.data || e.message);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [id, token]);

    const pantryIndex = useMemo(() => {
        const byId = new Map();
        const byName = new Map();
        for (const item of pantry) {
            if (item.ingredientId != null) {
                byId.set(String(item.ingredientId), item);
            }
            if (item.name) {
                byName.set(item.name.trim().toLowerCase(), item);
            }
        }
        return { byId, byName };
    }, [pantry]);

    const getStatus = (line) => {
        if (!token) return "neutral";

        const nameKey = String(line.ingredientName || "")
            .trim()
            .toLowerCase();

        const hit =
            pantryIndex.byId.get(String(line.ingredientId)) ||
            pantryIndex.byName.get(nameKey);

        if (!hit) return "missing";

        const lineUnit = line.unit || "szt";
        const pantryUnit = hit.ingredientUnit || "szt";

        if (lineUnit !== pantryUnit) return "partial";

        const need = Number(line.amount ?? 0);
        const have = Number(hit.amount ?? 0);

        if (Number.isFinite(need) && Number.isFinite(have)) {
            if (have >= need) return "ok";
            if (have > 0 && have < need) return "partial";
        }

        return "missing";
    };

    const renderIngredient = ({ item }) => {
        const status = getStatus(item);

        let badgeStyle = styles.badgeNeutral;
        let textStyle = styles.ingText;

        if (status === "ok") {
            badgeStyle = styles.badgeOk;
            textStyle = styles.ingTextStrong;
        } else if (status === "partial") {
            badgeStyle = styles.badgePartial;
            textStyle = styles.ingTextStrong;
        } else if (status === "missing") {
            badgeStyle = styles.badgeMissing;
            textStyle = styles.ingTextStrong;
        }

        return (
            <View style={[styles.ingRow, badgeStyle]}>
                <Text style={textStyle} numberOfLines={2}>
                    {item.ingredientName}
                    {item.amount != null && item.unit
                        ? ` — ${item.amount} ${item.unit}`
                        : item.amount != null
                            ? ` — ${item.amount}`
                            : ""}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        );
    }

    if (!recipe) {
        return (
            <View style={styles.center}>
                <Text>Nie znaleziono przepisu.</Text>
            </View>
        );
    }

    const avg =
        typeof recipe.avgRating === "number"
            ? (recipe.avgRating.toFixed
                ? recipe.avgRating.toFixed(1)
                : recipe.avgRating)
            : null;

    // ---------- SHOPPING LIST LOGIC ----------

    const requireAuth = () => {
        if (token) return true;
        Alert.alert(
            "Zaloguj się",
            "Listy zakupów są dostępne po zalogowaniu.",
            [
                { text: "Anuluj", style: "cancel" },
                {
                    text: "Przejdź do logowania",
                    onPress: () => navigation.navigate("LoginScreen"),
                },
            ]
        );
        return false;
    };

    const resolveIngredients = (missingOnly) => {
        const all = recipe.ingredients || [];
        if (!missingOnly) return all;
        return all.filter((line) => getStatus(line) === "missing");
    };

    const openListChoice = (missingOnly) => {
        if (!requireAuth()) return;

        const items = resolveIngredients(missingOnly);
        if (!items.length) {
            Alert.alert(
                "Nic do dodania",
                missingOnly
                    ? "Masz już wszystkie składniki z przepisu."
                    : "Brak składników w tym przepisie."
            );
            return;
        }

        setPendingMode(missingOnly ? "missing" : "all");
        setListChoiceVisible(true);
    };

    const handleAddAll = () => openListChoice(false);
    const handleAddMissing = () => openListChoice(true);

    const addToNewList = async () => {
        const missingOnly = pendingMode === "missing";
        try {
            const items = resolveIngredients(missingOnly);
            if (!items.length) {
                setListChoiceVisible(false);
                setListSelectVisible(false);
                return;
            }

            const baseName = `${recipe.title} — zakupy`;
            const list = await createShoppingList(baseName, token);
            await addRecipeIngredientsToList(list.id, items, token);

            setListChoiceVisible(false);
            setListSelectVisible(false);

            Alert.alert(
                "Dodano",
                `Składniki dodane do nowej listy "${list.name || baseName}".`,
                [
                    {
                        text: "Otwórz listę",
                        onPress: () =>
                            navigation.navigate("ShoppingListDetailsScreen", {
                                listId: list.id,
                                title: list.name || baseName,
                            }),
                    },
                    { text: "OK" },
                ]
            );
        } catch (e) {
            console.log("addToNewList error:", e?.response?.data || e.message);
            setListChoiceVisible(false);
            setListSelectVisible(false);
            Alert.alert("Błąd", "Nie udało się utworzyć listy zakupów.");
        }
    };

    const chooseExistingAndAdd = async () => {
        const missingOnly = pendingMode === "missing";
        try {
            const items = resolveIngredients(missingOnly);
            if (!items.length) {
                setListChoiceVisible(false);
                return;
            }

            const lists = await listShoppingLists(token);
            if (!lists || !lists.length) {
                await addToNewList();
                return;
            }

            setAvailableLists(lists);
            setListChoiceVisible(false);
            setListSelectVisible(true);
        } catch (e) {
            console.log(
                "chooseExistingAndAdd error:",
                e?.response?.data || e.message
            );
            setListChoiceVisible(false);
            Alert.alert(
                "Błąd",
                "Nie udało się pobrać list zakupów."
            );
        }
    };

    const confirmAddToExisting = async (list) => {
        const missingOnly = pendingMode === "missing";
        try {
            const items = resolveIngredients(missingOnly);
            if (!items.length) {
                setListSelectVisible(false);
                return;
            }

            await addRecipeIngredientsToList(list.id, items, token);

            setListSelectVisible(false);

            Alert.alert(
                "Dodano",
                "Składniki dodane do wybranej listy.",
                [
                    {
                        text: "Otwórz listę",
                        onPress: () =>
                            navigation.navigate("ShoppingListDetailsScreen", {
                                listId: list.id,
                                title: list.name,
                            }),
                    },
                    { text: "OK" },
                ]
            );
        } catch (e) {
            console.log(
                "confirmAddToExisting error:",
                e?.response?.data || e.message
            );
            Alert.alert(
                "Błąd",
                "Nie udało się dodać składników do tej listy."
            );
        }
    };


    return (
        <>
            <ScrollView
                style={styles.screen}
                contentContainerStyle={{ paddingBottom: 32 }}
            >
                <Text style={styles.title}>{recipe.title}</Text>

                {!!recipe.description && (
                    <Text style={styles.desc}>{recipe.description}</Text>
                )}

                <View style={styles.metaRow}>
                    {!!recipe.totalTimeMin && (
                        <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>
                                ⏱ {recipe.totalTimeMin} min
                            </Text>
                        </View>
                    )}

                    {!!avg && (
                        <TouchableOpacity
                            style={[styles.metaPill, styles.reviewsPill]}
                            onPress={() =>
                                navigation.navigate("ReviewsScreen", {
                                    recipeId: id,
                                    title: recipe.title,
                                })
                            }
                            activeOpacity={0.85}
                        >
                            <Text style={styles.metaPillText}>
                                ⭐ {avg} · Recenzje
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.sectionTitle}>Składniki</Text>
                {!token && (
                    <Text style={styles.hint}>
                        Zaloguj się, aby zobaczyć dopasowanie składników do
                        Twojej spiżarni.
                    </Text>
                )}

                <FlatList
                    data={recipe.ingredients || []}
                    keyExtractor={(it, idx) =>
                        String(it.ingredientId ?? idx)
                    }
                    renderItem={renderIngredient}
                    scrollEnabled={false}
                    contentContainerStyle={{ gap: 8 }}
                />

                {token && (
                    <View style={styles.shoppingButtonsWrap}>
                        <TouchableOpacity
                            style={styles.shoppingBtnPrimary}
                            onPress={handleAddAll}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.shoppingBtnPrimaryText}>
                                Dodaj składniki do listy zakupów
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.shoppingBtnSecondary}
                            onPress={handleAddMissing}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.shoppingBtnSecondaryText}>
                                Dodaj brakujące składniki do listy zakupów
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                    Kroki
                </Text>
                <View style={{ gap: 10 }}>
                    {(recipe.steps || [])
                        .slice()
                        .sort(
                            (a, b) =>
                                (a.stepNo ?? 0) - (b.stepNo ?? 0)
                        )
                        .map((s, i) => (
                            <View
                                key={`${s.stepNo}-${i}`}
                                style={styles.stepRow}
                            >
                                <View style={styles.stepBadge}>
                                    <Text style={styles.stepBadgeText}>
                                        {s.stepNo ?? i + 1}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.stepText}>
                                        {s.instruction}
                                    </Text>
                                    {!!s.timeMin && (
                                        <Text style={styles.stepSub}>
                                            ~ {s.timeMin} min
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
                </View>

                <View style={{ height: 16 }} />

                <TouchableOpacity
                    style={styles.cookBtn}
                    onPress={() =>
                        navigation.navigate("CookingStepScreen", {
                            recipe,
                        })
                    }
                >
                    <Text style={styles.cookBtnText}>
                        Rozpocznij gotowanie
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={listChoiceVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setListChoiceVisible(false)}
            >
                <Pressable
                    style={styles.backdrop}
                    onPress={() => setListChoiceVisible(false)}
                >
                    <View />
                </Pressable>

                <View style={styles.sheet}>
                    <Text style={styles.sheetTitle}>Dodaj do listy zakupów</Text>
                    <Text style={styles.sheetSubtitle}>
                        {pendingMode === "missing"
                            ? "Brakujące składniki: wybierz miejsce dodania."
                            : "Wszystkie składniki: wybierz miejsce dodania."}
                    </Text>

                    <TouchableOpacity
                        style={styles.sheetBtnPrimary}
                        onPress={chooseExistingAndAdd}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.sheetBtnPrimaryText}>
                            Dodaj do istniejącej listy
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.sheetBtnSecondary}
                        onPress={addToNewList}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.sheetBtnSecondaryText}>
                            Utwórz nową listę
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.sheetCancel}
                        onPress={() => setListChoiceVisible(false)}
                    >
                        <Text style={styles.sheetCancelText}>Anuluj</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            <Modal
                visible={listSelectVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setListSelectVisible(false)}
            >
                <Pressable
                    style={styles.backdrop}
                    onPress={() => setListSelectVisible(false)}
                >
                    <View />
                </Pressable>

                <View style={styles.sheet}>
                    <Text style={styles.sheetTitle}>Wybierz listę</Text>
                    <Text style={styles.sheetSubtitle}>
                        Dodaj składniki do istniejącej listy zakupów.
                    </Text>

                    {availableLists.map((l) => (
                        <TouchableOpacity
                            key={l.id}
                            style={styles.sheetListItem}
                            onPress={() => confirmAddToExisting(l)}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.sheetListItemText}>
                                {l.name || `Lista ${l.id}`}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={styles.sheetBtnSecondary}
                        onPress={addToNewList}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.sheetBtnSecondaryText}>
                            + Nowa lista
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.sheetCancel}
                        onPress={() => setListSelectVisible(false)}
                    >
                        <Text style={styles.sheetCancelText}>Anuluj</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#fff", padding: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },

    title: { fontSize: 22, fontWeight: "700", color: "#111" },
    desc: { marginTop: 6, color: "#444", lineHeight: 20 },

    metaRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    metaPill: {
        backgroundColor: "#f0efe8",
        borderColor: "#e2e0d7",
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    metaPillText: { color: "#333", fontSize: 12, fontWeight: "600" },
    reviewsPill: { flexDirection: "row", alignItems: "center" },

    sectionTitle: {
        marginTop: 18,
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
    },
    hint: { marginTop: 4, color: "#666", fontSize: 12 },

    ingRow: {
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    ingText: { color: "#111", fontSize: 15 },
    ingTextStrong: {
        color: "#111",
        fontSize: 15,
        fontWeight: "600",
    },

    badgeOk: { backgroundColor: "#e8f7ec", borderColor: "#b9e4c4" },
    badgePartial: { backgroundColor: "#fff7e8", borderColor: "#ffe0a8" },
    badgeMissing: { backgroundColor: "#ffecec", borderColor: "#ffb8b8" },
    badgeNeutral: { backgroundColor: "#fff", borderColor: "#e8e8e8" },

    shoppingButtonsWrap: { marginTop: 14, gap: 8 },
    shoppingBtnPrimary: {
        backgroundColor: "#e6dfd3",
        paddingVertical: 12,
        borderRadius: 999,
        alignItems: "center",
    },
    shoppingBtnPrimaryText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#3c3c3c",
    },
    shoppingBtnSecondary: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e0d7c7",
        paddingVertical: 10,
        borderRadius: 999,
        alignItems: "center",
    },
    shoppingBtnSecondaryText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#7a6a4f",
    },

    stepRow: {
        flexDirection: "row",
        gap: 10,
        alignItems: "flex-start",
    },
    stepBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#b89c7d",
    },
    stepBadgeText: {
        color: "#fff",
        fontWeight: "700",
    },
    stepText: { color: "#111", fontSize: 15 },
    stepSub: { color: "#666", fontSize: 12, marginTop: 2 },

    cookBtn: {
        backgroundColor: "#b89c7d",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 8,
    },
    cookBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },

    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.25)",
    },
    sheet: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 20,
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: -4 },
        shadowRadius: 10,
        elevation: 12,
    },
    sheetTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#111",
    },
    sheetSubtitle: {
        marginTop: 4,
        marginBottom: 14,
        fontSize: 13,
        color: "#666",
    },
    sheetBtnPrimary: {
        backgroundColor: "#e6dfd3",
        paddingVertical: 11,
        borderRadius: 999,
        alignItems: "center",
        marginBottom: 8,
    },
    sheetBtnPrimaryText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#3c3c3c",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    sheetBtnSecondary: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e0d7c7",
        paddingVertical: 10,
        borderRadius: 999,
        alignItems: "center",
        marginTop: 4,
    },
    sheetBtnSecondaryText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#7a6a4f",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    sheetCancel: {
        marginTop: 10,
        alignItems: "center",
    },
    sheetCancelText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#999",
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    sheetListItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#eee3d3",
        marginBottom: 6,
    },
    sheetListItemText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#3c3c3c",
    },
});
