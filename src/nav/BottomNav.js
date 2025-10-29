import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import SearchScreen from "../screens/SearchScreen";
import PantryScreen from "../screens/PantryScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function BottomNav() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarIcon: ({ focused, size }) => {
                    let icon = "home";
                    if (route.name === "Home") icon = focused ? "home" : "home-outline";
                    if (route.name === "Search") icon = focused ? "search" : "search-outline";
                    if (route.name === "Pantry") icon = focused ? "basket" : "basket-outline";
                    if (route.name === "Profile") icon = focused ? "person" : "person-outline";
                    return <Ionicons name={icon} size={size} />;
                },
            })}
        >
            {<Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} /> }
            {<Tab.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} /> }
            {<Tab.Screen name="Pantry" component={PantryScreen} options={{ title: "Pantry" }} /> }
            {<Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} /> }
        </Tab.Navigator>
    );
}
