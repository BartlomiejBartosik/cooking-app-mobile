import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const baseURL =
    Constants.expoConfig?.extra?.apiUrl ??
    Constants.manifest2?.extra?.apiUrl ??
    "http://10.0.2.2:8080";

const api = axios.create({ baseURL });

api.interceptors.request.use(async (cfg) => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

export default api;