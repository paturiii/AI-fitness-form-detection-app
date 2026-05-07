import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, ScrollView,
} from "react-native";
import { api } from "../../services/api";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import Entypo from '@expo/vector-icons/Entypo';
import { colors } from "../../services/values";
import ExerciseCard from "../../components/ExerciseCard";
import { useWorkoutForm, getTodayDate } from "../../hooks/useWorkoutForm";

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export default function NewWorkout({ navigation }: Props) {
    const [muscleGroup, setMuscleGroup] = useState("");

    const {
        exercises, invalidateAll, addExercise, removeExercise,
        updateExerciseName, addSet, removeSet, updateSet, buildExerciseMap,
    } = useWorkoutForm([{ name: "", sets: [{ reps: "", weight: "" }] }]);

    const uploadMutation = useMutation({
        mutationFn: () =>
            api("/workouts/upload", {
                method: "POST",
                body: {
                    muscle_group: muscleGroup,
                    exercises: buildExerciseMap(),
                    date: getTodayDate(),
                },
            }),
        onSuccess: () => { invalidateAll(); navigation.goBack(); },
    });

    const splitMutation = useMutation({
        mutationFn: () =>
            api("/workouts/add-split", {
                method: "POST",
                body: {
                    muscle_group: muscleGroup,
                    exercises: buildExerciseMap(),
                    date: getTodayDate(),
                },
            }),
        onSuccess: () => { invalidateAll(); navigation.goBack(); },
    });

    const loading = uploadMutation.isPending;
    const splitLoading = splitMutation.isPending;

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Entypo name="chevron-small-left" size={35} color="white" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.scroll}>

                <Text style={styles.label}>Muscle Group</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Chest"
                    placeholderTextColor="#888"
                    value={muscleGroup}
                    onChangeText={setMuscleGroup}
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

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { opacity: 0.5 }]}
                        onPress={() => uploadMutation.mutate()}
                        disabled={loading}
                    >
                        <Text style={styles.submitText}>
                            {loading ? "Saving..." : "Post Workout"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.addSplitBtn, splitLoading && { opacity: 0.5 }]}
                        onPress={() => splitMutation.mutate()}
                        disabled={splitLoading}
                    >
                        <Text style={styles.submitText}>
                            {splitLoading ? "Saving..." : "Save Split"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundColor,
    },

    scroll: {
        padding: 20,
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
        marginHorizontal: -20,
        padding: 16,
        gap: 15,
    },

    submitBtn: {
        flex: 1,
        backgroundColor: colors.purple,
        padding: 16,
        alignItems: "center",
        borderRadius: 12,
    },

    submitText: {
        color: "white",
        fontSize: 18,
        fontWeight: "600",
    },

    backButton: {
        marginHorizontal: 12,
    },

    addSplitBtn: {
        flex: 1,
        backgroundColor: colors.green,
        padding: 16,
        alignItems: "center",
        borderRadius: 12,
    },
});
