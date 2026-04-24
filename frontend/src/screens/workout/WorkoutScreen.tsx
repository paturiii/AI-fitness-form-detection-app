import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../services/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { colors, card } from "../../services/values";

type Exercises = {
  [name: string]: {
    sets: { reps: number; weight: number }[];
  };
};

type Workouts = {
  id: string;
  muscle_group: string;
  exercises: Exercises;
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const summarizeSets = (sets: { reps: number; weight: number }[]) => {
  const reps = sets.map((s) => s.reps);
  const weights = sets.map((s) => s.weight);
  const minReps = Math.min(...reps);
  const maxReps = Math.max(...reps);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const repsStr = minReps === maxReps ? `${minReps}` : `${minReps}-${maxReps}`;
  const count = sets.length;
  if (maxWeight === 0) return `${count}×${repsStr}`;
  const weightStr =
    minWeight === maxWeight ? `${minWeight}` : `${minWeight}-${maxWeight}`;
  return `${count}×${repsStr} @ ${weightStr}lbs`;
};

export default function Workout({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<Workouts[]>([]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api<{ message: string; workout: Workouts[] }>("/workouts/")
        .then((data) => setWorkout(data.workout ?? []))
        .catch(() => setWorkout([]))
        .finally(() => setLoading(false));
    }, [])
  );

  const quickStartWorkout = (item: Workouts) => {};

  const quickWorkout = (item: Workouts) => {
    Alert.alert("Quick Start", "Do you want to start this workout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Start", onPress: () => quickStartWorkout(item) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Splits</Text>
          <Text style={styles.subtitle}>
            {workout.length} workout{workout.length !== 1 ? "s" : ""} saved
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("NewWorkout")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          color="#6C63FF"
          size="large"
          style={{ marginTop: 60 }}
        />
      ) : (
        <FlatList
          data={workout}
          keyExtractor={(_, index) => index.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("StartWorkout", {
                  id: item.id,
                  muscle_group: item.muscle_group,
                  exercises: item.exercises,
                })
              }
              onLongPress={() => quickWorkout(item)}
            >
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.muscle_group}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#444" />
                </View>
                <View style={styles.divider} />
                <View style={styles.exerciseList}>
                  {Object.entries(item.exercises).map(([name, details]) => (
                    <View key={name} style={styles.exerciseRow}>
                      <Text style={styles.exerciseName}>{name}</Text>
                      <Text style={styles.exerciseDetail}>
                        {summarizeSets(details.sets)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="add-circle-outline"
                size={48}
                color="#333"
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.emptyTitle}>No splits yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap + to create your first workout split
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundColor,
    paddingHorizontal: card.horizontalPadding,
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },

  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 24,
  },

  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(108, 99, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },

  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 12,
  },

  exerciseList: {
    gap: 6,
  },

  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  exerciseName: {
    fontSize: 14,
    color: "#ccc",
    fontWeight: "500",
  },

  exerciseDetail: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },

  emptyState: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#555",
    marginBottom: 4,
  },
  
  emptySubtitle: {
    fontSize: 14,
    color: "#444",
  },
});