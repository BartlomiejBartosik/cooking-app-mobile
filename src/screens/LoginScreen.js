import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onLogin } from "../lib/auth";
import { useUserContext } from "../context/UserContext";

export default function LoginScreen({ navigation, route }) {
    const [email, setEmail] = useState(route?.params?.emailPrefill || "");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const { saveToken, continueAsGuest } = useUserContext();

    const handleLogin = async () => {
        if (!email || !password) return;
        setBusy(true);
        try {
            const { token } = await onLogin({ email: email.trim(), password });
            await saveToken(token);
            navigation.reset({ index: 0, routes: [{ name: "BottomNav" }] });
        } catch (e) {
            const msg = e?.response?.data?.message || e.message || "Błąd logowania";
            Alert.alert("Logowanie nieudane", msg);
        } finally {
            setBusy(false);
        }
    };

    const handleGuest = async () => {
        await continueAsGuest();
        navigation.reset({ index: 0, routes: [{ name: "BottomNav" }] });
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <Text style={styles.title}>Cooking App{"\n"}</Text>
                <Text style={styles.subtitle}>Sign In</Text>

                <View style={styles.formContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#a9a9a9"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#a9a9a9"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={busy}>
                        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>SIGN IN</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                        <Text style={styles.switchText}>
                            Need an account? <Text style={styles.switchTextBold}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>

                    <View style={{ height: 24 }} />
                    <TouchableOpacity style={[styles.button, { backgroundColor: "#666" }]} onPress={handleGuest} disabled={busy}>
                        <Text style={styles.buttonText}>CONTINUE AS GUEST</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:{ flex:1, justifyContent:"center", alignItems:"center", backgroundColor:"#f7f5ee", paddingHorizontal:20 },
    title:{ fontSize:24, fontWeight:"bold", marginBottom:5, color:"#333" },
    subtitle:{ fontSize:16, color:"#333", marginBottom:40 },
    formContainer:{ width:"100%", alignItems:"center" },
    input:{ width:"100%", height:50, backgroundColor:"#fff", borderRadius:8, paddingHorizontal:15, fontSize:16, marginBottom:20, borderColor:"#ddd", borderWidth:1 },
    button:{ width:"100%", height:50, backgroundColor:"#b89c7d", borderRadius:8, justifyContent:"center", alignItems:"center", marginBottom:12 },
    buttonText:{ color:"#fff", fontSize:16, fontWeight:"bold" },
    switchText:{ color:"#333", fontSize:14 },
    switchTextBold:{ fontWeight:"bold", color:"#b89c7d" },
});
