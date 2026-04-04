import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { api } from "../../services/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Type from "./Edit";

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

  useEffect(() => {
    api<{ message: string; history: HistoryEntry[] }>("/home/")
      .then((data) => {
        setMessage(data.message); 
        setHistory(data.history)})
      .catch(() => setMessage("Failed to load"))
      .finally(() => setLoading(false));
  }, []);


  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('Type')} style={styles.touch}>
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
    backgroundColor: "white",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 60,
  },
  title: {
    fontSize: 30
  },
  list: {
    width: "100%",
    marginTop: 16,
  },
  card: {
    backgroundColor: "#f5f5f5",
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
    color: "#222",
    marginBottom: 8,
  },
  exercise: {
    fontSize: 14,
    color: "#555",
    marginVertical: 2,
  },
  message: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginTop: 24,
  },
  touch: {
    backgroundColor: "white",
  },
});
