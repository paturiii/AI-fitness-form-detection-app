import React, { useState } from "react";
import { api } from "../../services/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import WorkoutForm, { FormButton } from "../../components/WorkoutForm";
import { useWorkoutForm, getTodayDate } from "../../hooks/useWorkoutForm";

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export default function NewWorkout({ navigation }: Props) {
    const [muscleGroup, setMuscleGroup] = useState("");
    const form = useWorkoutForm([{ name: "", sets: [{ reps: "", weight: "" }] }]);

    const buildBody = () => ({
        muscle_group: muscleGroup,
        exercises: form.buildExerciseMap(),
        date: getTodayDate(),
    });

    const uploadMutation = useMutation({
        mutationFn: () => api("/workouts/upload", { method: "POST", body: buildBody() }),
        onSuccess: () => { form.invalidateAll(); navigation.goBack(); },
    });

    const splitMutation = useMutation({
        mutationFn: () => api("/workouts/add-split", { method: "POST", body: buildBody() }),
        onSuccess: () => { form.invalidateAll(); navigation.goBack(); },
    });

    return (
        <WorkoutForm
            form={form}
            muscleGroup={muscleGroup}
            onMuscleGroupChange={setMuscleGroup}
            onBack={() => navigation.goBack()}
        >
            <FormButton
                label="Post Workout"
                loadingLabel="Saving..."
                loading={uploadMutation.isPending}
                onPress={() => uploadMutation.mutate()}
            />
            <FormButton
                label="Save Split"
                loadingLabel="Saving..."
                variant="secondary"
                loading={splitMutation.isPending}
                onPress={() => splitMutation.mutate()}
            />
        </WorkoutForm>
    );
}
