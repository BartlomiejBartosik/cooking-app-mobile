import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserContext } from "../context/UserContext";
import { searchIngredients } from "../lib/ingredients";
import { updatePantryItem } from "../lib/pantry";

const DEBOUNCE_MS = 250;

export default function PantryAddItemScreen({ navigation }) {
    const { token } = useUserContext();

    const [searchText, setSearchText] = useState("");
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [results, setResults] = useState([]);

    const [selectedIngredient, setSelectedIngredient] = useState(null); // {id,name,unit,category}
    const [amount, setAmount] = useState("");

    const [saving, setSaving] = useState(false);

    // do debounce + anulowania poprzedniego żądania
    const debounceRef = useRef(null);
    const abortRef = useRef(null);

    const runSearch = async (text) => {
        const q = (text ?? "").trim();
        if (q.length < 2) {
            if (abortRef.current) abortRef.current.abort();
            setResults([]);
            setLoadingSearch(false);
            return;
        }
        try {
            if (abortRef.current) abortRef.current.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setLoadingSearch(true);
            const data = await searchIngredients(q, token, controller.signal);
            setResults(data);
        } catch (err) {
            if (err?.name !== "CanceledError" && err?.name !== "AbortError") {
                console.log("searchIngredients error:", err?.response?.status, err?.response?.data);
                Alert.alert("Błąd", "Nie udało się pobrać składników.");
            }
        } finally {
            setLoadingSearch(false);
        }
    };

    // live search z debounce
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
        setResults([]);
        setSearchText(ing.name);
        if (abortRef.current) abortRef.current.abort();
    };

    const handleSave = async () => {
        if (!selectedIngredient) {
            Alert.alert("Brak składnika", "Wybierz składnik z listy poniżej.");
            return;
        }

        const parsed = parseFloat((amount || "").replace(",", "."));
        if (isNaN(parsed) || parsed <= 0) {
            Alert.alert("Błędna ilość", "Podaj prawidłową liczbę większą od zera.");
            return;
        }

        try {
            setSaving(true);
            await updatePantryItem(token, selectedIngredient.id, parsed);

            Alert.alert(
                "Dodano",
                `${selectedIngredient.name} (${parsed} ${selectedIngredient.unit}) zapisane w spiżarni.`,
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (err) {
            console.log("updatePantryItem error:", err?.response?.status, err?.response?.data);
            Alert.alert("Błąd", "Nie udało się zapisać w spiżarni.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.wrap}
            behavior={Platform.select({ ios: "padding", android: undefined })}
        >
            <View style={styles.container}>
                {/* 1. Pasek wyszukiwania składnika */}
                <Text style={styles.label}>Wyszukaj składnik</Text>
                <View style={styles.rowSearch}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="np. mleko, pierś z kurczaka, ryż..."
                        value={searchText}
                        onChangeText={setSearchText}
                        returnKeyType="search"
                    />
                    <View style={styles.searchBtn}>
                        {loadingSearch ? (
                            <ActivityIndicator />
                        ) : (
                            <Ionicons name="search" size={20} color="#fff" />
                        )}
                    </View>
                </View>

                {/* 2. Wyniki wyszukiwania */}
                {results.length > 0 && (
                    <View style={styles.resultsBox}>
                        <Text style={styles.resultsHeader}>Wyniki</Text>
                        <FlatList
                            keyboardShouldPersistTaps="handled"
                            data={results}
                            keyExtractor={(item) => String(item.id)}
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
                                        <Ionicons name="checkmark-circle" size={20} color="green" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                <View style={styles.selectedBox}>
                    <Text style={styles.label}>Wybrano:</Text>
                    {selectedIngredient ? (
                        <Text style={styles.selectedName}>
                            {selectedIngredient.name} ({selectedIngredient.unit}, {selectedIngredient.category})
                        </Text>
                    ) : (
                        <Text style={styles.placeholderText}>
                            Brak — wpisz nazwę i wybierz z listy powyżej
                        </Text>
                    )}

                    <Text style={[styles.label, { marginTop: 16 }]}>
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
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, !selectedIngredient && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={!selectedIngredient || saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Zapisz w spiżarni</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: "#fff" },
    container: { flex: 1, padding: 16, backgroundColor: "#fff" },

    label: { fontSize: 14, fontWeight: "500", color: "#222", marginBottom: 6 },

    rowSearch: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: "#fff",
        marginRight: 8,
    },
    searchBtn: {
        backgroundColor: "#b89c7d",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 44,
    },

    resultsBox: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        backgroundColor: "#fafafa",
        marginBottom: 20,
        maxHeight: 240,
        overflow: "hidden",
    },
    resultsHeader: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontWeight: "600",
        color: "#333",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    resultRow: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    resultName: { fontSize: 16, color: "#111" },
    resultMeta: { fontSize: 12, color: "#666", marginTop: 2 },

    selectedBox: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        padding: 12,
        backgroundColor: "#fafafa",
        marginBottom: 20,
    },
    selectedName: { fontSize: 16, fontWeight: "600", color: "#111" },
    placeholderText: { fontSize: 14, color: "#777" },

    amountInput: {
        height: 44,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: "#fff",
        marginTop: 6,
    },

    saveBtn: {
        backgroundColor: "#b89c7d",
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
