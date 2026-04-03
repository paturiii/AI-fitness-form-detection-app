import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function SettingsScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>App Version</Text>
        <Text style={styles.value}>1.0.0</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Theme</Text>
        <Text style={styles.value}>Light</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingHorizontal: 28,
    paddingTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  label: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: "#888",
  },
});
