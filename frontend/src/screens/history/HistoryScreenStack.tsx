import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import History from "./HistoryScreen";
import Type from "./Edit";

const Stack = createNativeStackNavigator();

export default function HistoryScreenStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HistoryScreen" component={History} />
      <Stack.Screen name="Type" component={Type}/>
    </Stack.Navigator>
  );
}
