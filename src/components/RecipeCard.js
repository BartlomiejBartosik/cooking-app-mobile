import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";

export default function RecipeCard({ item, onPress }) {
    return (
        <Pressable style={styles.card} onPress={onPress}>
            <Text style={styles.title} numberOfLines={1}>{item.title || "Bez tytułu"}</Text>
            {!!item.time && <Text style={styles.meta}>⏱ {item.time} min</Text>}
            {!!item.rating && <Text style={styles.meta}>⭐ {item.rating.toFixed ? item.rating.toFixed(1) : item.rating}</Text>}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff", marginBottom: 10 },
    title: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
    meta: { fontSize: 13, color: "#555" }
});
