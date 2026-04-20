import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeScreenStack from "../screens/home/HomeScreenStack";
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
        tabBarActiveTintColor: "#6C63FF",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#111",
          borderTopColor: "#222",
          borderTopWidth: 1,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Profile") iconName = "person";
          else if (route.name === "Settings") iconName = "settings";
          else if (route.name=="Workout") iconName = "barbell";
          else if (route.name=="Record") iconName = "camera";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreenStack} />
      <Tab.Screen name="Workout" component={WorkoutStack}/>
      <Tab.Screen name="Profile" component={ProfileScreenStack} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="Record" component={RecordScreen}/>
    </Tab.Navigator>
  );
}
