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
import { colors } from '../../services/values';

type Props = NativeStackScreenProps<any, "StartWorkout">;

type SetData = { reps: number; weight: number };
type ExercisesParam = Record<string, { sets: SetData[] }>;
type SetEntry = { reps: string; weight: string };
type ExerciseEntry = { name: string; sets: SetEntry[] };

export default function StartWorkout({ navigation, route }: Props) {
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

    const [loading, setLoading] = useState(false);
    const [loadEdit, setLoadEdit] = useState(false);
    const [saved, setSaved] = useState<ExercisesParam>(paramExercises);

    const hasChanged = () => {
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

    const handleSubmit = async () => {
        const exerciseMap = buildExerciseMap();

        if (hasChanged()) {
            Alert.alert(
                "Workout Modified",
                "You changed some values. Update your saved split too?",
                [
                    { text: "No", onPress: () => submitWorkout(exerciseMap) },
                    { text: "Yes", onPress: () => updateSplitAndLog(exerciseMap) },
                ]
            );
        } else {
            await submitWorkout(exerciseMap);
        }
    };

    const updateSplitAndLog = async (exerciseMap: ExercisesParam) => {
        setLoading(true);
        try {
            await api("/workouts/update-split", {
                method: "PUT",
                body: {
                    id,
                    muscle_group: muscleGroup,
                    exercises: exerciseMap,
                },
            });
        } catch {
            Alert.alert("Error", "Failed to update split");
        }
        await submitWorkout(exerciseMap);
    };

    const submitWorkout = async (exerciseMap: ExercisesParam) => {
        setLoading(true);
        try {
            await api("/workouts/upload", {
                method: "POST",
                body: {
                    muscle_group: muscleGroup,
                    exercises: exerciseMap,
                    date: new Date().toISOString().split("T")[0],
                },
            });
            Alert.alert("Success", "Workout logged!", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } catch {
            Alert.alert("Error", "Failed to log workout");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async () => {
        const exerciseMap = buildExerciseMap();
        setLoadEdit(true);
        try {
            await api("/workouts/update-split", {
                method: "PUT",
                body: {
                    id,
                    muscle_group: muscleGroup,
                    exercises: exerciseMap,
                },
            });
        } catch {
            Alert.alert("Error", "Failed to update split");
        } finally {
            setLoadEdit(false);
            setSaved(exerciseMap);
        }
    };

    const pre_handle_delete = async () => {
        Alert.alert("Delete", `Are you sure you want to delete your ${muscle_group} workout`, [{ text: "Yes", onPress: () => handle_delete() }, { text: "No" }]);
    };

    const handle_delete = async () => {
        try {
            await api(`/workouts/delete-split/${id}`, {
                method: "DELETE",
            });
            Alert.alert("Success", "Workout Split deleted", [{ text: "OK", onPress: () => navigation.goBack() }]);
        } catch {
            Alert.alert("Error", "Failed to delete split");
        }
    };

    const handleGoBack = async () => {
        if (hasChanged()) {
            Alert.alert("Unsaved Changes", "You have unsaved changes. Save before leaving?", [
                { text: "Save edits", onPress: async () => { await handleEdit(); navigation.goBack(); } },
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
                {exercises.map((ex, exIndex) => (
                    <View key={exIndex} style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                placeholder="Exercise name"
                                placeholderTextColor="#888"
                                value={ex.name}
                                onChangeText={(v) => updateExerciseName(exIndex, v)}
                            />
                            {exercises.length > 1 && (
                                <TouchableOpacity onPress={() => removeExercise(exIndex)}>
                                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {ex.sets.map((set, setIndex) => (
                            <View key={setIndex} style={styles.setRow}>
                                <Text style={styles.setLabel}>Set {setIndex + 1}</Text>
                                <TextInput
                                    style={[styles.input, styles.smallInput]}
                                    placeholder="Reps"
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={set.reps}
                                    onChangeText={(v) => updateSet(exIndex, setIndex, "reps", v)}
                                />
                                <TextInput
                                    style={[styles.input, styles.smallInput]}
                                    placeholder="lbs"
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={set.weight}
                                    onChangeText={(v) => updateSet(exIndex, setIndex, "weight", v)}
                                />
                                {ex.sets.length > 1 && (
                                    <TouchableOpacity onPress={() => removeSet(exIndex, setIndex)}>
                                        <Ionicons name="remove-circle-outline" size={20} color="#ff4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(exIndex)}>
                            <Ionicons name="add-circle-outline" size={16} color="#888" />
                            <Text style={styles.addSetText}>Add Set</Text>
                        </TouchableOpacity>
                    </View>
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

    exerciseCard: {
        backgroundColor: "#1a1a1a",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },

    exerciseHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
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
