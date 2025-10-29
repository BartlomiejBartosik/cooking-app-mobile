import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import UserProvider from "./src/context/UserContext";
import StackNav from "./src/nav/StackNav";


export default function App() {
    return (
        <NavigationContainer>
            <UserProvider>
                <StackNav />
            </UserProvider>
        </NavigationContainer>
    );
}
