import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./HomeScreen";
import Type from "./Edit";

const Stack = createNativeStackNavigator();

export default function HomeScreenStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Homescreen" component={HomeScreen} />
      <Stack.Screen name="Type" component={Type}/>
    </Stack.Navigator>
  );
}
