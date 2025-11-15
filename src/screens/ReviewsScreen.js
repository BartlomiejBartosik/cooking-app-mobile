import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useUserContext } from "../context/UserContext";
import api from "../lib/api";

export default function ReviewsScreen({ route, navigation }) {
    const { recipeId, title } = route.params || {};
    const { token } = useUserContext();

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [avg, setAvg] = useState(null);
    const [count, setCount] = useState(0);
    const [myRating, setMyRating] = useState(null);
    const [myComment, setMyComment] = useState("");

    const load = useCallback(async () => {
        if (!recipeId) return;
        try {
            setLoading(true);

            const headers = token
                ? { Authorization: `Bearer ${token}` }
                : undefined;

            const res = await api.get(`/api/recipes/${recipeId}/rating`, {
                headers,
            });

            const list = Array.isArray(res.data) ? res.data : [];
            setItems(list);

            const c = list.length;
            const sum = list.reduce((acc, r) => {
                const s = Number(r.stars);
                return acc + (Number.isFinite(s) ? s : 0);
            }, 0);
            const avgCalc = c > 0 ? sum / c : null;
            setCount(c);
            setAvg(avgCalc);

            const mine = list.find((r) => r.mine);
            if (mine) {
                setMyRating(mine.stars);
                setMyComment(mine.comment || "");
            } else {
                setMyRating(null);
                setMyComment("");
            }
        } catch (e) {
            console.log("Reviews load error", e?.response || e);
            Alert.alert("Błąd", "Nie udało się pobrać recenzji.");
        } finally {
            setLoading(false);
        }
    }, [recipeId, token]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const openAddOrEdit = () => {
        if (!token) {
            navigation.navigate("LoginScreen");
            return;
        }

        navigation.navigate("AddReviewScreen", {
            recipeId,
            title,
            existingRating: myRating,
            existingComment: myComment,
        });
    };

    const renderItem = ({ item }) => {
        const stars = item.stars ?? 0;
        const userName = item.userName || "Użytkownik";

        let dateLabel = "";
        if (item.createdAt) {
            const d = new Date(item.createdAt);
            if (!isNaN(d.getTime())) {
                dateLabel = d.toLocaleDateString();
            }
        }

        return (
            <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>
                        {userName}
                        {item.mine ? " (Ty)" : ""}
                    </Text>
                    <Text style={styles.reviewStars}>
                        {"★".repeat(stars)}
                        <Text style={styles.reviewStarsGray}> {stars}/5</Text>
                    </Text>
                </View>
                {item.comment ? (
                    <Text style={styles.reviewComment}>{item.comment}</Text>
                ) : null}
                {dateLabel ? (
                    <Text style={styles.reviewDate}>{dateLabel}</Text>
                ) : null}
            </View>
        );
    };

    const avgLabel =
        avg != null
            ? (avg.toFixed ? avg.toFixed(1) : avg)
            : "-.-";

    const buttonLabel = !token
        ? "Zaloguj się, aby dodać recenzję"
        : myRating != null
            ? "Edytuj swoją recenzję"
            : "Dodaj recenzję";

    return (
        <View style={styles.screen}>
            {!!title && (
                <Text style={styles.subtitleTop} numberOfLines={1}>
                    {title}
                </Text>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator />
                </View>
            ) : (
                <>
                    <View style={styles.summaryRow}>
                        <View>
                            <Text style={styles.avgText}>{avgLabel}</Text>
                            <Text style={styles.avgLabel}>
                                średnia z {count || 0} ocen
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                !token && styles.actionBtnOutline,
                            ]}
                            onPress={openAddOrEdit}
                        >
                            <Text
                                style={[
                                    styles.actionBtnText,
                                    !token && styles.actionBtnTextOutline,
                                ]}
                            >
                                {buttonLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={items}
                        keyExtractor={(item, idx) => String(item.id ?? idx)}
                        renderItem={renderItem}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>
                                Brak recenzji. Bądź pierwszy i oceń ten przepis!
                            </Text>
                        }
                        contentContainerStyle={{ paddingBottom: 24 }}
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    subtitleTop: {
        fontSize: 13,
        color: "#666",
        marginBottom: 8,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    avgText: {
        fontSize: 28,
        fontWeight: "800",
        color: "#111",
    },
    avgLabel: {
        fontSize: 13,
        color: "#666",
    },
    actionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "#f5a623",
    },
    actionBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 12,
    },
    actionBtnOutline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#f5a623",
    },
    actionBtnTextOutline: {
        color: "#f5a623",
    },
    reviewCard: {
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
        backgroundColor: "#fafafa",
    },
    reviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    reviewUser: {
        fontSize: 13,
        fontWeight: "600",
        color: "#333",
    },
    reviewStars: {
        fontSize: 14,
        color: "#f5a623",
    },
    reviewStarsGray: {
        fontSize: 12,
        color: "#777",
    },
    reviewComment: {
        fontSize: 13,
        color: "#444",
        marginBottom: 4,
    },
    reviewDate: {
        fontSize: 10,
        color: "#999",
    },
    emptyText: {
        textAlign: "center",
        marginTop: 20,
        color: "#777",
        fontSize: 13,
    },
});
