import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../services/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { colors, card } from "../../services/values";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type Exercises = {
  [name: string]: {
    reps: number;
    sets: number;
    weight: number;
  };
};

type HistoryEntry = {
  date: string;
  muscle_group: string;
  exercises: Exercises;
};

function formatDate(raw: string): string {
  const d = new Date(raw + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api<{ message: string; history: HistoryEntry[] }>("/home/")
        .then((data) => setHistory(data.history ?? []))
        .catch(() => setHistory([]))
        .finally(() => setLoading(false));
    }, [])
  );

  const greeting = user?.first_name
    ? `Hey, ${user.first_name}`
    : "Welcome back";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>Your workouts</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          color="#6C63FF"
          size="large"
          style={{ marginTop: 60 }}
        />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(_, index) => index.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.muscleGroup}>{item.muscle_group}</Text>
                  <Text style={styles.date}>{formatDate(item.date)}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.exerciseList}>
                {Object.entries(item.exercises).map(([name, details]) => (
                  <View key={name} style={styles.exerciseRow}>
                    <Text style={styles.exerciseName}>{name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {details.sets}x{details.reps} @ {details.weight}lbs
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="fitness-outline"
                size={48}
                color="#333"
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.emptyTitle}>No workouts yet</Text>
              <Text style={styles.emptySubtitle}>
                Complete a workout to see it here
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
    marginBottom: 20,
  },

  greeting: {
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

  muscleGroup: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },

  date: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
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
