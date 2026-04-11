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
    group: string;
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
        api<{message: string; workout: Workouts[]}>("/workouts")
            .then((data) => {
                setMessage(data.message);
                setWorkout(data.workout ?? []);})
            .catch(() => setMessage("Failed to Load"))
            .finally(() => setLoading(false));
        },[]);

    return (
        <SafeAreaView>
            <View>
                <TouchableOpacity onPress={() => navigation.navigate('NewWorkout')}>
                    <Ionicons name="add" size ={28}/>
                </TouchableOpacity>
            </View>

            <FlatList data={workout} keyExtractor={(_,index) => index.toString()}
                renderItem={({ item}) => (
                    <View>
                        <Text>{item.group}</Text>
                        <View>
                            {Object.entries(item.exercises).map(([name, details]) => (
                                <Text key={name}>
                                    {name}
                                </Text>
                            ))}
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text>No Workout Splits Saved</Text>}/>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {

    },


})