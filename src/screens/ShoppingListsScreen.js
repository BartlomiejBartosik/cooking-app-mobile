import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/core";
import { useUserContext } from "../context/UserContext";
import { listShoppingLists, createShoppingList } from "../lib/shoppingLists";

export default function ShoppingListsScreen({ navigation }) {
    const { token } = useUserContext();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await listShoppingLists(token);
            setLists(Array.isArray(data) ? data : []);
        } catch (e) {
            console.log("load shopping lists error:", e?.response?.data || e.message);
            Alert.alert("Błąd", "Nie udało się pobrać list zakupów.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            load();
        }, [token])
    );

    const handleCreate = async () => {
        if (!token) {
            navigation.navigate("LoginScreen");
            return;
        }

        try {
            const now = new Date();
            const label = `Lista zakupów ${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1)
                .toString()
                .padStart(2, "0")}`;
            const created = await createShoppingList(label, token);
            await load();
            navigation.navigate("ShoppingListDetailsScreen", {
                listId: created.id,
                title: created.name || label,
            });
        } catch (e) {
            console.log("create list error:", e?.response?.data || e.message);
            Alert.alert("Błąd", "Nie udało się utworzyć listy.");
        }
    };

    if (!token) {
        return (
            <View style={styles.center}>
                <Text>Musisz być zalogowany, aby korzystać z list zakupów.</Text>
                <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={() => navigation.navigate("LoginScreen")}
                >
                    <Text style={styles.loginText}>Przejdź do logowania</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.listRow}
            onPress={() =>
                navigation.navigate("ShoppingListDetailsScreen", {
                    listId: item.id,
                    title: item.name,
                })
            }
        >
            <View style={{ flex: 1 }}>
                <Text style={styles.listName}>
                    {item.name || "Lista zakupów"}
                </Text>
                <Text style={styles.listMeta}>
                    {item.itemsCount != null
                        ? `${item.itemsCount} pozycji`
                        : ""}
                    {item.createdAt
                        ? ` • ${String(item.createdAt).slice(0, 10)}`
                        : ""}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#777" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Listy zakupów</Text>
                <TouchableOpacity style={styles.addBtn} onPress={handleCreate}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addBtnText}>Nowa</Text>
                </TouchableOpacity>
            </View>

            {loading && lists.length === 0 ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={lists}
                    keyExtractor={(item, idx) => String(item.id ?? idx)}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <Text style={styles.empty}>
                            Brak list. Utwórz pierwszą, dodając produkty z
                            przepisu lub ręcznie.
                        </Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    title: { fontSize: 20, fontWeight: "700", color: "#111" },

    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#b89c7d",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    addBtnText: { color: "#fff", fontWeight: "600", marginLeft: 4 },

    listRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eee",
        marginBottom: 8,
        backgroundColor: "#fafafa",
    },
    listName: { fontSize: 16, fontWeight: "600", color: "#111" },
    listMeta: { fontSize: 12, color: "#777", marginTop: 2 },

    empty: { marginTop: 24, textAlign: "center", color: "#777" },

    loginBtn: {
        marginTop: 12,
        backgroundColor: "#b89c7d",
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
    },
    loginText: { color: "#fff", fontWeight: "600" },
});
