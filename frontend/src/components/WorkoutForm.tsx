import React from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { colors } from "../services/values";
import ExerciseCard from "./ExerciseCard";
import { useWorkoutForm } from "../hooks/useWorkoutForm";

type WorkoutFormState = ReturnType<typeof useWorkoutForm>;

type Props = {
    form: WorkoutFormState;
    muscleGroup: string;
    onMuscleGroupChange: (value: string) => void;
    onBack: () => void;
    onDelete?: () => void;
    subtitle?: string;
    children: React.ReactNode;
};

export default function WorkoutForm({
    form,
    muscleGroup,
    onMuscleGroupChange,
    onBack,
    onDelete,
    subtitle,
    children,
}: Props) {
    const {
        exercises, addExercise, removeExercise,
        updateExerciseName, addSet, removeSet, updateSet,
    } = form;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.iconContainer}>
                <TouchableOpacity onPress={onBack}>
                    <Entypo name="chevron-small-left" size={40} color="white" />
                </TouchableOpacity>
                {onDelete && (
                    <TouchableOpacity onPress={onDelete}>
                        <AntDesign name="delete" size={22} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

                <Text style={styles.label}>Muscle Group</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Chest"
                    placeholderTextColor="#888"
                    value={muscleGroup}
                    onChangeText={onMuscleGroupChange}
                />

                <Text style={styles.label}>Exercises</Text>
                {exercises.map((ex, i) => (
                    <ExerciseCard
                        key={i}
                        exercise={ex}
                        canRemove={exercises.length > 1}
                        onNameChange={(v) => updateExerciseName(i, v)}
                        onAddSet={() => addSet(i)}
                        onRemoveSet={(si) => removeSet(i, si)}
                        onUpdateSet={(si, field, v) => updateSet(i, si, field, v)}
                        onRemove={() => removeExercise(i)}
                    />
                ))}

                <TouchableOpacity style={styles.addBtn} onPress={addExercise}>
                    <Ionicons name="add-circle-outline" size={20} color="white" />
                    <Text style={styles.addBtnText}>Add Exercise</Text>
                </TouchableOpacity>

                <View style={styles.buttonRow}>{children}</View>
            </ScrollView>
        </SafeAreaView>
    );
}

type ButtonProps = {
    label: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
    loading?: boolean;
    loadingLabel?: string;
    disabled?: boolean;
};

export function FormButton({
    label,
    onPress,
    variant = "primary",
    loading = false,
    loadingLabel,
    disabled = false,
}: ButtonProps) {
    const inactive = loading || disabled;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === "primary" ? styles.primary : styles.secondary,
                inactive && styles.inactive,
            ]}
            onPress={onPress}
            disabled={inactive}
        >
            <Text style={styles.buttonText}>
                {loading ? loadingLabel ?? label : label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundColor,
    },

    iconContainer: {
        marginHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    scroll: {
        padding: 20,
    },

    subtitle: {
        color: "#666",
        fontSize: 14,
        fontWeight: "500",
    },

    label: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        marginTop: 16,
        marginBottom: 8,
    },

    input: {
        backgroundColor: colors.inputfields,
        color: "white",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8,
    },

    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
        marginBottom: 24,
    },

    addBtnText: {
        color: "white",
        fontSize: 16,
    },

    buttonRow: {
        flexDirection: "row",
        gap: 15,
    },

    button: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
    },

    primary: {
        backgroundColor: colors.purple,
    },

    secondary: {
        backgroundColor: colors.green,
    },

    inactive: {
        opacity: 0.5,
    },

    buttonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "600",
    },
});
