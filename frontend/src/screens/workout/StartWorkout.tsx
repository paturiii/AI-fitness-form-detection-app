import React, { useState } from "react";
import { Alert } from "react-native";
import { api } from "../../services/api";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import WorkoutForm, { FormButton } from "../../components/WorkoutForm";
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

    const form = useWorkoutForm(
        Object.entries(paramExercises).map(([name, details]) => ({
            name,
            sets: details.sets.map(s => ({
                reps: String(s.reps),
                weight: String(s.weight),
            })),
        }))
    );

    const { exercises, invalidateAll, buildExerciseMap } = form;

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
        <WorkoutForm
            form={form}
            muscleGroup={muscleGroup}
            onMuscleGroupChange={setMuscleGroup}
            onBack={handleGoBack}
            onDelete={pre_handle_delete}
        >
            {hasChanged() && (
                <FormButton
                    label="Save Changes"
                    loadingLabel="Saving..."
                    variant="secondary"
                    loading={updateSplitMutation.isPending}
                    onPress={() => updateSplitMutation.mutate(buildExerciseMap())}
                />
            )}
            <FormButton
                label="Log Workout"
                loadingLabel="Logging..."
                loading={loading}
                onPress={handleSubmit}
            />
        </WorkoutForm>
    );
}
