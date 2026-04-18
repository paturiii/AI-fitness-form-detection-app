import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, Alert, Button } from "react-native";
import { api } from "../../services/api";
import { Ionicons } from "@expo/vector-icons";
import NewWorkout from "./NewWorkout";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";


type Exercises = {
    [name: string]: {
        reps: number,
        sets: number,
        weight: number
    };
};

type Workouts = {
    id: string;
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
    const [quickStart, setQuickStart] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            api<{message: string; workout: Workouts[]}>("/workouts/")
                .then((data) => {
                    setMessage(data.message);
                    setWorkout(data.workout ?? []);
                })
                .catch(() => setMessage("Failed to Load"))
                .finally(() => setLoading(false));
        }, [])
    );

    const quickStartWorkout = (item: Workouts) => {
        
    };
    
    const quickWorkout = (item: Workouts) => {
        Alert.alert('Quick Start', 'Do you want to start this workout', [{text: 'Cancel'}, {text: 'Start', onPress: () => quickStartWorkout(item)}])
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.horizontal}>
                <View>
                    <TouchableOpacity onPress={() => navigation.navigate('NewWorkout')}>
                        <Ionicons name="add" size ={28} color="white"/>
                    </TouchableOpacity>
                </View>

                <FlatList data={workout} keyExtractor={(_,index) => index.toString()}
                    renderItem={({ item}) => (
                        <TouchableOpacity onPress={() => navigation.navigate('StartWorkout', {id: item.id, muscle_group: item.muscle_group, exercises: item.exercises})}>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>{item.muscle_group}</Text>
                                <View>
                                    {Object.entries(item.exercises).map(([name, details]) => (
                                        <Text style={styles.cardText} key={name}>
                                            {name} — {details.sets}x{details.reps} @ {details.weight}lbs
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text>No Workout Splits Saved</Text>}/>

            </View>

            </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        backgroundColor: "#0f0f0f",
    },

    horizontal: {
        paddingHorizontal: 20
    },

    card: {
        marginVertical: 7,
        backgroundColor: "#2E2E2E",
        padding: 16,
        justifyContent: 'center',
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