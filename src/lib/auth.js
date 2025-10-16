
import api from "./api";

export async function onLogin({ email, password }) {
    const { data } = await api.post("/auth/login", { email, password });
    const token =
        data.accessToken || data.token || data.jwtToken || data.accestoken || data?.["access_token"];
    if (!token) throw new Error("Brak accessToken w odpowiedzi backendu");
    return { token, raw: data };
}

export async function onRegister({ name, surname, email, password }) {
    const { data } = await api.post("/auth/register", {
        name,
        surname: surname || null,
        email,
        password,
    });
    return data;
}
