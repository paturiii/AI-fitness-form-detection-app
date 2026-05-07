import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, ScrollView, Alert,
} from "react-native";
import { api } from "../../services/api";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import AntDesign from '@expo/vector-icons/AntDesign';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { colors } from '../../services/values';
import ExerciseCard from "../../components/ExerciseCard";
import { useWorkoutForm, ExercisesParam, getTodayDate } from "../../hooks/useWorkoutForm";

type Props = NativeStackScreenProps<any, "StartWorkout">;

export default function StartWorkout({ navigation, route }: Props) {
    const { id, muscle_group, exercises: paramExercises } = route.params as {
        id: string;
        muscle_group: string;
        exercises: ExercisesParam;
    };

    const [muscleGroup, setMuscleGroup] = useState(muscle_group);
    const [saved, setSaved] = useState<ExercisesParam>(paramExercises);
    const [savedMuscleGroup, setSavedMuscleGroup] = useState(muscle_group);

    const {
        exercises, invalidateAll, addExercise, removeExercise,
        updateExerciseName, addSet, removeSet, updateSet, buildExerciseMap,
    } = useWorkoutForm(
        Object.entries(paramExercises).map(([name, details]) => ({
            name,
            sets: details.sets.map(s => ({
                reps: String(s.reps),
                weight: String(s.weight),
            })),
        }))
    );

    const uploadMutation = useMutation({
        mutationFn: (exerciseMap: ExercisesParam) =>
            api("/workouts/upload", {
                method: "POST",
                body: {
                    muscle_group: muscleGroup,
                    exercises: exerciseMap,
                    date: getTodayDate(),
                },
            }),
        onSuccess: () => {
            invalidateAll();
            Alert.alert("Success", "Workout logged!", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        },
        onError: () => Alert.alert("Error", "Failed to log workout"),
    });

    const updateSplitMutation = useMutation({
        mutationFn: (exerciseMap: ExercisesParam) =>
            api("/workouts/update-split", {
                method: "PUT",
                body: { id, muscle_group: muscleGroup, exercises: exerciseMap },
            }),
        onSuccess: (_data, exerciseMap) => { invalidateAll(); setSaved(exerciseMap); setSavedMuscleGroup(muscleGroup); },
        onError: () => Alert.alert("Error", "Failed to update split"),
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            api(`/workouts/delete-split/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            invalidateAll();
            Alert.alert("Success", "Workout Split deleted", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        },
        onError: () => Alert.alert("Error", "Failed to delete split"),
    });

    const loading = uploadMutation.isPending || updateSplitMutation.isPending;
    const loadEdit = updateSplitMutation.isPending;

    const hasChanged = () => {
        if (muscleGroup !== savedMuscleGroup) return true;
        const original = Object.entries(saved);
        if (exercises.length !== original.length) return true;
        return exercises.some((ex, i) => {
            const [origName, origDetails] = original[i];
            if (ex.name !== origName) return true;
            if (ex.sets.length !== origDetails.sets.length) return true;
            return ex.sets.some((s, j) => {
                const orig = origDetails.sets[j];
                return s.reps !== String(orig.reps) || s.weight !== String(orig.weight);
            });
        });
    };

    const handleSubmit = () => {
        const exerciseMap = buildExerciseMap();

        if (hasChanged()) {
            Alert.alert(
                "Workout Modified",
                "You changed some values. Update your saved split too?",
                [
                    { text: "No", onPress: () => uploadMutation.mutate(exerciseMap) },
                    { text: "Yes", onPress: async () => {
                        await updateSplitMutation.mutateAsync(exerciseMap);
                        uploadMutation.mutate(exerciseMap);
                    }},
                ]
            );
        } else {
            uploadMutation.mutate(exerciseMap);
        }
    };

    const handleEdit = () => {
        updateSplitMutation.mutate(buildExerciseMap());
    };

    const pre_handle_delete = () => {
        Alert.alert("Delete", `Are you sure you want to delete your ${muscle_group} workout`, [
            { text: "Yes", onPress: () => deleteMutation.mutate() },
            { text: "No" },
        ]);
    };

    const handleGoBack = () => {
        if (hasChanged()) {
            Alert.alert("Unsaved Changes", "You have unsaved changes. Save before leaving?", [
                { text: "Save edits", onPress: async () => {
                    await updateSplitMutation.mutateAsync(buildExerciseMap());
                    navigation.goBack();
                }},
                { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
            ]);
        } else {
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => handleGoBack()}>
                    <Entypo name="chevron-small-left" size={40} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => pre_handle_delete()}>
                    <AntDesign name="delete" size={22} color="white" />
                </TouchableOpacity>
            </View>

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

                <View style={styles.rowContainer}>
                    {hasChanged() && (
                        <TouchableOpacity
                            style={styles.saveChanges}
                            onPress={() => handleEdit()}
                            disabled={loadEdit}
                        >
                            <Text style={styles.submitText}>
                                {loadEdit ? "Saving..." : "Save Changes"}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { opacity: 0.5 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.submitText}>
                            {loading ? "Logging..." : "Log Workout"}
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

    submitBtn: {
        flex: 1,
        backgroundColor: colors.purple,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
    },

    submitText: {
        color: "white",
        fontSize: 18,
        fontWeight: "600",
    },

    saveChanges: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.green,
        borderRadius: 12,
    },

    iconContainer: {
        marginHorizontal: 12,
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: "space-between",
    },

    rowContainer: {
        flexDirection: 'row',
        gap: 15,
    },
});
