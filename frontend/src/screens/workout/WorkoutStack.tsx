import { View } from "react-native";
import NewWorkout from "./NewWorkout";
import Workout from "./WorkoutScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

export default function WorkoutStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false}}>
             <Stack.Screen name="WorkoutScreen" component={Workout}></Stack.Screen>
             <Stack.Screen name="NewWorkout" component={NewWorkout}></Stack.Screen>
        </Stack.Navigator>
    )    
}