import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Device from "expo-device";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { colors, card } from "../../services/values";


const EXERCISES = [
  { key: "squat", label: "Squat", icon: "body" as const },
  { key: "deadlift", label: "Deadlift", icon: "barbell" as const },
  { key: "bicep_curl", label: "Bicep Curl", icon: "fitness" as const },
];

export default function RecordScreen() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [exercise, setExercise] = useState<string>("squat");

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Allow access to your photo library to select a video.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
      videoMaxDuration: 120,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const recordVideo = async () => {
    if (!Device.isDevice) {
      Alert.alert(
        "Camera unavailable",
        "The simulator and many emulators have no camera. Use “From Library” or run the app on a physical device to record.",
      );
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Allow camera access to record a video.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["videos"],
        quality: 1,
        videoMaxDuration: 120,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not open the camera.";
      Alert.alert("Camera error", message);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>SmartForm Analysis</Text>
      <Text style={styles.subtitle}>
        Record or pick a workout video to get form feedback
      </Text>

      {/* Video Preview / Picker */}
      {videoUri ? (
        <TouchableOpacity style={styles.previewContainer} onPress={pickVideo}>
          <Image source={{ uri: videoUri }} style={styles.preview} />
          <View style={styles.previewOverlay}>
            <Ionicons name="refresh" size={28} color="white" />
            <Text style={styles.previewOverlayText}>Change video</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.pickerRow}>
          <TouchableOpacity
            style={[styles.pickerCard, !Device.isDevice && styles.pickerCardDisabled]}
            onPress={() => void recordVideo()}
          >
            <View style={styles.pickerIconCircle}>
              <Ionicons name="videocam" size={32} color="white" />
            </View>
            <Text style={styles.pickerLabel}>Record</Text>
            {!Device.isDevice ? (
              <Text style={styles.pickerHint}>Device only</Text>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerCard} onPress={pickVideo}>
            <View style={styles.pickerIconCircle}>
              <Ionicons name="folder-open" size={32} color="white" />
            </View>
            <Text style={styles.pickerLabel}>From Library</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise Selector */}
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
              <Ionicons
                name={ex.icon}
                size={18}
                color={active ? "white" : "#999"}
              />
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
  pickerCardDisabled: {
    opacity: 0.65,
  },
  pickerHint: {
    color: "#888",
    fontSize: 11,
    marginTop: -4,
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

  previewContainer: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 28,
    backgroundColor: colors.inputfields,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  previewOverlayText: {
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
    marginBottom: 32,
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
    fontSize: 13,
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
  },
  analyzeBtnDisabled: {
    opacity: 0.4,
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
  hint: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});
