import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { api } from "../../services/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Type from "./Edit";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function HomeScreen({navigation}: Props) {
  
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ message: string }>("/home/")
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Failed to load"))
      .finally(() => setLoading(false));
  }, []);


  return (
    <View style={styles.container}>

      <TouchableOpacity onPress={() => navigation.navigate('Type')} style={styles.touch}>
        <Text>Hello</Text>
      </TouchableOpacity>

      <Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
  },

  touch: {
    backgroundColor: "white"
  }
});
