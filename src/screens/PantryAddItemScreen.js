import React, { useState } from "react";
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

export default function PantryAddItemScreen({ navigation }) {
    const { token } = useUserContext();

    const [searchText, setSearchText] = useState("");
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [results, setResults] = useState([]);

    const [selectedIngredient, setSelectedIngredient] = useState(null); // {id,name,unit,category}
    const [amount, setAmount] = useState("");

    const [saving, setSaving] = useState(false);

    const handleSearch = async () => {
        if (!searchText.trim()) {
            setResults([]);
            return;
        }
        try {
            setLoadingSearch(true);
            const data = await searchIngredients(searchText.trim(), token);
            setResults(data);
        } catch (err) {
            console.log("searchIngredients error:", err?.response?.status, err?.response?.data);
            Alert.alert("Błąd", "Nie udało się pobrać składników.");
        } finally {
            setLoadingSearch(false);
        }
    };

    const chooseIngredient = (ing) => {
        setSelectedIngredient(ing);
        setAmount("");
        setResults([]);
        setSearchText(ing.name);
    };

    const handleSave = async () => {
        if (!selectedIngredient) {
            Alert.alert("Brak składnika", "Wybierz składnik z listy poniżej.");
            return;
        }

        const parsed = parseFloat(amount.replace(",", "."));
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
                [
                    {
                        text: "OK",
                        onPress: () => {
                            navigation.goBack();
                        },
                    },
                ]
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
                        onSubmitEditing={handleSearch}
                    />
                    <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                        {loadingSearch ? (
                            <ActivityIndicator />
                        ) : (
                            <Ionicons name="search" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* 2. Wyniki wyszukiwania */}
                {results.length > 0 && (
                    <View style={styles.resultsBox}>
                        <Text style={styles.resultsHeader}>Wyniki</Text>
                        <FlatList
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
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color="green"
                                        />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                <View style={styles.selectedBox}>
                    <Text style={styles.label}>Wybrano:</Text>
                    {selectedIngredient ? (
                        <>
                            <Text style={styles.selectedName}>
                                {selectedIngredient.name} ({selectedIngredient.unit}, {selectedIngredient.category})
                            </Text>
                        </>
                    ) : (
                        <Text style={styles.placeholderText}>
                            Brak - wybierz coś z wyszukiwarki powyżej
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
                    style={[
                        styles.saveBtn,
                        !selectedIngredient && styles.saveBtnDisabled,
                    ]}
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
    wrap: {
        flex: 1,
        backgroundColor: "#fff",
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#fff",
    },

    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#222",
        marginBottom: 6,
    },

    rowSearch: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
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
    },

    resultsBox: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        backgroundColor: "#fafafa",
        marginBottom: 20,
        maxHeight: 200,
        overflow: "hidden",
    },
    resultsHeader: {
        fontSize: 13,
        fontWeight: "600",
        color: "#555",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        backgroundColor: "#f2f2f2",
    },
    resultRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    resultName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111",
    },
    resultMeta: {
        fontSize: 12,
        color: "#666",
        marginTop: 2,
    },

    selectedBox: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        padding: 16,
        backgroundColor: "#fafafa",
        marginBottom: 24,
    },
    selectedName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111",
    },
    placeholderText: {
        color: "#888",
        fontSize: 13,
    },
    amountInput: {
        marginTop: 6,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: "#fff",
    },

    saveBtn: {
        backgroundColor: "#b89c7d",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    saveBtnDisabled: {
        backgroundColor: "#cbbdab",
    },
    saveBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
