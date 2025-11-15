import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/core";
import { useUserContext } from "../context/UserContext";
import {
    getShoppingList,
    addShoppingListItem,
    updateShoppingListItem,
    deleteShoppingListItem,
    finalizeShoppingList,
    renameShoppingList,
} from "../lib/shoppingLists";
import { searchIngredients } from "../lib/ingredients";

const DEBOUNCE_MS = 250;

export default function ShoppingListDetailsScreen({ route, navigation }) {
    const { listId, title: initialTitle } = route.params || {};
    const { token } = useUserContext();
    const [loading, setLoading] = useState(true);
    const [list, setList] = useState(null);
    const [items, setItems] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [amount, setAmount] = useState("");
    const [savingItem, setSavingItem] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [renameVisible, setRenameVisible] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const [renameSaving, setRenameSaving] = useState(false);
    const [finalizeVisible, setFinalizeVisible] = useState(false);

    const debounceRef = useRef(null);
    const abortRef = useRef(null);

    const load = async () => {
        if (!token || !listId) return;
        try {
            setLoading(true);
            const data = await getShoppingList(listId, token);
            setList(data);
            setItems(Array.isArray(data?.items) ? data.items : []);
            if (data?.name && !initialTitle) {
                navigation.setOptions({ title: data.name });
            }
        } catch (e) {
            console.log("getShoppingList error:", e?.response?.data || e.message);
            Alert.alert("Błąd", "Nie udało się pobrać listy zakupów.", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (!token) {
                navigation.navigate("LoginScreen");
                return;
            }
            load();
        }, [token, listId])
    );

    const runSearch = async (text) => {
        const q = (text || "").trim();
        if (q.length < 2) {
            if (abortRef.current) abortRef.current.abort();
            setResults([]);
            setSearchLoading(false);
            return;
        }
        try {
            if (abortRef.current) abortRef.current.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setSearchLoading(true);
            const data = await searchIngredients(q, token, controller.signal);
            setResults(data || []);
        } catch (err) {
            if (err?.name !== "CanceledError" && err?.name !== "AbortError") {
                console.log(
                    "searchIngredients error:",
                    err?.response?.data || err.message
                );
                Alert.alert("Błąd", "Nie udało się pobrać składników.");
            }
        } finally {
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runSearch(searchText), DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchText]);

    const chooseIngredient = (ing) => {
        setSelectedIngredient(ing);
        setAmount("");
        setSearchText(ing.name);
        setResults([]);
        if (abortRef.current) abortRef.current.abort();
    };

    const findExistingItem = (ingredient) => {
        if (!ingredient) return null;

        const ingId = ingredient.id ?? ingredient.ingredientId ?? null;
        const ingName = (ingredient.name || ingredient.ingredientName || "")
            .trim()
            .toLowerCase();
        const ingUnit = (ingredient.unit || "").trim().toLowerCase();

        return (
            items.find((it) => {
                const itemIngId = it.ingredientId ?? it.ingredient?.id ?? null;
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

                if (ingId && itemIngId && ingId === itemIngId) return true;
                return !!ingName && !!itemName && ingName === itemName && ingUnit === itemUnit;
            }) || null
        );
    };

    const handleAddItem = async () => {
        if (!selectedIngredient) {
            Alert.alert("Brak składnika", "Wybierz składnik.");
            return;
        }
        const parsed = parseFloat((amount || "").replace(",", "."));
        if (isNaN(parsed) || parsed <= 0) {
            Alert.alert("Błędna ilość", "Podaj liczbę > 0.");
            return;
        }

        try {
            setSavingItem(true);

            const existing = findExistingItem(selectedIngredient);
            if (existing) {
                const newAmount = Number(existing.amount ?? 0) + parsed;
                await updateShoppingListItem(
                    listId,
                    existing.id,
                    { amount: newAmount },
                    token
                );
            } else {
                await addShoppingListItem(
                    listId,
                    {
                        ingredientId: selectedIngredient.id,
                        name: selectedIngredient.name,
                        unit: selectedIngredient.unit,
                        amount: parsed,
                    },
                    token
                );
            }

            await load();
            setSelectedIngredient(null);
            setAmount("");
            setSearchText("");
            setResults([]);
        } catch (e) {
            console.log("add/update item error:", e?.response?.data || e.message);
            Alert.alert("Błąd", "Nie udało się zapisać pozycji.");
        } finally {
            setSavingItem(false);
        }
    };

    const startEdit = (item) => {
        setEditingItem({ id: item.id, amount: String(item.amount ?? "") });
    };
    const cancelEdit = () => setEditingItem(null);

    const saveEdit = async () => {
        if (!editingItem) return;
        const parsed = parseFloat((editingItem.amount || "").replace(",", "."));
        if (isNaN(parsed) || parsed <= 0) {
            Alert.alert("Błędna ilość", "Podaj dodatnią liczbę.");
            return;
        }

        try {
            await updateShoppingListItem(listId, editingItem.id, { amount: parsed }, token);
            await load();
            setEditingItem(null);
        } catch (e) {
            console.log("updateShoppingListItem error:", e?.response?.data || e.message);
            Alert.alert("Błąd", "Nie udało się zaktualizować pozycji.");
        }
    };

    const handleDelete = (itemId) => {
        Alert.alert("Usuń pozycję", "Na pewno?", [
            { text: "Anuluj", style: "cancel" },
            {
                text: "Usuń",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteShoppingListItem(listId, itemId, token);
                        await load();
                    } catch (e) {
                        console.log(
                            "deleteShoppingListItem error:",
                            e?.response?.data || e.message
                        );
                        Alert.alert("Błąd", "Nie udało się usunąć pozycji.");
                    }
                },
            },
        ]);
    };

    const handleFinalize = () => {
        if (!items.length) {
            Alert.alert("Pusta lista", "Nie ma czego realizować.");
            return;
        }
        setFinalizeVisible(true);
    };

    const doFinalize = async (addToPantry) => {
        try {
            await finalizeShoppingList(listId, addToPantry, token);
            setFinalizeVisible(false);
            Alert.alert(
                "Gotowe",
                addToPantry
                    ? "Składniki dodane do spiżarni, lista zamknięta."
                    : "Lista została usunięta."
            );
            navigation.goBack();
        } catch (e) {
            console.log("finalizeShoppingList error:", e?.response?.data || e.message);
            Alert.alert("Błąd", "Nie udało się zrealizować listy.");
        }
    };

    const openRename = () => {
        setRenameValue(list?.name || "");
        setRenameVisible(true);
    };
    const submitRename = async () => {
        const newName = (renameValue || "").trim();
        if (!newName) {
            Alert.alert("Pusta nazwa", "Wpisz nazwę listy.");
            return;
        }
        try {
            setRenameSaving(true);
            const resp = await renameShoppingList(listId, newName, token);
            if (resp?.name) {
                setList(resp);
                setItems(Array.isArray(resp.items) ? resp.items : items);
                navigation.setOptions({ title: resp.name });
            } else {
                setList((prev) => ({ ...(prev || {}), name: newName }));
                navigation.setOptions({ title: newName });
            }
            setRenameVisible(false);
        } catch (e) {
            console.log("renameShoppingList error:", e?.response?.data || e.message);
            Alert.alert("Błąd", "Nie udało się zmienić nazwy listy.");
        } finally {
            setRenameSaving(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                    {item.amount} {item.unit}
                </Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => startEdit(item)}>
                <Ionicons name="create-outline" size={18} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={18} color="#c62828" />
            </TouchableOpacity>
        </View>
    );

    if (!token) {
        return (
            <View style={styles.center}>
                <Text>Musisz być zalogowany, aby korzystać z list zakupów.</Text>
            </View>
        );
    }
    if (loading && !list) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        );
    }
    if (!list) {
        return (
            <View style={styles.center}>
                <Text>Nie znaleziono listy.</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.wrap}
            behavior={Platform.select({ ios: "padding", android: undefined })}
        >
            <View style={styles.container}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{list?.name || "Lista zakupów"}</Text>
                    <TouchableOpacity
                        style={styles.pencilBtn}
                        onPress={openRename}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="pencil" size={18} color="#555" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Dodaj składnik</Text>
                <View style={styles.rowSearch}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="np. mleko, makaron..."
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    <View style={styles.searchBtn}>
                        {searchLoading ? (
                            <ActivityIndicator />
                        ) : (
                            <Ionicons name="search" size={18} color="#fff" />
                        )}
                    </View>
                </View>

                {results.length > 0 && (
                    <View style={styles.resultsBox}>
                        <FlatList
                            keyboardShouldPersistTaps="handled"
                            data={results}
                            keyExtractor={(it) => String(it.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.resultRow}
                                    onPress={() => chooseIngredient(item)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.resultName}>{item.name}</Text>
                                        <Text style={styles.resultMeta}>
                                            {item.category} • {item.unit}
                                        </Text>
                                    </View>
                                    {selectedIngredient?.id === item.id && (
                                        <Ionicons name="checkmark-circle" size={18} color="#2e7d32" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                <View style={styles.selectedBox}>
                    <Text style={styles.labelSmall}>Wybrano:</Text>
                    {selectedIngredient ? (
                        <Text style={styles.selectedName}>
                            {selectedIngredient.name} ({selectedIngredient.unit})
                        </Text>
                    ) : (
                        <Text style={styles.placeholderText}>
                            Wpisz nazwę i wybierz składnik powyżej.
                        </Text>
                    )}

                    <Text style={[styles.labelSmall, { marginTop: 10 }]}>
                        Ilość ({selectedIngredient?.unit || "?"})
                    </Text>
                    <TextInput
                        style={styles.amountInput}
                        placeholder="np. 2.5"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        editable={!!selectedIngredient}
                    />

                    <TouchableOpacity
                        style={[styles.saveBtn, (!selectedIngredient || savingItem) && styles.saveBtnDisabled]}
                        onPress={handleAddItem}
                        disabled={!selectedIngredient || savingItem}
                    >
                        {savingItem ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveBtnText}>Dodaj do listy</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={[styles.label, { marginTop: 16 }]}>Pozycje na liście</Text>
                <FlatList
                    data={items}
                    keyExtractor={(it, idx) => String(it.id ?? idx)}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <Text style={styles.placeholderText}>
                            Na razie pusto. Dodaj coś z wyszukiwarki albo z przepisu.
                        </Text>
                    }
                />

                <TouchableOpacity style={styles.finalizeBtn} onPress={handleFinalize}>
                    <Text style={styles.finalizeText}>Zrealizuj listę</Text>
                </TouchableOpacity>

                {editingItem && (
                    <View style={styles.editBar}>
                        <Text style={styles.editLabel}>Nowa ilość:</Text>
                        <TextInput
                            style={styles.editInput}
                            keyboardType="numeric"
                            value={editingItem.amount}
                            onChangeText={(txt) =>
                                setEditingItem((prev) => ({ ...prev, amount: txt }))
                            }
                        />
                        <TouchableOpacity style={styles.editSaveBtn} onPress={saveEdit}>
                            <Text style={styles.editSaveText}>Zapisz</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.editCancelBtn} onPress={cancelEdit}>
                            <Ionicons name="close" size={18} color="#555" />
                        </TouchableOpacity>
                    </View>
                )}

                <Modal
                    visible={finalizeVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setFinalizeVisible(false)}
                >
                    <View style={styles.modalBack}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Zrealizować listę?</Text>
                            <Text style={styles.modalSubtitle}>
                                Czy dodać składniki do spiżarni?
                            </Text>

                            <View style={{ height: 12 }} />

                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalPrimary]}
                                onPress={() => doFinalize(true)}
                            >
                                <Text style={styles.modalPrimaryText}>
                                    Dodaj do spiżarni i usuń listę
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalNeutral]}
                                onPress={() => doFinalize(false)}
                            >
                                <Text style={styles.modalNeutralText}>Tylko usuń listę</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalCancel]}
                                onPress={() => setFinalizeVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Anuluj</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={renameVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setRenameVisible(false)}
                >
                    <View style={styles.modalBack}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Zmień nazwę listy</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Nazwa listy"
                                value={renameValue}
                                onChangeText={setRenameValue}
                                autoFocus
                            />

                            <View style={styles.modalRow}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.modalCancel]}
                                    onPress={() => setRenameVisible(false)}
                                    disabled={renameSaving}
                                >
                                    <Text style={styles.modalCancelText}>Anuluj</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.modalSave]}
                                    onPress={submitRename}
                                    disabled={renameSaving}
                                >
                                    {renameSaving ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.modalSaveText}>Zapisz</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: "#fff" },
    container: { flex: 1, padding: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },

    titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    title: { flex: 1, fontSize: 20, fontWeight: "700", color: "#111" },
    pencilBtn: {
        padding: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e8e8e8",
        backgroundColor: "#fff",
    },

    label: { fontSize: 16, fontWeight: "600", color: "#111", marginBottom: 6 },
    labelSmall: { fontSize: 13, fontWeight: "500", color: "#333" },

    rowSearch: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 15,
        backgroundColor: "#fff",
        marginRight: 8,
    },
    searchBtn: {
        backgroundColor: "#b89c7d",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    resultsBox: {
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 10,
        backgroundColor: "#fafafa",
        marginBottom: 10,
        maxHeight: 220,
        overflow: "hidden",
    },
    resultRow: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        flexDirection: "row",
        alignItems: "center",
    },
    resultName: { fontSize: 15, color: "#111" },
    resultMeta: { fontSize: 11, color: "#777", marginTop: 1 },

    selectedBox: {
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 10,
        padding: 10,
        backgroundColor: "#fafafa",
    },
    selectedName: { fontSize: 15, fontWeight: "600", color: "#111" },
    placeholderText: { fontSize: 13, color: "#777", marginTop: 4 },

    amountInput: {
        height: 40,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 15,
        backgroundColor: "#fff",
        marginTop: 4,
        marginBottom: 8,
    },

    saveBtn: {
        backgroundColor: "#b89c7d",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#eee",
        marginTop: 6,
    },
    itemName: { fontSize: 15, fontWeight: "500", color: "#111" },
    itemMeta: { fontSize: 12, color: "#777", marginTop: 2 },

    iconBtn: { paddingHorizontal: 6, paddingVertical: 4 },

    finalizeBtn: {
        marginTop: 16,
        backgroundColor: "#2e7d32",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    finalizeText: { color: "#fff", fontWeight: "700", fontSize: 16 },

    editBar: {
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 16,
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ddd",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 4,
    },
    editLabel: { fontSize: 13, color: "#333" },
    editInput: {
        flex: 1,
        marginHorizontal: 8,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        fontSize: 14,
    },
    editSaveBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: "#b89c7d",
        borderRadius: 8,
    },
    editSaveText: { color: "#fff", fontWeight: "600" },
    editCancelBtn: { marginLeft: 4, padding: 4 },

    modalBack: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    modalCard: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#eee",
    },
    modalTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 6 },
    modalSubtitle: { fontSize: 14, color: "#555" },

    modalRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 12,
        gap: 10,
    },
    modalBtn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, marginTop: 10 },

    modalInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        backgroundColor: "#fff",
    },
    modalCancel: { backgroundColor: "#f2f2f2" },
    modalCancelText: { color: "#333", fontWeight: "600", textAlign: "center" },
    modalSave: { backgroundColor: "#b89c7d" },
    modalSaveText: { color: "#fff", fontWeight: "700", textAlign: "center" },

    modalPrimary: { backgroundColor: "#2e7d32", alignItems: "center" },
    modalPrimaryText: { color: "#fff", fontWeight: "700" },
    modalNeutral: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
        alignItems: "center",
    },
    modalNeutralText: { color: "#333", fontWeight: "700" },
});
