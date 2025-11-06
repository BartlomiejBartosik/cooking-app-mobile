import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Alert,
    Keyboard,
} from "react-native";
import { useUserContext } from "../context/UserContext";
import SegmentedToggle from "../components/SegmentedToggle";
import RecipeCard from "../components/RecipeCard";
import {
    searchByName,
    searchByIngredients,
    searchFromPantry,
} from "../lib/recipes";

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 250;

export default function SearchScreen({ navigation }) {
    const { token } = useUserContext();

    const [mode, setMode] = useState("name");
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    const [results, setResults] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadingRef = useRef(false);
    const reqIdRef = useRef(0);

    const options = [
        { key: "name", label: "Nazwa" },
        { key: "ingredients", label: "Składnik" },
        { key: "pantry", label: "Spiżarnia", disabled: !token },
    ];

    const onLockedPress = () => {
        Alert.alert(
            "Zaloguj się",
            "Wyszukiwanie po spiżarni jest dostępne tylko dla zalogowanych.",
            [
                { text: "Anuluj", style: "cancel" },
                { text: "Przejdź do logowania", onPress: () => navigation.navigate("LoginScreen") },
            ]
        );
    };

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        setResults([]);
        setPage(0);
        setHasMore(false);

        if (mode === "pantry" || debouncedQuery.trim().length > 0) {
            fetchPage(0, true);
        }
    }, [mode, debouncedQuery]);

    const fetchPage = async (pageToLoad, replace = false) => {
        if (loadingRef.current && !replace) return;

        if (mode !== "pantry" && !debouncedQuery.trim()) {
            if (replace) {
                setResults([]);
                setHasMore(false);
                setPage(0);
            }
            return;
        }

        if (mode === "pantry" && !token) {
            onLockedPress();
            return;
        }

        const myReq = ++reqIdRef.current;
        try {
            loadingRef.current = true;
            setLoading(true);

            let pageData;
            if (mode === "name") {
                pageData = await searchByName(debouncedQuery.trim(), pageToLoad, PAGE_SIZE);
            } else if (mode === "ingredients") {
                pageData = await searchByIngredients(debouncedQuery.trim(), pageToLoad, PAGE_SIZE);
            } else {
                pageData = await searchFromPantry(pageToLoad, PAGE_SIZE);
            }

            if (myReq !== reqIdRef.current) return;

            const content = Array.isArray(pageData?.content) ? pageData.content : [];
            const nextHasMore = pageData ? !pageData.last : false;

            setResults((prev) => (replace ? content : dedupeById([...prev, ...content])));
            setPage(pageToLoad);
            setHasMore(nextHasMore);
        } catch (e) {
            if (__DEV__) console.warn("search error", e?.message || e);
            Alert.alert("Błąd", "Nie udało się pobrać przepisów.");
        } finally {
            if (myReq === reqIdRef.current) {
                setLoading(false);
                loadingRef.current = false;
            }
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            const next = page + 1;
            setPage(next);
            fetchPage(next, false);
        }
    };

    const onSubmit = () => Keyboard.dismiss();

    return (
        <View style={styles.container}>
            <SegmentedToggle
                value={mode}
                onChange={setMode}
                options={options}
                onLockedPress={onLockedPress}
            />

            <View style={{ height: 12 }} />

            {mode !== "pantry" && (
                <TextInput
                    style={styles.input}
                    placeholder={
                        mode === "name"
                            ? "np. spaghetti bolognese"
                            : "np. pomidor, cebula, bazylia"
                    }
                    value={query}
                    onChangeText={setQuery}      
                    editable={true}
                    onSubmitEditing={onSubmit}
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                />
            )}

            <View style={{ height: 10 }} />

            {loading && results.length === 0 ? (
                <ActivityIndicator style={{ marginTop: 16 }} />
            ) : results.length === 0 ? (
                <Text style={styles.empty}>
                    {mode === "pantry"
                        ? "Brak dopasowań ze spiżarni."
                        : debouncedQuery?.length
                            ? `Brak wyników dla „${debouncedQuery}”.`
                            : "Zacznij pisać..."}
                </Text>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item, idx) => String(item?.id ?? idx)}
                    renderItem={({ item }) => (
                        <RecipeCard
                            item={item}
                            onPress={() =>
                                navigation.navigate("RecipeDetailsScreen", {
                                    id: item.id,
                                    title: item.title,
                                    recipe: item,
                                })
                            }
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListFooterComponent={
                        loading ? <ActivityIndicator style={{ margin: 12 }} /> : null
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    keyboardShouldPersistTaps="handled"
                />
            )}
        </View>
    );
}

function dedupeById(arr) {
    const seen = new Set();
    const out = [];
    for (const it of arr) {
        const k = it?.id;
        if (k == null || !seen.has(k)) {
            if (k != null) seen.add(k);
            out.push(it);
        }
    }
    return out;
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
        backgroundColor: "#fff",
    },
    empty: { textAlign: "center", color: "#777", marginTop: 20 },
});
