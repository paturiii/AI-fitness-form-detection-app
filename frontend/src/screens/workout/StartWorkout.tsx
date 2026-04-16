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
import {colors} from '../../services/values'

type Props = NativeStackScreenProps<any, "StartWorkout">;

export default function StartWorkout({ navigation, route }: Props) {


    const { id, muscle_group, exercises: paramExercises } = route.params as {
        id: string;
        muscle_group: string;
        exercises: Record<string, { sets: number; reps: number; weight: number }>;
    };

    const [muscleGroup, setMuscleGroup] = useState(muscle_group);
    const [exercises, setExercises] = useState(
        Object.entries(paramExercises).map(([name, details]) => ({
            name,
            sets: String(details.sets),
            reps: String(details.reps),
            weight: String(details.weight),
        }))
    );

    const [loading, setLoading] = useState(false);
    const [loadEdit, setLoadEdit] = useState(false);
    const [saved, setSaved] = useState(paramExercises);

    const hasChanged = () => {
        const original = Object.entries(saved);
        if (exercises.length !== original.length) return true;
        return exercises.some((ex, i) => {
            const [origName, origDetails] = original[i];
            return (
                ex.name !== origName || ex.sets !== String(origDetails.sets) || ex.reps !== String(origDetails.reps) || ex.weight !== String(origDetails.weight)
            );
        });
    };

    const addExercise = () => {
        setExercises([...exercises, { name: "", sets: "", reps: "", weight: "" }]);
    };

    const updateExercise = (index: number, field: string, value: string) => {
        const updated = [...exercises];
        updated[index] = { ...updated[index], [field]: value };
        setExercises(updated);
    };

    const removeExercise = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        const exerciseMap: Record<string, { sets: number; reps: number; weight: number }> = {};
        for (const ex of exercises) {
            if (ex.name.trim()) {
                exerciseMap[ex.name.trim()] = {
                    sets: parseInt(ex.sets) || 0,
                    reps: parseInt(ex.reps) || 0,
                    weight: parseInt(ex.weight) || 0,
                };
            }
        }

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

    const updateSplitAndLog = async (exerciseMap: Record<string, { sets: number; reps: number; weight: number }>) => {
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

    const submitWorkout = async (exerciseMap: Record<string, { sets: number; reps: number; weight: number }>) => {
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
        const exerciseMap: Record<string, { sets: number; reps: number; weight: number }> = {};
        for (const ex of exercises) {
            if (ex.name.trim()) {
                exerciseMap[ex.name.trim()] = {
                    sets: parseInt(ex.sets) || 0,
                    reps: parseInt(ex.reps) || 0,
                    weight: parseInt(ex.weight) || 0,
                };
            }
        }

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
            setSaved(exerciseMap)
        }
    };

    const pre_handle_delete = async () => {
        Alert.alert("Delete", `Are you sure you want to delete you ${muscle_group} workout`, [{text : "Yes", onPress: () => handle_delete() }, {text : "No"}])
    }

    const handle_delete = async () => {

        try {
            await api(`/workouts/delete-split/${id}`, {
                method : "DELETE",
            });

            Alert.alert("Success", "Workout Split deleted", [{text : "OK", onPress: () => navigation.goBack() }])
        } catch {
            Alert.alert("Error Failed to delete spit")
        }
    };

    const handleGoBack = async () => {
        if (hasChanged()) {
            Alert.alert("Unsaved Changes", "You have unsaved changes. Save before leaving?", [{text: "Save edits", onPress: async () => {
                await handleEdit();
                navigation.goBack();
            }},{text: "Discard", style: "destructive", onPress: () => navigation.goBack()}])
        }
        else {
            navigation.goBack()
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
                {exercises.map((ex, index) => (
                    <View key={index} style={styles.exerciseRow}>
                        <TextInput
                            style={[styles.input, { flex: 2 }]}
                            placeholder="Exercise name"
                            placeholderTextColor="#888"
                            value={ex.name}
                            onChangeText={(v) => updateExercise(index, "name", v)}
                        />
                        <TextInput
                            style={[styles.input, styles.smallInput]}
                            placeholder="Sets"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={ex.sets}
                            onChangeText={(v) => updateExercise(index, "sets", v)}
                        />
                        <TextInput
                            style={[styles.input, styles.smallInput]}
                            placeholder="Reps"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={ex.reps}
                            onChangeText={(v) => updateExercise(index, "reps", v)}
                        />
                        <TextInput
                            style={[styles.input, styles.smallInput]}
                            placeholder="lbs"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={ex.weight}
                            onChangeText={(v) => updateExercise(index, "weight", v)}
                        />
                        {exercises.length > 1 && (
                            <TouchableOpacity onPress={() => removeExercise(index)}>
                                <Ionicons name="close-circle" size={24} color="#ff4444" />
                            </TouchableOpacity>
                        )}
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
                        <Text style={[styles.submitText, {color: '#4CAF50'}]}>
                            {loadEdit ? "Logging..." : "Save Changes"}
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
        backgroundColor: "#0f0f0f"
    },

    scroll: { 
        padding: 20
    },

    label: { 
        color: "white", 
        fontSize: 16, 
        fontWeight: "600", 
        marginTop: 16,
        marginBottom: 8 },

    input: {
        backgroundColor: "#2E2E2E",
        color: "white",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8,
    },

    exerciseRow: { 
        flexDirection: "row", 
        alignItems: "center", 
        gap: 8 
    },

    smallInput: {
        flex: 1
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
        fontSize: 16
    },

    submitBtn: {
        backgroundColor: '#6C63FF',
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
    },

    submitText: { 
        color: "white", 
        fontSize: 18, 
        fontWeight: "600" 
    },

    editBtn: {
        alignItems: 'center',
        marginTop: 16
    },

    iconContainer: {
        marginHorizontal: 12,
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: "space-between"
    }
});
