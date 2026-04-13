import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from "react-native";
import { api } from "../../services/api";
import { Ionicons } from "@expo/vector-icons";
import NewWorkout from "./NewWorkout";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Exercises = {
    [name: string]: {
        reps: number,
        sets: number
    };
};

type Workouts = {
    muscle_group: string;
    exercises: Exercises;
};

type Props = {
    navigation: NativeStackNavigationProp<any>
}

export default function Workout({navigation}: Props) {

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [workout, setWorkout] = useState<Workouts[]>([]);

    useEffect(() => {
        api<{message: string; workout: Workouts[]}>("/workouts/")
            .then((data) => {
                setMessage(data.message);
                setWorkout(data.workout ?? []);})
            .catch(() => setMessage("Failed to Load"))
            .finally(() => setLoading(false));
        },[]);

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <TouchableOpacity onPress={() => navigation.navigate('NewWorkout')}>
                    <Ionicons name="add" size ={28} color="white"/>
                </TouchableOpacity>
            </View>

            <FlatList data={workout} keyExtractor={(_,index) => index.toString()}
                renderItem={({ item}) => (
                    <TouchableOpacity>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>{item.muscle_group}</Text>
                            <View>
                                {Object.entries(item.exercises).map(([name, details]) => (
                                    <Text style={styles.cardText} key={name}>
                                        {name} — {details.sets}x{details.reps}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text>No Workout Splits Saved</Text>}/>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        backgroundColor: "#0f0f0f"
    },

    card: {
        marginVertical: 7,
        backgroundColor: "#2E2E2E",
        padding: 16,
        justifyContent: 'center',
        marginHorizontal: 50,
        borderRadius: 12,
    },

    cardTitle: {
        fontSize: 18,
        color: 'white',
        marginBottom: 8,
        fontWeight: '600'
    },

    cardText: {
        fontSize: 14,
        color: 'white'
    }
})