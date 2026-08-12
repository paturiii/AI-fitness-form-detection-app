import React, { useState } from "react";
import { Alert } from "react-native";
import { api } from "../../services/api";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import WorkoutForm, { FormButton } from "../../components/WorkoutForm";
import { useWorkoutForm, ExercisesParam } from "../../hooks/useWorkoutForm";

type Props = NativeStackScreenProps<any, "EditHistory">;

function formatDate(raw: string): string {
    const d = new Date(raw + "T00:00:00");
    return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function EditHistory({ navigation, route }: Props) {
    const { id, muscle_group, date, exercises: paramExercises } = route.params as {
        id: string;
        muscle_group: string;
        date: string;
        exercises: ExercisesParam;
    };

    const [muscleGroup, setMuscleGroup] = useState(muscle_group);

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

    const updateMutation = useMutation({
        mutationFn: () =>
            api(`/history/${id}`, {
                method: "PUT",
                body: {
                    muscle_group: muscleGroup,
                    exercises: buildExerciseMap(),
                    date,
                },
            }),
        onSuccess: () => { invalidateAll(); navigation.goBack(); },
        onError: () => Alert.alert("Error", "Failed to update workout"),
    });

    const deleteMutation = useMutation({
        mutationFn: () => api(`/history/${id}`, { method: "DELETE" }),
        onSuccess: () => { invalidateAll(); navigation.goBack(); },
        onError: () => Alert.alert("Error", "Failed to delete workout"),
    });

    const saving = updateMutation.isPending || deleteMutation.isPending;

    const hasChanged = () => {
        if (muscleGroup !== muscle_group) return true;
        const original = Object.entries(paramExercises);
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

    const handleDelete = () => {
        Alert.alert("Delete Workout", `Delete your ${muscle_group} workout from ${formatDate(date)}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
        ]);
    };

    const handleGoBack = () => {
        if (hasChanged()) {
            Alert.alert("Unsaved Changes", "You have unsaved changes. Save before leaving?", [
                { text: "Save", onPress: () => updateMutation.mutate() },
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
            onDelete={handleDelete}
            subtitle={formatDate(date)}
        >
            <FormButton
                label="Save Changes"
                loadingLabel="Saving..."
                variant="secondary"
                loading={updateMutation.isPending}
                disabled={saving || !hasChanged()}
                onPress={() => updateMutation.mutate()}
            />
        </WorkoutForm>
    );
}
