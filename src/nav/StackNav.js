import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";

const Stack = createStackNavigator();

const StackNav = () => {
    return (
        <Stack.Navigator>
            {[<Stack.Screen key="login" name="Login" component={LoginScreen} />]}
            {[<Stack.Screen key="Register" name="Register" component={RegisterScreen} />]}
            {[<Stack.Screen key="Home" name="Home" component={HomeScreen} />]}
        </Stack.Navigator>
    );
};

export default StackNav;