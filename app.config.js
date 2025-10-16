export default ({ config }) => ({
    ...config,
    extra: {
        apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8080", // Android emulator
        // iOS simulator fallback: http://localhost:8080
    },
});