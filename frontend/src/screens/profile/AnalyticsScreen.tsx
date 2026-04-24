import {
  View,
  Text,
  Dimensions,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { api } from "../../services/api";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export default function AnalyticsScreen({ navigation }: Props) {
  const [data, setData] = useState<any>(null);
  const [exercise, setExercise] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [mode, setMode] = useState<"every" | "monthly">("every");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number } | null>(null);

  const getExercise = async (x: string, overrideMode?: "every" | "monthly") => {
    if (!x.trim()) return;
    setLoading(true);
    setSearched(true);
    setTooltip(null);

    try {
      const activeMode = overrideMode ?? mode;
      const endpoint =
        activeMode === "every"
          ? `/workouts/analytics?exercise=${encodeURIComponent(x.trim())}`
          : `/workouts/analytics/monthly?exercise=${encodeURIComponent(x.trim())}`;
      const res = await api(endpoint);

      setData(res);
    } catch (error) {
      console.log(error);
      setData(null);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searched && exercise.trim()) {
      getExercise(exercise, mode);
    }
  }, [mode]);

  const labels = data?.timeline?.map((t: any) => t.date.slice(5)) ?? [];
  const maxLabels = 6;
  const displayLabels = labels.map((l: string, i: number) =>
    labels.length <= maxLabels || i % Math.ceil(labels.length / maxLabels) === 0
      ? l
      : ""
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Exercise Analytics</Text>
          <Text style={styles.subtitle}>Track your progression over time</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="e.g. Bench Press"
          placeholderTextColor="#666"
          value={exercise}
          onChangeText={setExercise}
          onSubmitEditing={() => getExercise(exercise)}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => getExercise(exercise)}
        >
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ position: "relative", zIndex: 10, marginBottom: 16 }}>
        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => setDropdownOpen(!dropdownOpen)}
        >
          <Text style={styles.dropdownBtnText}>
            {mode === "every" ? "Every Workout" : "Monthly"}
          </Text>
          <Ionicons
            name={dropdownOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>

        {dropdownOpen && (
          <View style={styles.dropdownMenu}>
            {(["every", "monthly"] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.dropdownItem}
                onPress={() => {
                  setMode(opt);
                  setDropdownOpen(false);
                }}
              >
                <Text style={styles.dropdownItemText}>
                  {opt === "every" ? "Every Workout" : "Monthly"}
                </Text>
                {mode === opt && (
                  <Ionicons name="checkmark" size={18} color="#6C63FF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading && (
        <ActivityIndicator
          color="#6C63FF"
          size="large"
          style={{ marginTop: 60 }}
        />
      )}

      {!loading && data?.timeline?.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            Est. 1RM — {data.exercise}
          </Text>

          <View>


          </View>

          <LineChart
            data={{
              labels: displayLabels,
              datasets: [
                { data: data.timeline.map((t: any) => t.e1rm) },
              ],
            }}
            width={Dimensions.get("window").width - 68}
            height={220}
            chartConfig={{
              backgroundColor: "#1a1a1a",
              backgroundGradientFrom: "#1a1a1a",
              backgroundGradientTo: "#1a1a1a",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
              labelColor: () => "#888",
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#6C63FF",
              },
            }}
            onDataPointClick={({ x, y, value }: { x: number; y: number; value: number }) =>
              setTooltip({ x, y, value })
            }
            decorator={() =>
              tooltip ? (
                <View
                  style={{
                    position: "absolute",
                    left: tooltip.x - 30,
                    top: tooltip.y - 36,
                    backgroundColor: "#6C63FF",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", textAlign: "center" }}>
                    {Math.round(tooltip.value)}
                  </Text>
                </View>
              ) : null
            }
            bezier
            style={{ borderRadius: 12 }}
          />
        </View>
      )}

      {!loading && searched && data?.timeline?.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color="#333" />
          <Text style={styles.emptyTitle}>No data found</Text>
          <Text style={styles.emptySubtitle}>
            No history for "{exercise}"
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginTop: 2,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
  },
  chartCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 14,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#555",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#444",
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  dropdownMenu: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemText: {
    color: "#fff",
    fontSize: 15,
  },
});