import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    TextInput,
    Modal,
} from "react-native";
import { useUserContext } from "../context/UserContext";
import { updatePantryItem, deletePantryItem } from "../lib/pantry";

export default function PantryCategoryScreen({ route, navigation }) {
    const { token } = useUserContext();
    const { category, pantryItems } = route.params;

    const [items, setItems] = useState(
        (pantryItems || []).filter(
            (x) => x.ingredientCategory === category
        )
    );

    const [editVisible, setEditVisible] = useState(false);
    const [editAmount, setEditAmount] = useState("");
    const [editTarget, setEditTarget] = useState(null);

    const openEdit = (item) => {
        setEditTarget(item);
        setEditAmount(
            item.amount != null ? String(item.amount) : ""
        );
        setEditVisible(true);
    };

    const saveEdit = async () => {
        if (!editTarget) return;

        const parsed = parseFloat(editAmount.replace(",", "."));
        if (isNaN(parsed)) {
            Alert.alert("Błąd", "Podaj liczbę");
            return;
        }

        try {
            await updatePantryItem(token, editTarget.ingredientId, parsed);

            const updated = items.map((it) =>
                it.id === editTarget.id
                    ? { ...it, amount: parsed }
                    : it
            );
            setItems(updated);

            setEditVisible(false);
            setEditTarget(null);
        } catch (err) {
            console.log("saveEdit error:", err?.response?.status, err?.response?.data);
            Alert.alert("Błąd", "Nie udało się zapisać ilości");
        }
    };

    const confirmDelete = (item) => {
        Alert.alert(
            "Usuń składnik",
            `Na pewno usunąć "${item.ingredientName}" ze spiżarni?`,
            [
                { text: "Anuluj", style: "cancel" },
                {
                    text: "Usuń",
                    style: "destructive",
                    onPress: () => handleDelete(item),
                },
            ]
        );
    };

    const handleDelete = async (item) => {
        try {
            await deletePantryItem(token, item.id);
            setItems((prev) => prev.filter((it) => it.id !== item.id));
        } catch (err) {
            console.log("delete error:", err?.response?.status, err?.response?.data);
            Alert.alert("Błąd", "Nie udało się usunąć składnika");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>{category}</Text>

            <FlatList
                data={items}
                keyExtractor={(it) => String(it.id)}
                contentContainerStyle={{ paddingBottom: 32 }}
                ListEmptyComponent={
                    <Text style={styles.empty}>
                        Brak składników w tej kategorii
                    </Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemName}>
                                {item.ingredientName}
                            </Text>
                            <Text style={styles.itemMeta}>
                                Ilość: {item.amount ?? 0} {item.ingredientUnit || ""}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: "#eee" }]}
                            onPress={() => openEdit(item)}
                        >
                            <Text style={styles.actionText}>Edytuj</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: "#fdd" }]}
                            onPress={() => confirmDelete(item)}
                        >
                            <Text style={[styles.actionText, { color: "#900" }]}>
                                Usuń
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            {}
            <Modal
                transparent
                visible={editVisible}
                animationType="fade"
                onRequestClose={() => setEditVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>
                            Ustaw ilość ({editTarget?.ingredientName})
                        </Text>

                        <TextInput
                            style={styles.modalInput}
                            keyboardType="numeric"
                            value={editAmount}
                            onChangeText={setEditAmount}
                            placeholder="np. 2.5"
                        />

                        <View style={styles.modalRow}>
                            <TouchableOpacity
                                style={[
                                    styles.modalBtn,
                                    { backgroundColor: "#ccc" },
                                ]}
                                onPress={() => setEditVisible(false)}
                            >
                                <Text>Anuluj</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalBtn,
                                    { backgroundColor: "#b89c7d" },
                                ]}
                                onPress={saveEdit}
                            >
                                <Text
                                    style={{
                                        color: "#fff",
                                        fontWeight: "600",
                                    }}
                                >
                                    Zapisz
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 16 },
    header: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 16,
        color: "#111",
        textTransform: "capitalize",
    },
    empty: {
        textAlign: "center",
        color: "#666",
        marginTop: 32,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        backgroundColor: "#fafafa",
    },
    itemName: { fontSize: 16, fontWeight: "600", color: "#111" },
    itemMeta: { fontSize: 13, color: "#555", marginTop: 4 },

    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginLeft: 8,
        minWidth: 60,
        alignItems: "center",
    },
    actionText: { fontSize: 13, fontWeight: "500", color: "#333" },

    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalBox: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        width: "80%",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
        color: "#111",
    },
    modalInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: "#fff",
        marginBottom: 16,
    },
    modalRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    modalBtn: {
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginLeft: 8,
    },
});
