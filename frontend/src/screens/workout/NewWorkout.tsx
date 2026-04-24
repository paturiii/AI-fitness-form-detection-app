import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, ScrollView,
} from "react-native";
import { api } from "../../services/api";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Entypo from '@expo/vector-icons/Entypo';
import { colors } from "../../services/values";
import ExerciseCard, { SetEntry, ExerciseEntry } from "../../components/ExerciseCard";

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export default function NewWorkout({ navigation }: Props) {
    const [muscleGroup, setMuscleGroup] = useState("");
    const [exercises, setExercises] = useState<ExerciseEntry[]>([
        { name: "", sets: [{ reps: "", weight: "" }] },
    ]);
    const [loading, setLoading] = useState(false);
    const [splitLoading, setSplitLoading] = useState(false);

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

    const buildExerciseMap = () => {
        const map: Record<string, { sets: { reps: number; weight: number }[] }> = {};
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
        setLoading(true);
        try {
            await api("/workouts/upload", {
                method: "POST",
                body: {
                    muscle_group: muscleGroup,
                    exercises: buildExerciseMap(),
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
        setSplitLoading(true);
        try {
            await api("/workouts/add-split", {
                method: "POST",
                body: {
                    muscle_group: muscleGroup,
                    exercises: buildExerciseMap(),
                    date: new Date().toISOString().split("T")[0],
                },
            });
            navigation.goBack();
        } catch (err) {
            console.error(err);
        } finally {
            setSplitLoading(false);
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
