import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { onRegister } from "../lib/auth";

const RegisterScreen = ({ navigation, route }) => {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState(route?.params?.emailPrefill || '');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return Alert.alert("Błąd", "Imię jest wymagane");
        if (!email.trim() || !email.includes("@")) return Alert.alert("Błąd", "Podaj poprawny e-mail");
        if (!password || password.length < 6) return Alert.alert("Błąd", "Hasło min. 6 znaków");

        setBusy(true);
        try {
            await onRegister({ name: name.trim(), surname: surname.trim(), email: email.trim(), password });
            Alert.alert("Sukces", "Konto utworzone. Zaloguj się.", [
                { text: "OK", onPress: () => navigation.navigate('Login')}
            ]);
        } catch (e) {
            const msg = e?.response?.data?.message || "Rejestracja nieudana";
            Alert.alert("Błąd", msg);
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <Text style={styles.title}>Cooking App{'\n'}</Text>
                <Text style={styles.subtitle}>Sign Up</Text>

                <View style={styles.formContainer}>
                    <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#a9a9a9" value={name} onChangeText={setName} />
                    <TextInput style={styles.input} placeholder="Surname (optional)" placeholderTextColor="#a9a9a9" value={surname} onChangeText={setSurname} />
                    <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#a9a9a9" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
                    <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#a9a9a9" secureTextEntry value={password} onChangeText={setPassword} />

                    <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={busy}>
                        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>SIGN UP</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f5ee', paddingHorizontal: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: '#333' },
    subtitle: { fontSize: 16, color: '#333', marginBottom: 40 },
    formContainer: { width: '100%', alignItems: 'center' },
    input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 15, fontSize: 16, marginBottom: 20, borderColor: '#ddd', borderWidth: 1 },
    button: { width: '100%', height: 50, backgroundColor: '#b89c7d', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default RegisterScreen;
