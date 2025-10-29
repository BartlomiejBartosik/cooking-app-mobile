import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, StyleSheet, ActivityIndicator, FlatList, Alert, Keyboard } from "react-native";
import { useUserContext } from "../context/UserContext";
import SegmentedToggle from "../components/SegmentedToggle";
import RecipeCard from "../components/RecipeCard";
import { searchByName, searchByIngredients, searchFromPantry } from "../lib/recipes";

const PAGE_SIZE = 20;

export default function SearchScreen({ navigation }) {
    const { token } = useUserContext();
    const [mode, setMode] = useState("name");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);

    const [results, setResults] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const loadingRef = useRef(false);

    const options = [
        { key: "name",        label: "Nazwa" },
        { key: "ingredients", label: "Składnik" },
        { key: "pantry",      label: "Spiżarnia", disabled: !token }
    ];

    const onLockedPress = () => {
        Alert.alert(
            "Zaloguj się",
            "Wyszukiwanie po spiżarni jest dostępne tylko dla zalogowanych.",
            [
                { text: "Anuluj", style: "cancel" },
                { text: "Przejdź do logowania", onPress: () => navigation.navigate("LoginScreen") }
            ]
        );
    };

    const fetchPage = async (pageToLoad, replace = false) => {
        if (loadingRef.current) return;
        if (mode !== "pantry" && !query.trim()) {
            if (replace) { setResults([]); setHasMore(false); setPage(0); }
            return;
        }
        if (mode === "pantry" && !token) { onLockedPress(); return; }

        try {
            loadingRef.current = true;
            setLoading(true);
            let pageData;

            if (mode === "name") {
                pageData = await searchByName(query.trim(), pageToLoad, PAGE_SIZE);
            } else if (mode === "ingredients") {
                pageData = await searchByIngredients(query.trim(), pageToLoad, PAGE_SIZE);
            } else {
                pageData = await searchFromPantry(pageToLoad, PAGE_SIZE);
            }

            const content = pageData?.content ?? [];
            const next = pageData ? !pageData.last : false;

            setResults(replace ? content : [...results, ...content]);
            setPage(pageToLoad);
            setHasMore(next);
        } catch (e) {
            console.log(e);
            Alert.alert("Błąd", "Nie udało się pobrać przepisów.");
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    };

    useEffect(() => {
        setResults([]);
        setPage(0);
        setHasMore(false);
        if (mode === "pantry" || query.trim().length > 0) {
            fetchPage(0, true);
        }
    }, [mode]);

    const runSearch = () => {
        Keyboard.dismiss();
        setResults([]);
        setPage(0);
        setHasMore(false);
        fetchPage(0, true);
    };

    const loadMore = () => {
        if (!loading && hasMore) fetchPage(page + 1, false);
    };

    return (
        <View style={styles.container}>
            <SegmentedToggle
                value={mode}
                onChange={setMode}
                options={options}
                onLockedPress={onLockedPress}
            />

            <View style={{ height: 12 }} />

            <TextInput
                style={[styles.input, mode === "pantry" && styles.inputDisabled]}
                placeholder={
                    mode === "name"
                        ? "np. spaghetti bolognese"
                        : mode === "ingredients"
                            ? "np. pomidor, cebula, bazylia"
                            : "Wyszukiwanie na podstawie Twojej spiżarni"
                }
                value={query}
                onChangeText={setQuery}
                editable={mode !== "pantry"}
                onSubmitEditing={runSearch}
                returnKeyType="search"
            />

            <View style={{ height: 10 }} />

            <FlatList
                data={results}
                keyExtractor={(item, idx) => String(item.id ?? idx)}
                renderItem={({ item }) => (
                    <RecipeCard
                        item={item}
                        onPress={() => navigation.navigate("RecipeDetails", { id: item.id })}
                    />
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={!loading ? <Text style={styles.empty}>Brak wyników</Text> : null}
                ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 12 }} /> : null}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                keyboardShouldPersistTaps="handled"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#fff" },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 16,
        backgroundColor: "#fff"
    },
    inputDisabled: { backgroundColor: "#f5f5f5", color: "#888" },
    empty: { textAlign: "center", color: "#777", marginTop: 20 }
});
