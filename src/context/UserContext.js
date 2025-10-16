
import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const t = await SecureStore.getItemAsync("accessToken");
            if (t) setToken(t);
            setLoading(false);
        })();
    }, []);

    const saveToken = async (t) => {
        await SecureStore.setItemAsync("accessToken", String(t));
        setToken(t);
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync("accessToken");
        setToken(null);
        setUserInfo(null);
    };

    return (
        <UserContext.Provider value={{ token, userInfo, setUserInfo, saveToken, logout, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);
export default UserProvider;

