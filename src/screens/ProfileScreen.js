import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useUserContext } from "../context/UserContext";
import LockedOverlay from "../components/LockedOverlay";

export default function ProfileScreen({ navigation }) {
    const { token, logout } = useUserContext();

    const handleLogout = async () => {
        await logout();
        navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            {!token ? (
                <LockedOverlay navigation={navigation} />
            ) : (
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Wyloguj</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
    title: { position: "absolute", top: 40, fontSize: 20, fontWeight: "600" },
    logoutBtn: {
        backgroundColor: "#d32f2f",
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 10,
        minWidth: 180,
        alignItems: "center",
    },
    logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
