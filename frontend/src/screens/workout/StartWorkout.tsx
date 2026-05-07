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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { colors } from '../../services/values';
import ExerciseCard, { SetEntry, ExerciseEntry } from "../../components/ExerciseCard";

type Props = NativeStackScreenProps<any, "StartWorkout">;

type SetData = { reps: number; weight: number };
type ExercisesParam = Record<string, { sets: SetData[] }>;

export default function StartWorkout({ navigation, route }: Props) {
    const queryClient = useQueryClient();
    const { id, muscle_group, exercises: paramExercises } = route.params as {
        id: string;
        muscle_group: string;
        exercises: ExercisesParam;
    };

    const [muscleGroup, setMuscleGroup] = useState(muscle_group);
    const [exercises, setExercises] = useState<ExerciseEntry[]>(
        Object.entries(paramExercises).map(([name, details]) => ({
            name,
            sets: details.sets.map(s => ({
                reps: String(s.reps),
                weight: String(s.weight),
            })),
        }))
    );

    const [saved, setSaved] = useState<ExercisesParam>(paramExercises);
    const [savedMuscleGroup, setSavedMuscleGroup] = useState(muscle_group);

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ["home"] });
        queryClient.invalidateQueries({ queryKey: ["workouts"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
    };

    const uploadMutation = useMutation({
        mutationFn: (exerciseMap: ExercisesParam) =>
            api("/workouts/upload", {
                method: "POST",
                body: {
                    muscle_group: muscleGroup,
                    exercises: exerciseMap,
                    date: (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; })(),
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

    const addExercise = () => {
        setExercises([...exercises, { name: "", sets: [{ reps: "", weight: "" }] }]);
    };

    const removeExercise = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const updateExerciseName = (index: number, name: string) => {
        const updated = [...exercises];
        updated[index] = { ...updated[index], name };
        setExercises(updated);
    };

    const addSet = (exIndex: number) => {
        const updated = [...exercises];
        updated[exIndex] = {
            ...updated[exIndex],
            sets: [...updated[exIndex].sets, { reps: "", weight: "" }],
        };
        setExercises(updated);
    };

    const removeSet = (exIndex: number, setIndex: number) => {
        const updated = [...exercises];
        updated[exIndex] = {
            ...updated[exIndex],
            sets: updated[exIndex].sets.filter((_, i) => i !== setIndex),
        };
        setExercises(updated);
    };

    const updateSet = (exIndex: number, setIndex: number, field: keyof SetEntry, value: string) => {
        const updated = [...exercises];
        const sets = [...updated[exIndex].sets];
        sets[setIndex] = { ...sets[setIndex], [field]: value };
        updated[exIndex] = { ...updated[exIndex], sets };
        setExercises(updated);
    };

    const buildExerciseMap = (): ExercisesParam => {
        const map: ExercisesParam = {};
        for (const ex of exercises) {
            if (ex.name.trim()) {
                map[ex.name.trim()] = {
                    sets: ex.sets.map(s => ({
                        reps: parseInt(s.reps) || 0,
                        weight: parseInt(s.weight) || 0,
                    })),
                };
            }
        }
        return map;
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
        const exerciseMap = buildExerciseMap();
        updateSplitMutation.mutate(exerciseMap);
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

                <TouchableOpacity
                    style={[styles.submitBtn, loading && { opacity: 0.5 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitText}>
                        {loading ? "Logging..." : "Log Workout"}
                    </Text>
                </TouchableOpacity>

                {hasChanged() && (
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleEdit()}
                        disabled={loadEdit}
                    >
                        <Text style={[styles.submitText, { color: '#4CAF50' }]}>
                            {loadEdit ? "Saving..." : "Save Changes"}
                        </Text>
                    </TouchableOpacity>
                )}
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

    editBtn: {
        alignItems: 'center',
        marginTop: 16,
    },

    iconContainer: {
        marginHorizontal: 12,
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: "space-between",
    },
});
