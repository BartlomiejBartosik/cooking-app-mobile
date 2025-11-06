import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";

export default function CookingStepScreen({ route, navigation }) {
    const { recipe } = route.params || {};
    const steps = useMemo(
        () => (recipe?.steps || []).slice().sort((a, b) => (a.stepNo ?? 0) - (b.stepNo ?? 0)),
        [recipe]
    );

    const [idx, setIdx] = useState(0);
    const [remaining, setRemaining] = useState(0); // sekundy do końca
    const [running, setRunning] = useState(false);
    const tickRef = useRef(null);

    const step = steps[idx];

    const secondsFromStep = (s) => {
        // Ustaw minutnik na czas z kroku; brak czasu => 0 (manualne przejście)
        const mins = Number(s?.timeMin ?? 0);
        return Number.isFinite(mins) && mins > 0 ? Math.round(mins * 60) : 0;
    };

    const resetToStepTime = (i = idx) => {
        setRunning(false);
        setRemaining(secondsFromStep(steps[i]));
    };

    useEffect(() => {
        resetToStepTime(0);
    }, []);

    useEffect(() => {
        resetToStepTime(idx);
    }, [idx]);

    useEffect(() => {
        if (running && remaining > 0) {
            tickRef.current = setInterval(() => {
                setRemaining((r) => (r > 0 ? r - 1 : 0));
            }, 1000);
        }
        return () => {
            if (tickRef.current) clearInterval(tickRef.current);
            tickRef.current = null;
        };
    }, [running, remaining]);

    useEffect(() => {
        if (running && remaining === 0) {
            setRunning(false);
            if (idx < steps.length - 1) {
                Alert.alert(
                    "Czas minął",
                    "Przejść do następnego kroku?",
                    [
                        { text: "Zostań", style: "cancel" },
                        {
                            text: "Następny",
                            onPress: () => setIdx((i) => Math.min(steps.length - 1, i + 1)),
                        },
                    ]
                );
            } else {
                Alert.alert("Czas minął", "To był ostatni krok. Zakończyć?", [
                    { text: "OK", onPress: () => navigation.goBack() },
                ]);
            }
        }
    }, [remaining, running]);

    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");

    if (!step) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <Text>Brak kroków w tym przepisie.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{recipe?.title || "Przepis"}</Text>

            <View style={styles.stepHeader}>
                <Text style={styles.stepBadge}>{idx + 1}/{steps.length}</Text>
                {!!step.timeMin && <Text style={styles.stepTime}>Ustawiono: ~{step.timeMin} min</Text>}
            </View>

            <Text style={styles.instruction}>{step.instruction || "Brak treści kroku."}</Text>

            <View style={styles.timerBox}>
                <Text style={styles.timerText}>{mm}:{ss}</Text>
                <View style={styles.timerRow}>
                    <TouchableOpacity
                        onPress={() => setRunning((r) => !r)}
                        disabled={remaining === 0 && steps.length === 0}
                        style={[styles.timerBtn, running ? styles.btnPause : styles.btnStart]}
                    >
                        <Text style={styles.timerBtnText}>{running ? "Pauza" : "Start"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => resetToStepTime()}
                        style={[styles.timerBtn, styles.btnReset]}
                    >
                        <Text style={[styles.timerBtnText, { color: "#111" }]}>Reset</Text>
                    </TouchableOpacity>
                </View>
                {remaining === 0 && secondsFromStep(step) === 0 && (
                    <Text style={styles.timerHint}>
                        Ten krok nie ma zdefiniowanego czasu — przejdź dalej, gdy skończysz.
                    </Text>
                )}
            </View>

            <View style={styles.navRow}>
                <TouchableOpacity
                    onPress={() => setIdx((i) => Math.max(0, i - 1))}
                    disabled={idx === 0}
                    style={[styles.navBtn, idx === 0 && styles.navBtnDisabled]}
                >
                    <Text style={styles.navText}>Wstecz</Text>
                </TouchableOpacity>

                {idx < steps.length - 1 ? (
                    <TouchableOpacity
                        onPress={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}
                        style={[styles.navBtn, styles.navBtnPrimary]}
                    >
                        <Text style={[styles.navText, { color: "#fff" }]}>Następny krok</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.navBtn, styles.navBtnPrimary]}
                    >
                        <Text style={[styles.navText, { color: "#fff" }]}>Zakończ</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{ flex:1, backgroundColor:"#fff", padding:16 },
    title:{ fontSize:18, fontWeight:"700", color:"#111", marginBottom:8 },
    stepHeader:{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:8 },
    stepBadge:{
        backgroundColor:"#b89c7d", color:"#fff", fontWeight:"700",
        borderRadius:999, paddingVertical:4, paddingHorizontal:10
    },
    stepTime:{ color:"#444", fontWeight:"600" },
    instruction:{ fontSize:16, color:"#111", lineHeight:22, marginTop:6 },

    timerBox:{
        marginTop:18, borderWidth:1, borderColor:"#e2e0d7", backgroundColor:"#f7f5ee",
        borderRadius:12, padding:14, alignItems:"center"
    },
    timerText:{ fontSize:36, fontWeight:"800", color:"#111" },
    timerRow:{ flexDirection:"row", gap:10, marginTop:12, alignSelf:"stretch" },
    timerBtn:{
        flex:1, alignItems:"center", paddingVertical:12, borderRadius:10,
        borderWidth:1, borderColor:"#ddd"
    },
    btnStart:{ backgroundColor:"#e8f7ec", borderColor:"#b9e4c4" },
    btnPause:{ backgroundColor:"#fff7e8", borderColor:"#ffe0a8" },
    btnReset:{ backgroundColor:"#eee" },
    timerBtnText:{ fontWeight:"700", color:"#111" },
    timerHint:{ marginTop:10, color:"#666", fontSize:12 },

    navRow:{ flexDirection:"row", gap:10, marginTop:18 },
    navBtn:{
        flex:1, alignItems:"center", paddingVertical:12, borderRadius:10,
        borderWidth:1, borderColor:"#ddd", backgroundColor:"#fafafa"
    },
    navBtnPrimary:{ backgroundColor:"#b89c7d", borderColor:"#b89c7d" },
    navBtnDisabled:{ opacity:0.5 },
    navText:{ fontWeight:"700", color:"#111" },
});
