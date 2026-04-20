import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "./ProfileScreen";
import AnalyticsScreen from "./AnalyticsScreen";

const Stack = createNativeStackNavigator();

export default function ProfileScreenStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen}/>
      <Stack.Screen name="Analytics" component={AnalyticsScreen}/>
    </Stack.Navigator>
  );
}
