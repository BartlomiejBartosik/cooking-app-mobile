import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserContext } from "../context/UserContext";
import LockedOverlay from "../components/LockedOverlay";
import { fetchPantry } from "../lib/pantry";
import { useFocusEffect } from "@react-navigation/native";

const CATEGORIES = [
    { key: "MEAT",        label: "Mięso",        icon: "restaurant" },
    { key: "DAIRY",       label: "Nabiał",       icon: "ice-cream" },
    { key: "FISHES",      label: "Ryby",         icon: "fish" },
    { key: "VEGETABLES",  label: "Warzywa",      icon: "leaf" },
    { key: "FRUITS",      label: "Owoce",        icon: "nutrition" },
    { key: "GRAINS",      label: "Zboża",        icon: "bag-handle" },
    { key: "FATS",        label: "Tłuszcze",     icon: "water" },
    { key: "OTHER",       label: "Inne",         icon: "ellipsis-horizontal-circle" },
];

export default function PantryScreen({ navigation }) {
    const { token } = useUserContext();
    const [pantryItems, setPantryItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadPantry = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await fetchPantry(token);
            setPantryItems(data || []);
        } catch (err) {
            console.log("fetchPantry error:", err?.response?.status, err?.response?.data);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            loadPantry();
        }, [loadPantry])
    );

    const openCategory = (catKey) => {
        navigation.navigate("PantryCategoryScreen", {
            category: catKey,
            pantryItems,
        });
    };

    if (!token) {
        return (
            <View style={styles.lockedWrapper}>
                <Text style={styles.header}>Twoja spiżarnia</Text>

                <View style={styles.lockedBox}>
                    <Text style={styles.lockedText}>
                        Zaloguj się, żeby śledzić swoje składniki
                    </Text>
                </View>

                <LockedOverlay navigation={navigation} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                    navigation.navigate("PantryAddItemScreen", { pantryItems });
                }}
            >
                <Ionicons name="add-circle-outline" size={20} />
                <Text style={styles.addButtonText}>Dodaj składnik</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Kategorie</Text>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 24 }} />
            ) : (
                <FlatList
                    data={CATEGORIES}
                    numColumns={2}
                    keyExtractor={(item) => item.key}
                    columnWrapperStyle={{ justifyContent: "space-between" }}
                    contentContainerStyle={{ paddingBottom: 32 }}
                    renderItem={({ item }) => {
                        const countInCategory = pantryItems.filter(
                            (x) => x.ingredientCategory === item.key
                        ).length;

                        return (
                            <TouchableOpacity
                                style={styles.categoryTile}
                                onPress={() => openCategory(item.key)}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={28}
                                    style={{ marginBottom: 8 }}
                                />
                                <Text style={styles.categoryLabel}>{item.label}</Text>
                                <Text style={styles.categoryCount}>
                                    {countInCategory} składników
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    lockedWrapper: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    lockedBox: {
        backgroundColor: "#eee",
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
        width: "100%",
        alignItems: "center",
    },
    lockedText: { color: "#555", textAlign: "center" },
    header: { fontSize: 20, fontWeight: "600", color: "#111" },

    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#fff",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        alignSelf: "flex-start",
        marginBottom: 16,
        backgroundColor: "#fafafa",
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "500",
        marginLeft: 6,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
        color: "#111",
    },
    categoryTile: {
        backgroundColor: "#f7f5ee",
        borderRadius: 12,
        paddingVertical: 20,
        paddingHorizontal: 12,
        alignItems: "center",
        justifyContent: "center",
        width: "48%",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    categoryLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    categoryCount: {
        fontSize: 12,
        color: "#666",
        marginTop: 4,
    },
});
