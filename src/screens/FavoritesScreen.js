import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from "react-native";
import { useUserContext } from "../context/UserContext";
import { listFavorites } from "../lib/favorites";
import RecipeCard from "../components/RecipeCard";
import { useFavorites } from "../lib/useFavorites";
import { useFocusEffect } from "@react-navigation/native";
import { hydrateFavorites } from "../lib/favoritesStore";

const PAGE_SIZE = 20;

export default function FavoritesScreen({ navigation }) {
    const { token } = useUserContext();
    const { isFavorite, version } = useFavorites();

    const [items, setItems] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(
        async (p = 0, replace = false) => {
            if (!token) return;
            try {
                setLoading(true);
                const data = await listFavorites(p, PAGE_SIZE, token);
                const content = Array.isArray(data?.content) ? data.content : [];
                setItems((prev) => (replace ? content : [...prev, ...content]));
                setHasMore(data?.last === false);
                setPage(p);
            } catch (e) {
                console.log(e);
                Alert.alert("Błąd", "Nie udało się pobrać ulubionych.");
            } finally {
                setLoading(false);
            }
        },
        [token]
    );

    useFocusEffect(
        useCallback(() => {
            if (token) load(0, true);
        }, [token, load])
    );

    const onRefresh = useCallback(async () => {
        if (!token) return;
        try {
            setRefreshing(true);
            await hydrateFavorites(token);
            await load(0, true);
        } finally {
            setRefreshing(false);
        }
    }, [token, load]);

    useEffect(() => {
        setItems((prev) => prev.filter((r) => isFavorite(r.id)));
    }, [version, isFavorite]);

    if (!token) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text>Zaloguj się, aby zobaczyć ulubione.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
            {loading && items.length === 0 ? (
                <ActivityIndicator />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(it, idx) => String(it.id ?? idx)}
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
                    onEndReached={() => {
                        if (!loading && hasMore) load(page + 1, false);
                    }}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={<Text>Brak ulubionych.</Text>}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </View>
    );
}
