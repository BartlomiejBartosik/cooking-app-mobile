
import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [guest, setGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const t = await SecureStore.getItemAsync("accessToken");
            const g = await SecureStore.getItemAsync("guestMode");
            if (t) setToken(t);
            if (g === "1") setGuest(true);
            setLoading(false);
        })();
    }, []);

    const saveToken = async (t) => {
        await SecureStore.setItemAsync("accessToken", String(t));
        await SecureStore.deleteItemAsync("guestMode");
        setToken(t);
        setGuest(false);
    };

    const continueAsGuest = async () => {
        await SecureStore.setItemAsync("guestMode", "1");
        await SecureStore.deleteItemAsync("accessToken");
        setGuest(true);
        setToken(null);
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("guestMode");
        setToken(null);
        setGuest(false);
    };

    return (
        <UserContext.Provider value={{ token, guest, loading, saveToken, continueAsGuest, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);
export default UserProvider;

