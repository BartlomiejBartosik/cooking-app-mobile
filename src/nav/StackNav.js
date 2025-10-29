import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import PantryScreen from "../screens/PantryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SearchScreen from "../screens/SearchScreen";
import BottomNav from "./BottomNav";
import PantryCategoryScreen from "../screens/PantryCategoryScreen";
import PantryAddItemScreen from "../screens/PantryAddItemScreen";

const Stack = createStackNavigator();

const StackNav = () => {
    return (
        <Stack.Navigator>
            {<Stack.Screen key="login" name="LoginScreen" component={LoginScreen} />}
            {<Stack.Screen key="Register" name="Register" component={RegisterScreen} />}
            {<Stack.Screen key="Bottom" name="BottomNav" component={BottomNav} />}
            {<Stack.Screen key="Home" name="Home" component={HomeScreen} />}
            {<Stack.Screen key="Pantry" name="PantryScreen" component={PantryScreen} />}
            {<Stack.Screen key="Profile" name="ProfileScreen" component={ProfileScreen} />}
            {<Stack.Screen key="Search" name="SearchScreen" component={SearchScreen} />}
            {<Stack.Screen key="PantryCategory" name="PantryCategoryScreen" component={PantryCategoryScreen} />}
            {<Stack.Screen key="PantryAdd" name="PantryAddItemScreen" component={PantryAddItemScreen} />}
        </Stack.Navigator>
    );
};

export default StackNav;