import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    FlatList, TouchableOpacity,
} from "react-native";
import { useUserContext } from "../context/UserContext";
import { getRecipeDetails } from "../lib/recipes";
import { fetchPantry } from "../lib/pantry";


export default function RecipeDetailsScreen({ route, navigation }) {
    const { id } = route.params || {};
    const { token } = useUserContext();

    const [loading, setLoading] = useState(true);
    const [recipe, setRecipe] = useState(null);
    const [pantry, setPantry] = useState([]);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);
                const r = await getRecipeDetails(id);
                let p = [];
                if (token) {
                    p = await fetchPantry(token);
                }
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
        return () => (mounted = false);
    }, [id, token]);

    const pantryIndex = useMemo(() => {
        const byId = new Map();
        const byName = new Map();
        for (const item of pantry) {
            if (item.ingredientId != null) byId.set(String(item.ingredientId), item);
            if (item.name) byName.set(item.name.trim().toLowerCase(), item);
        }
        return { byId, byName };
    }, [pantry]);

    const getStatus = (line) => {
        if (!token) return "neutral";

        const hit =
            pantryIndex.byId.get(String(line.ingredientId)) ||
            pantryIndex.byName.get(String(line.ingredientName?.trim().toLowerCase()));

        console.log('Checking ingredient:', line.ingredientName);
        console.log('Found in pantry:', hit);

        if (!hit) return "missing";

        const lineUnit = line.unit || "szt";
        const pantryUnit = hit.ingredientUnit || "szt";

        if (lineUnit !== pantryUnit) {
            console.log('Unit mismatch:', lineUnit, 'vs', pantryUnit);
            return "partial";
        }

        const need = Number(line.amount ?? 0);
        const have = Number(hit.amount ?? 0);

        console.log('Need:', need, 'Have:', have);

        if (Number.isFinite(need) && Number.isFinite(have)) {
            if (have >= need) {
                return "ok";
            }
            if (have > 0 && have < need) {
                return "partial";
            }
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

    return (
        <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 28 }}>
            <Text style={styles.title}>{recipe.title}</Text>
            {!!recipe.description && (
                <Text style={styles.desc}>{recipe.description}</Text>
            )}

            <View style={styles.metaRow}>
                {!!recipe.totalTimeMin && (
                    <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>⏱ {recipe.totalTimeMin} min</Text>
                    </View>
                )}
                {!!recipe.avgRating && (
                    <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>
                            ⭐ {recipe.avgRating.toFixed ? recipe.avgRating.toFixed(1) : recipe.avgRating}
                        </Text>
                    </View>
                )}
            </View>

            <Text style={styles.sectionTitle}>Składniki</Text>
            {!token && (
                <Text style={styles.hint}>
                    Zaloguj się, aby zobaczyć dopasowanie składników do Twojej spiżarni.
                </Text>
            )}

            <FlatList
                data={recipe.ingredients || []}
                keyExtractor={(it, idx) => String(it.ingredientId ?? idx)}
                renderItem={renderIngredient}
                scrollEnabled={false}
                contentContainerStyle={{ gap: 8 }}
            />

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Kroki</Text>
            <View style={{ gap: 10 }}>
                {(recipe.steps || [])
                    .slice()
                    .sort((a, b) => (a.stepNo ?? 0) - (b.stepNo ?? 0))
                    .map((s, i) => (
                        <View key={`${s.stepNo}-${i}`} style={styles.stepRow}>
                            <View style={styles.stepBadge}>
                                <Text style={styles.stepBadgeText}>{s.stepNo ?? i + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepText}>{s.instruction}</Text>
                                {!!s.timeMin && (
                                    <Text style={styles.stepSub}>~ {s.timeMin} min</Text>
                                )}
                            </View>
                        </View>
                    ))}
            </View>

            <View style={{ height: 16 }} />

            <TouchableOpacity
                style={{
                    backgroundColor: "#b89c7d",
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: "center",
                    marginTop: 6,
                }}
                onPress={() => {
                    navigation.navigate("CookingStepScreen", { recipe });
                }}
            >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                    Rozpocznij gotowanie
                </Text>
            </TouchableOpacity>

        </ScrollView>

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

    sectionTitle: { marginTop: 18, fontSize: 18, fontWeight: "700", color: "#111" },
    hint: { marginTop: 4, color: "#666", fontSize: 12 },

    ingRow: {
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    ingText: { color: "#111", fontSize: 15 },
    ingTextStrong: { color: "#111", fontSize: 15, fontWeight: "600" },

    badgeOk: { backgroundColor: "#e8f7ec", borderColor: "#b9e4c4" },
    badgePartial: { backgroundColor: "#fff7e8", borderColor: "#ffe0a8" },
    badgeMissing: { backgroundColor: "#ffecec", borderColor: "#ffb8b8" },
    badgeNeutral: { backgroundColor: "#fff", borderColor: "#e8e8e8" },

    stepRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    stepBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#b89c7d",
    },
    stepBadgeText: { color: "#fff", fontWeight: "700" },
    stepText: { color: "#111", fontSize: 15 },
    stepSub: { color: "#666", fontSize: 12, marginTop: 2 },
});
