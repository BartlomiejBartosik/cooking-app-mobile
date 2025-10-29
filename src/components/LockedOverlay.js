import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

export default function LockedOverlay({ navigation, message="Opcja dla zalogowanych użytkowników" }) {
    return (
        <View style={styles.overlay}>
            <Text style={styles.text}>{message}</Text>
            <Button title="Przejdź do logowania" onPress={() => navigation.navigate("LoginScreen")} />
        </View>
    );
}
const styles = StyleSheet.create({
    overlay:{ ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(0,0,0,0.45)", alignItems:"center", justifyContent:"center", padding:16 },
    text:{ color:"#fff", fontSize:16, marginBottom:12, textAlign:"center" },
});
