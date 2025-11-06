// src/components/SegmentedToggle.js
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SegmentedToggle({ options, value, onChange, onLockedPress }) {
    return (
        <View style={styles.wrap}>
            {options.map((opt, i) => {
                const active = value === opt.key;
                const disabled = !!opt.disabled;

                const handlePress = () => {
                    if (disabled) {
                        onLockedPress?.(opt);
                        return;
                    }
                    onChange(opt.key);
                };

                return (
                    <Pressable
                        key={opt.key}
                        onPress={handlePress}
                        disabled={false}
                        style={[
                            styles.segment,
                            i === 0 && styles.left,
                            i === options.length - 1 && styles.right,
                            active && !disabled && styles.active,
                            disabled && styles.disabled
                        ]}
                    >
                        <View style={styles.segmentInner}>
                            {disabled ? (
                                <Ionicons name="lock-closed-outline" size={16} style={styles.lock} />
                            ) : active ? (
                                <Ionicons name="checkmark" size={16} style={styles.check} />
                            ) : null}
                            <Text
                                style={[
                                    styles.label,
                                    active && !disabled && styles.labelActive,
                                    disabled && styles.labelDisabled
                                ]}
                            >
                                {opt.label}
                            </Text>
                        </View>

                        {i !== options.length - 1 && <View style={styles.divider} />}
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: "row",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#DDD",
        overflow: "hidden",
        backgroundColor: "#fff",
    },
    segment: {
        flex: 1,
        paddingVertical: 12,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    left: { borderTopLeftRadius: 999, borderBottomLeftRadius: 999 },
    right: { borderTopRightRadius: 999, borderBottomRightRadius: 999 },
    segmentInner: { flexDirection: "row", alignItems: "center", gap: 6 },
    active: { backgroundColor: "#EFE8FF" },
    disabled: { backgroundColor: "#fafafa" },
    label: { fontSize: 15, color: "#222" },
    labelActive: { fontWeight: "600" },
    labelDisabled: { color: "#999" },
    check: { color: "#5a46c6" },
    lock: { color: "#777" },
    divider: {
        position: "absolute",
        right: 0,
        top: 8,
        bottom: 8,
        width: StyleSheet.hairlineWidth,
        backgroundColor: "#CCC",
    },
});
