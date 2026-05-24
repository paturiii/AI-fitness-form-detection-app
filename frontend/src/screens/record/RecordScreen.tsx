import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import { API_BASE_URL, getToken } from "../../services/api";
import { card, colors } from "../../services/values";

const EXERCISES = [
  { key: "push_up", label: "Push Up", icon: "fitness" as const },
  { key: "squat", label: "Squat", icon: "body" as const },
  { key: "deadlift", label: "Deadlift", icon: "barbell" as const },
];

type RepResult = {
  rep_number: number;
  start_frame: number;
  end_frame: number;
  min_elbow: number;
  min_back: number;
  max_back: number;
  good: boolean;
  issues: string[];
};

type AnalysisSummary = {
  fps: number;
  frame_count: number;
  total_reps: number;
  good_reps: number;
  bad_reps: number;
  reps: RepResult[];
};

type AnalysisResponse = {
  analysis_id: string;
  video_url: string;
  summary: AnalysisSummary;
};

export default function RecordScreen() {
  const [exercise, setExercise] = useState<string>("push_up");
  const [pickedVideoUri, setPickedVideoUri] = useState<string | null>(null);
  const [pickedAsset, setPickedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  // Whatever should be playing right now: the analyzed result if we have it,
  // otherwise the raw picked clip as a preview.
  const activeVideoUri = useMemo(() => {
    if (result) return `${API_BASE_URL}${result.video_url}`;
    return pickedVideoUri;
  }, [result, pickedVideoUri]);

  const player = useVideoPlayer(activeVideoUri ?? null, (p: { loop: boolean }) => {
    p.loop = false;
  });

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to pick a video.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (!asset?.uri) return;
    setResult(null);
    setPickedAsset(asset);
    setPickedVideoUri(asset.uri);
  };

  const recordWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to record a video.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      quality: 1,
      videoMaxDuration: 60,
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (!asset?.uri) return;
    setResult(null);
    setPickedAsset(asset);
    setPickedVideoUri(asset.uri);
  };

  const analyze = async () => {
    if (!pickedAsset?.uri) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      const type = pickedAsset.mimeType ?? "video/mp4";
      const name = pickedAsset.fileName ?? "upload.mp4";
      formData.append("video", {
        uri: pickedAsset.uri,
        type,
        name,
      } as unknown as Blob);

      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(
        `${API_BASE_URL}/record/upload-video?exercise=${encodeURIComponent(exercise)}`,
        { method: "POST", headers, body: formData }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Upload failed (${response.status})`);
      }

      const data = (await response.json()) as AnalysisResponse;
      setResult(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      Alert.alert("Analysis failed", message);
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setPickedAsset(null);
    setPickedVideoUri(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>SmartForm Analysis</Text>
      <Text style={styles.subtitle}>
        Record or pick a workout video to get rep-by-rep form feedback.
      </Text>

      {activeVideoUri ? (
        <View style={styles.playerContainer}>
          <VideoView
            style={styles.player}
            player={player}
            contentFit="contain"
            nativeControls
          />
          <TouchableOpacity style={styles.changeButton} onPress={reset}>
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.changeButtonText}>Choose another video</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pickerRow}>
          <TouchableOpacity style={styles.pickerCard} onPress={recordWithCamera}>
            <View style={styles.pickerIconCircle}>
              <Ionicons name="videocam" size={32} color="white" />
            </View>
            <Text style={styles.pickerLabel}>Record</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerCard} onPress={pickFromLibrary}>
            <View style={styles.pickerIconCircle}>
              <Ionicons name="folder-open" size={32} color="white" />
            </View>
            <Text style={styles.pickerLabel}>From Library</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionLabel}>Exercise Type</Text>
      <View style={styles.exerciseRow}>
        {EXERCISES.map((ex) => {
          const active = exercise === ex.key;
          return (
            <TouchableOpacity
              key={ex.key}
              style={[styles.exerciseChip, active && styles.exerciseChipActive]}
              onPress={() => setExercise(ex.key)}
            >
              <Ionicons name={ex.icon} size={15} color={active ? "white" : "#999"} />
              <Text
                style={[
                  styles.exerciseChipText,
                  active && styles.exerciseChipTextActive,
                ]}
              >
                {ex.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {pickedAsset && !result && (
        <TouchableOpacity
          style={[styles.analyzeBtn, analyzing && styles.analyzeBtnDisabled]}
          onPress={analyze}
          disabled={analyzing}
        >
          {analyzing ? (
            <View style={styles.analyzingRow}>
              <ActivityIndicator color="white" />
              <Text style={styles.analyzeBtnText}>Analyzing…</Text>
            </View>
          ) : (
            <Text style={styles.analyzeBtnText}>Analyze Form</Text>
          )}
        </TouchableOpacity>
      )}

      {result && (
        <View style={styles.resultSection}>
          <View style={styles.scoreRow}>
            <View style={[styles.scoreCard, { borderColor: colors.green }]}>
              <Text style={styles.scoreNumber}>{result.summary.good_reps}</Text>
              <Text style={styles.scoreLabel}>Good reps</Text>
            </View>
            <View style={[styles.scoreCard, { borderColor: "#E55353" }]}>
              <Text style={styles.scoreNumber}>{result.summary.bad_reps}</Text>
              <Text style={styles.scoreLabel}>Bad reps</Text>
            </View>
            <View style={[styles.scoreCard, { borderColor: colors.purple }]}>
              <Text style={styles.scoreNumber}>{result.summary.total_reps}</Text>
              <Text style={styles.scoreLabel}>Total</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Rep breakdown</Text>
          {result.summary.reps.length === 0 ? (
            <Text style={styles.emptyText}>
              No complete reps were detected in this clip.
            </Text>
          ) : (
            result.summary.reps.map((rep) => (
              <View
                key={rep.rep_number}
                style={[
                  styles.repCard,
                  { borderLeftColor: rep.good ? colors.green : "#E55353" },
                ]}
              >
                <View style={styles.repHeader}>
                  <Text style={styles.repTitle}>Rep #{rep.rep_number}</Text>
                  <Text
                    style={[
                      styles.repVerdict,
                      { color: rep.good ? colors.green : "#E55353" },
                    ]}
                  >
                    {rep.good ? "GOOD" : "BAD"}
                  </Text>
                </View>
                <Text style={styles.repStats}>
                  min elbow {rep.min_elbow}°  ·  back {rep.min_back}–{rep.max_back}°
                </Text>
                {rep.issues.map((issue) => (
                  <Text key={issue} style={styles.repIssue}>
                    • {issue}
                  </Text>
                ))}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundColor,
  },
  contentContainer: {
    paddingHorizontal: card.horizontalPadding,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: "#666",
    fontSize: 14,
    marginBottom: 20,
    fontWeight: "500",
  },

  pickerRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 28,
  },
  pickerCard: {
    flex: 1,
    backgroundColor: colors.inputfields,
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: "center",
    gap: 12,
  },
  pickerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerLabel: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },

  playerContainer: {
    marginBottom: 24,
  },
  player: {
    width: "100%",
    aspectRatio: 9 / 16,
    borderRadius: 16,
    backgroundColor: "#000",
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.inputfields,
  },
  changeButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },

  sectionLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  exerciseRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  exerciseChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.inputfields,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  exerciseChipActive: {
    borderColor: colors.purple,
    backgroundColor: "rgba(60,110,113,0.15)",
  },
  exerciseChipText: {
    color: "#999",
    fontSize: 12,
    fontWeight: "600",
  },
  exerciseChipTextActive: {
    color: "white",
  },

  analyzeBtn: {
    backgroundColor: colors.purple,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  analyzeBtnDisabled: {
    opacity: 0.6,
  },
  analyzeBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  analyzingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  resultSection: {
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: card.cardBackgroundColor,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1.5,
  },
  scoreNumber: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
  },
  scoreLabel: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  emptyText: {
    color: "#888",
    fontSize: 13,
    fontStyle: "italic",
  },
  repCard: {
    backgroundColor: card.cardBackgroundColor,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  repHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  repTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  repVerdict: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  repStats: {
    color: "#bbb",
    fontSize: 12,
    marginBottom: 4,
  },
  repIssue: {
    color: "#E0E0E0",
    fontSize: 12,
    marginTop: 2,
  },
});
