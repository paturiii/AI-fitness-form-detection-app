import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExerciseEntry, SetEntry } from "../components/ExerciseCard";

export type SetData = { reps: number; weight: number };
export type ExercisesParam = Record<string, { sets: SetData[] }>;

export function getTodayDate(): string {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function useWorkoutForm(initialExercises: ExerciseEntry[]) {
    const queryClient = useQueryClient();
    const [exercises, setExercises] = useState<ExerciseEntry[]>(initialExercises);

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ["home"] });
        queryClient.invalidateQueries({ queryKey: ["workouts"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
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

    return {
        exercises,
        setExercises,
        invalidateAll,
        addExercise,
        removeExercise,
        updateExerciseName,
        addSet,
        removeSet,
        updateSet,
        buildExerciseMap,
    };
}
