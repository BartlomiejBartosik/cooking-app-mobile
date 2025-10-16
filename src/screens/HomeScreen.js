
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useUserContext } from "../context/UserContext";

export default function HomeScreen() {
    const { userInfo, logout } = useUserContext();
    return (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:16 }}>
            <Text style={{ fontSize:22, marginBottom:12 }}>Witaj {userInfo?.email || ""} 👋</Text>
            <Text>Tu wkrótce lista przepisów…</Text>
            <TouchableOpacity onPress={logout} style={{ marginTop:24, padding:12, borderWidth:1, borderRadius:8 }}>
                <Text>Wyloguj</Text>
            </TouchableOpacity>
        </View>
    );
}
