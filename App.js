import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import UserProvider from "./src/context/UserContext";
import StackNav from "./src/nav/StackNav";

const Stack = createStackNavigator();

export default function App() {
    return (
        <UserProvider>
            <NavigationContainer>
                <StackNav/>
            </NavigationContainer>
        </UserProvider>
    );
}
