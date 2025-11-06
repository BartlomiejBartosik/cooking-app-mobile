import React from "react";
import { Pressable, View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserContext } from "../context/UserContext";
import { useFavorites } from "../lib/useFavorites";

export default function RecipeCard({ item, onPress }) {
    const { token } = useUserContext();
    const { isFavorite, toggle } = useFavorites();

    const fav = isFavorite(item?.id);
    const [saving, setSaving] = React.useState(false);

    const toggleFav = async (e) => {
        if (e?.stopPropagation) e.stopPropagation();
        if (!token) {
            Alert.alert("Zaloguj się", "Ulubione są dostępne po zalogowaniu.");
            return;
        }
        if (!item?.id || saving) return;

        setSaving(true);
        try {
            await toggle(item.id);
        } catch (err) {
            Alert.alert("Błąd", "Nie udało się zmienić stanu ulubionych.");
        } finally {
            setSaving(false);
        }
    };

    const title = item?.title || "Bez tytułu";
    const time = item?.time ?? item?.totalTimeMin;
    const rating = item?.rating ?? item?.avgRating ?? null;

    return (
        <View style={styles.wrap}>
            <Pressable style={styles.card} onPress={onPress}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {!!time && <Text style={styles.meta}>⏱ {time} min</Text>}
                {!!(rating || rating === 0) && (
                    <Text style={styles.meta}>
                        ⭐ {typeof rating === "number" && rating.toFixed ? rating.toFixed(1) : rating}
                    </Text>
                )}
            </Pressable>

            <TouchableOpacity
                onPress={toggleFav}
                activeOpacity={0.8}
                style={styles.heartBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                disabled={saving}
            >
                <Ionicons
                    name={fav ? "heart" : "heart-outline"}
                    size={20}
                    color={fav ? "#E53935" : "#333"}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { position: "relative", marginBottom: 10 },
    card: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e5e5",
        backgroundColor: "#fff",
    },
    title: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
    meta: { fontSize: 13, color: "#555" },
    heartBtn: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 18,
        padding: 6,
        borderWidth: 1,
        borderColor: "#eee",
    },
});
