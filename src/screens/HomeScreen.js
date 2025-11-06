import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserContext } from "../context/UserContext";
import { fetchTopRecipes, searchFromPantry } from "../lib/recipes";
import { useFocusEffect } from "@react-navigation/core";

import RecipeCard from "../components/RecipeCard";

const PAGE_SIZE = 20;

export default function HomeScreen({ navigation }) {
    const { token, userInfo } = useUserContext();

    const [loadingTop, setLoadingTop] = useState(false);
    const [loadingPantryReco, setLoadingPantryReco] = useState(false);

    const [topRecipes, setTopRecipes] = useState([]);
    const [pantryReco, setPantryReco] = useState([]);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            onRefresh();
        }, [])
    );

    const onRefresh = async () => {
        setPage(0);
        setHasMore(true);
        setTopRecipes([]);
        setPantryReco([]);

        try {
            const list = await fetchTopRecipes();
            setTopRecipes(list);

            const pantryList = await searchFromPantry(0, PAGE_SIZE);
            setPantryReco(pantryList.content);
            setHasMore(!pantryList.last);
        } catch (e) {
            console.log("Error loading data", e?.response?.data || e.message);
        }
    };

    const renderHeader = () => {
        return (
            <View style={styles.headerBox}>
                <Text style={styles.hello}>
                    {token
                        ? `Hej${userInfo?.name ? `, ${userInfo.name}` : ""} 👋`
                        : "Cześć 👋"}
                </Text>

                <Text style={styles.subHello}>Gotujemy coś dzisiaj?</Text>

                <View style={styles.quickRow}>
                    <TouchableOpacity
                        style={styles.quickButton}
                        onPress={() => navigation.navigate("Search")}
                    >
                        <Ionicons name="search" size={16} color="#fff" />
                        <Text style={styles.quickButtonText}>Szukaj przepisu</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickButton, { backgroundColor: "#e1dacd" }]}
                        onPress={() =>
                            token
                                ? navigation.navigate("Pantry")
                                : navigation.navigate("LoginScreen")
                        }
                    >
                        <Ionicons name="basket-outline" size={16} color="#111" />
                        <Text style={[styles.quickButtonText, { color: "#111" }]}>
                            Moja spiżarnia
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderSection = (title, loading, data, emptyText) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 16 }} />
            ) : data.length === 0 ? (
                <Text style={styles.emptyText}>{emptyText}</Text>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item, idx) => String(item.id ?? idx)}
                    renderItem={({ item }) => (
                        <RecipeCard
                            item={item}
                            onPress={() => navigation.navigate("RecipeDetailsScreen", { id: item.id })}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={!loading ? <Text style={styles.empty}>Brak wyników</Text> : null}
                    ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 12 }} /> : null}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    keyboardShouldPersistTaps="handled"
                />
            )}
        </View>
    );

    const loadMore = () => {
        if (!loadingPantryReco && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    return (
        <FlatList
            style={styles.screen}
            contentContainerStyle={{ paddingBottom: 32 }}
            refreshControl={
                <RefreshControl refreshing={loadingPantryReco || loadingTop} onRefresh={onRefresh} />
            }
            ListHeaderComponent={renderHeader}
            data={[
                {
                    title: "Popularne teraz",
                    loading: loadingTop,
                    data: topRecipes,
                    emptyText: "Brak przepisów do pokazania."
                },
                token && {
                    title: "Ugotujesz z tego co masz",
                    loading: loadingPantryReco,
                    data: pantryReco,
                    emptyText: "Nie mam jeszcze propozycji. Dodaj składniki do spiżarni 🍅"
                }
            ].filter(Boolean)}
            keyExtractor={(item) => item.title}
            renderItem={({ item }) => renderSection(item.title, item.loading, item.data, item.emptyText)}
            ListFooterComponent={
                hasMore && !loadingPantryReco && (
                    <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton}>
                        <Text style={styles.loadMoreText}>Załaduj więcej...</Text>
                    </TouchableOpacity>
                )
            }
        />
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerBox: {
        marginBottom: 24,
        backgroundColor: "#f7f5ee",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    hello: {
        fontSize: 20,
        fontWeight: "600",
        color: "#111",
    },
    subHello: {
        marginTop: 4,
        fontSize: 14,
        color: "#444",
    },
    quickRow: {
        flexDirection: "row",
        marginTop: 16,
    },
    quickButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#b89c7d",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginRight: 12,
    },
    quickButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 6,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111",
        marginBottom: 12,
    },
    emptyText: {
        color: "#777",
        fontSize: 14,
        paddingHorizontal: 4,
    },
    loadMoreButton: {
        backgroundColor: "#e1dacd",
        borderRadius: 10,
        paddingVertical: 10,
        marginTop: 16,
        alignItems: "center",
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#111",
    },
});
