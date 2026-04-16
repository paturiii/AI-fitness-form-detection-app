import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, ScrollView,
} from "react-native";
import { api } from "../../services/api";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Entypo from '@expo/vector-icons/Entypo';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export default function NewWorkout({ navigation }: Props) {
    const [muscleGroup, setMuscleGroup] = useState("");

    const [exercises, setExercises] = useState([
        { name: "", sets: "", reps: "", weight: "" },
    ]);
    const [loading, setLoading] = useState(false);
    const [splitLoading, setSplitLoading] = useState(false)

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
            navigation.goBack();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addSplit = async () => {
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

        setSplitLoading(true);

        try {
            await api("/workouts/add-split", {
                method: 'POST',
                body: {
                    muscle_group: muscleGroup,
                    exercises: exerciseMap,
                    date: new Date().toISOString().split("T")[0],
                },
            });
            navigation.goBack();
        }

        catch (err) {
            console.error(err)
        }

        finally {
            setSplitLoading(false)
        }
    };

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

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { opacity: 0.5 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.submitText}>
                            {loading ? "Saving..." : "Post Workout"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.addSplitBtn, splitLoading && { opacity: 0.5 }]}
                        onPress={addSplit}
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
        gap: 8 },

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
        fontSize: 16 },

    buttonRow: {
        flexDirection: "row",
        marginHorizontal: -20,
        padding: 16,
        gap: 15,
    },

    submitBtn: {
        flex: 1,
        backgroundColor: "#6C63FF",
        padding: 16,
        alignItems: "center",
        borderRadius: 12
    },

    submitText: { 
        color: "white", 
        fontSize: 18, 
        fontWeight: "600" },
    
    backButton:{
        marginHorizontal: 12
    },

    addSplitBtn: {
        flex: 1,
        backgroundColor: "#4CAF50",
        padding: 16,
        alignItems: "center",
        borderRadius: 12
    }
});