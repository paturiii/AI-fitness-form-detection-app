import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HistoryScreenStack from "../screens/history/HistoryScreenStack";
import ProfileScreenStack from "../screens/profile/ProfileStack";
import SettingsScreen from "../screens/settings/SettingsScreen";
import WorkoutStack from "../screens/workout/WorkoutStack";
import RecordScreen from "../screens/record/RecordScreen";

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#3C6E71",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#111",
          borderTopColor: "#222",
          borderTopWidth: 1,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          if (route.name === "History") iconName = "time";
          else if (route.name === "Profile") iconName = "person";
          else if (route.name=="Workout") iconName = "barbell";
          else if (route.name=="Record") iconName = "camera";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Profile" component={ProfileScreenStack} />
      <Tab.Screen name="History" component={HistoryScreenStack} />
      <Tab.Screen name="Workout" component={WorkoutStack}/>
      <Tab.Screen name="Record" component={RecordScreen}/>
    </Tab.Navigator>
  );
}
