import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useUserContext } from "../context/UserContext";
import api from "../lib/api";

export default function AddReviewScreen({ route, navigation }) {
    const { recipeId, title, existingRating, existingComment } = route.params || {};
    const { token } = useUserContext();

    const [stars, setStars] = useState(existingRating || 0);
    const [comment, setComment] = useState(existingComment || "");
    const [submitting, setSubmitting] = useState(false);
    const isEdit = existingRating != null;

    useEffect(() => {
        navigation.setOptions({
            title: isEdit ? "Edytuj recenzję" : "Dodaj recenzję",
        });
    }, [navigation, isEdit]);

    useEffect(() => {
        if (!token) {
            Alert.alert(
                "Zaloguj się",
                "Aby dodać lub edytować recenzję, musisz być zalogowany.",
                [
                    {
                        text: "Przejdź do logowania",
                        onPress: () => navigation.replace("LoginScreen"),
                    },
                    {
                        text: "Anuluj",
                        style: "cancel",
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        }
    }, [token, navigation]);

    const handleSubmit = async () => {
        if (!token) return;

        if (!stars || stars < 1 || stars > 5) {
            Alert.alert("Błąd", "Wybierz ocenę w skali 1–5.");
            return;
        }

        try {
            setSubmitting(true);

            await api.post(
                `/api/recipes/${recipeId}/rating`,
                {
                    stars,
                    comment: comment.trim() || null,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            navigation.goBack();
        } catch (e) {
            console.log("Add/Edit review error", e?.response || e);
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                "Nie udało się zapisać recenzji.";
            Alert.alert("Błąd", msg);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = () => {
        if (!token) return;

        Alert.alert(
            "Usuń recenzję",
            "Na pewno chcesz usunąć swoją recenzję?",
            [
                { text: "Anuluj", style: "cancel" },
                {
                    text: "Usuń",
                    style: "destructive",
                    onPress: handleDelete,
                },
            ]
        );
    };

    const handleDelete = async () => {
        try {
            setSubmitting(true);
            await api.delete(`/api/recipes/${recipeId}/rating`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            navigation.goBack();
        } catch (e) {
            console.log("Delete review error", e?.response || e);
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                "Nie udało się usunąć recenzji.";
            Alert.alert("Błąd", msg);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStarsRow = () => {
        const all = [1, 2, 3, 4, 5];
        return (
            <View style={styles.starsRow}>
                {all.map((s) => (
                    <TouchableOpacity
                        key={s}
                        onPress={() => setStars(s)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        disabled={submitting}
                    >
                        <Text
                            style={[
                                styles.star,
                                stars >= s
                                    ? styles.starActive
                                    : styles.starInactive,
                            ]}
                        >
                            ★
                        </Text>
                    </TouchableOpacity>
                ))}
                <Text style={styles.starsLabel}>
                    {stars
                        ? `Twoja ocena: ${stars}/5`
                        : "Dotknij gwiazdki, aby wybrać ocenę"}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.screen}>
            {!!title && (
                <Text style={styles.subtitle} numberOfLines={1}>
                    {title}
                </Text>
            )}

            {renderStarsRow()}

            <Text style={styles.label}>Komentarz (opcjonalnie)</Text>
            <TextInput
                style={styles.textArea}
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={600}
                placeholder="Podziel się wrażeniami z przepisu..."
                editable={!submitting}
            />

            <TouchableOpacity
                style={[
                    styles.submitBtn,
                    (!stars || submitting) && { opacity: 0.7 },
                ]}
                onPress={handleSubmit}
                disabled={submitting}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitText}>
                        {isEdit ? "Zapisz zmiany" : "Dodaj recenzję"}
                    </Text>
                )}
            </TouchableOpacity>

            {isEdit && (
                <TouchableOpacity
                    style={[
                        styles.deleteBtn,
                        submitting && { opacity: 0.6 },
                    ]}
                    onPress={confirmDelete}
                    disabled={submitting}
                >
                    <Text style={styles.deleteText}>Usuń recenzję</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    subtitle: {
        fontSize: 13,
        color: "#666",
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        color: "#555",
        marginBottom: 4,
        marginTop: 16,
    },
    starsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    star: {
        fontSize: 30,
    },
    starActive: {
        color: "#f5a623",
    },
    starInactive: {
        color: "#ddd",
    },
    starsLabel: {
        marginLeft: 8,
        fontSize: 12,
        color: "#666",
    },
    textArea: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        padding: 10,
        minHeight: 100,
        textAlignVertical: "top",
        fontSize: 14,
        backgroundColor: "#fafafa",
    },
    submitBtn: {
        marginTop: 20,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: "#f5a623",
        alignItems: "center",
    },
    submitText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
    deleteBtn: {
        marginTop: 12,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#fff5f5",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#f44336",
    },
    deleteText: {
        color: "#f44336",
        fontWeight: "700",
        fontSize: 14,
    },
});
