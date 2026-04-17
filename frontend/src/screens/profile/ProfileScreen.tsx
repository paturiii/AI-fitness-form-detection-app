import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

type MonthlyCounts = Record<string, number>;

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonth(key: string): string {
  const [, m] = key.split("-");
  return MONTH_LABELS[parseInt(m, 10) - 1] ?? key;
}

function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
  }
  return months;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [counts, setCounts] = useState<MonthlyCounts>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api<{ monthly_counts: MonthlyCounts }>("/profile/monthly-count")
        .then((data) => setCounts(data.monthly_counts ?? {}))
        .catch(() => setCounts({}))
        .finally(() => setLoading(false));
    }, [])
  );

  const last6 = getLast6Months();
  const chartData = last6.map((key) => ({ key, count: counts[key] ?? 0 }));
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthCount = counts[currentKey] ?? 0;
  const currentYear = String(now.getFullYear());
  const totalWorkouts = Object.entries(counts)
    .filter(([key]) => key.startsWith(currentYear))
    .reduce((s, [, v]) => s + v, 0);  const bestMonth = Object.values(counts).length
    ? Math.max(...Object.values(counts))
    : 0;

  const displayName = user?.first_name ?? user?.email ?? "User";
  const initial = displayName.charAt(0).toUpperCase();

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="barbell-outline" size={22} color="#6C63FF" />
          <Text style={styles.statValue}>{totalWorkouts}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={22} color="#4CAF50" />
          <Text style={styles.statValue}>{currentMonthCount}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trophy-outline" size={22} color="#FFD54F" />
          <Text style={styles.statValue}>{bestMonth}</Text>
          <Text style={styles.statLabel}>Best Month</Text>
        </View>
      </View>

      {/* ── Chart ── */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Workouts</Text>

        {loading ? (
          <ActivityIndicator color="#6C63FF" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.chart}>
            {chartData.map((d) => {
              const barHeight = (d.count / maxCount) * 120;
              const isCurrent = d.key === currentKey;
              return (
                <View key={d.key} style={styles.barCol}>
                  <Text style={styles.barCount}>
                    {d.count > 0 ? d.count : ""}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 4),
                        backgroundColor: isCurrent ? "#6C63FF" : "#3a3a3a",
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.barLabel,
                      isCurrent && { color: "#6C63FF", fontWeight: "700" },
                    ]}
                  >
                    {formatMonth(d.key)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Logout ── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    width: "100%",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },

  chartCard: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: 28,
    borderRadius: 6,
    minHeight: 4,
  },
  barCount: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "600",
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 8,
    fontWeight: "500",
  },

  logoutBtn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderWidth: 1,
    borderColor: "#ff4444",
  },
  logoutText: {
    color: "#ff4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
