import React, { useEffect, useState } from "react";
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useUserContext } from "../context/UserContext";
import LockedOverlay from "../components/LockedOverlay";
import api from "../lib/api";

export default function ProfileScreen({ navigation }) {
    const { token, logout } = useUserContext();

    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [loadingMe, setLoadingMe] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        if (!token) return;

        const loadMe = async () => {
            try {
                setLoadingMe(true);
                const res = await api.get("/api/user/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const u = res.data || {};
                setName(u.name || "");
                setSurname(u.surname || "");
                setEmail(u.email || "");
            } catch (e) {
                console.log("ME error", e?.response || e);
                if (e?.response?.status === 401 || e?.response?.status === 403) {
                    await logout();
                    navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
                }
            } finally {
                setLoadingMe(false);
            }
        };

        loadMe();
    }, [token]);

    const handleLogout = async () => {
        await logout();
        navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            Alert.alert("Błąd", "Imię nie może być puste.");
            return;
        }
        if (!email.trim()) {
            Alert.alert("Błąd", "Email nie może być pusty.");
            return;
        }

        try {
            setSavingProfile(true);
            await api.put(
                "/api/user/profile",
                { name: name.trim(), surname: surname.trim(), email: email.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert("Sukces", "Dane profilu zostały zaktualizowane.");
        } catch (e) {
            console.log("Profile update error", e?.response || e);
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                "Nie udało się zaktualizować profilu.";
            Alert.alert("Błąd", msg);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Błąd", "Uzupełnij wszystkie pola hasła.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Błąd", "Nowe hasła nie są takie same.");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Błąd", "Nowe hasło musi mieć co najmniej 6 znaków.");
            return;
        }

        try {
            setSavingPassword(true);
            await api.put(
                "/api/user/password",
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            Alert.alert("Sukces", "Hasło zostało zmienione.");
        } catch (e) {
            console.log("Password change error", e?.response || e);
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                "Nie udało się zmienić hasła.";
            Alert.alert("Błąd", msg);
        } finally {
            setSavingPassword(false);
        }
    };

    if (!token) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Profil</Text>
                <LockedOverlay navigation={navigation} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Profil</Text>

                {loadingMe ? (
                    <ActivityIndicator style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {/* Dane profilu */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Dane użytkownika</Text>

                            <Text style={styles.label}>Imię</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Imię"
                            />

                            <Text style={styles.label}>Nazwisko</Text>
                            <TextInput
                                style={styles.input}
                                value={surname}
                                onChangeText={setSurname}
                                placeholder="Nazwisko"
                            />

                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email"
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />

                            <TouchableOpacity
                                style={[styles.button, styles.saveBtn]}
                                onPress={handleSaveProfile}
                                disabled={savingProfile}
                            >
                                <Text style={styles.buttonText}>
                                    {savingProfile ? "Zapisywanie..." : "Zapisz zmiany"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Zmiana hasła</Text>

                            <Text style={styles.label}>Aktualne hasło</Text>
                            <TextInput
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                                placeholder="Aktualne hasło"
                            />

                            <Text style={styles.label}>Nowe hasło</Text>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                placeholder="Nowe hasło"
                            />

                            <Text style={styles.label}>Powtórz nowe hasło</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                placeholder="Powtórz nowe hasło"
                            />

                            <TouchableOpacity
                                style={[styles.button, styles.passwordBtn]}
                                onPress={handleChangePassword}
                                disabled={savingPassword}
                            >
                                <Text style={styles.buttonText}>
                                    {savingPassword ? "Zapisywanie..." : "Zmień hasło"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, styles.logoutBtn]}
                            onPress={handleLogout}
                        >
                            <Text style={styles.logoutText}>Wyloguj</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: "#fff",
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
        paddingTop: 56,
        backgroundColor: "#fff",
    },
    title: {
        position: "absolute",
        top: 24,
        left: 16,
        fontSize: 22,
        fontWeight: "700",
    },
    section: {
        marginBottom: 24,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eee",
        backgroundColor: "#fafafa",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 10,
    },
    label: {
        fontSize: 13,
        color: "#555",
        marginTop: 6,
        marginBottom: 2,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 14,
        backgroundColor: "#fff",
    },
    button: {
        marginTop: 14,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    saveBtn: {
        backgroundColor: "#1976d2",
    },
    passwordBtn: {
        backgroundColor: "#455a64",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
    logoutBtn: {
        backgroundColor: "#d32f2f",
        marginTop: 8,
    },
    logoutText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
        textAlign: "center",
    },
});
