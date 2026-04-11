import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { api } from "../../services/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Type from "./Edit";
import { useFocusEffect } from "@react-navigation/native";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type Exercises = {
  [name: string]: {
    reps: number, 
    sets: number
  };
};

type HistoryEntry = {
  date: string;
  muscle_group: string;
  exercises: Exercises;
}

export default function HomeScreen({navigation}: Props) {
  
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api<{ message: string; history: HistoryEntry[] }>("/home/")
        .then((data) => {
          setMessage(data.message);
          setHistory(data.history);
        })
        .catch(() => setMessage("Failed to load"))
        .finally(() => setLoading(false));
    }, [])
  );


  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('Type')}>
        <Text style={styles.title}>History</Text>
      </TouchableOpacity>

      <FlatList
        data={history}
        keyExtractor={(_, index) => index.toString()}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.muscleGroup}>{item.muscle_group}</Text>
            <View style={styles.exercise}>
            {Object.entries(item.exercises).map(([name, details]) => (
              <Text key={name}>
                {name} — {details.sets}x{details.reps}
              </Text>
            ))}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.message}>No history yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 60,
  },
  title: {
    fontSize: 30,
    color: 'white'
  },
  list: {
    width: "100%",
    marginTop: 16,
  },
  card: {
    backgroundColor: "#2E2E2E",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  date: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  muscleGroup: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 8,
  },
  exercise: {
    fontSize: 14,
    color: "white",
    marginVertical: 2,
  },
  message: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginTop: 24,
  },
});
