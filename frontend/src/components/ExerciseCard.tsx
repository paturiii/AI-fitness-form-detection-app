import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../services/values";

export type SetEntry = { reps: string; weight: string };
export type ExerciseEntry = { name: string; sets: SetEntry[] };

type Props = {
    exercise: ExerciseEntry;
    canRemove: boolean;
    onNameChange: (name: string) => void;
    onAddSet: () => void;
    onRemoveSet: (setIndex: number) => void;
    onUpdateSet: (setIndex: number, field: keyof SetEntry, value: string) => void;
    onRemove: () => void;
};

export default function ExerciseCard({
    exercise,
    canRemove,
    onNameChange,
    onAddSet,
    onRemoveSet,
    onUpdateSet,
    onRemove,
}: Props) {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Exercise name"
                    placeholderTextColor="#888"
                    value={exercise.name}
                    onChangeText={onNameChange}
                />
                {canRemove && (
                    <TouchableOpacity onPress={onRemove}>
                        <Ionicons name="close-circle" size={24} color="#ff4444" />
                    </TouchableOpacity>
                )}
            </View>

            {exercise.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setRow}>
                    <Text style={styles.setLabel}>Set {setIndex + 1}</Text>
                    <TextInput
                        style={[styles.input, styles.smallInput]}
                        placeholder="Reps"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                        value={set.reps}
                        onChangeText={(v) => onUpdateSet(setIndex, "reps", v)}
                    />
                    <TextInput
                        style={[styles.input, styles.smallInput]}
                        placeholder="lbs"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                        value={set.weight}
                        onChangeText={(v) => onUpdateSet(setIndex, "weight", v)}
                    />
                    {exercise.sets.length > 1 && (
                        <TouchableOpacity onPress={() => onRemoveSet(setIndex)}>
                            <Ionicons name="remove-circle-outline" size={20} color="#ff4444" />
                        </TouchableOpacity>
                    )}
                </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet}>
                <Ionicons name="add-circle-outline" size={16} color="#888" />
                <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#1a1a1a",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },

    input: {
        backgroundColor: colors.inputfields,
        color: "white",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8,
    },

    setRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    setLabel: {
        color: "#888",
        fontSize: 13,
        width: 40,
    },

    smallInput: {
        flex: 1,
    },

    addSetBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },

    addSetText: {
        color: "#888",
        fontSize: 13,
    },
});
