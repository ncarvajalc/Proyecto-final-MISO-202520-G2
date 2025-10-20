import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { LoginScreen } from "../modules/auth/screens/LoginScreen";
import { InstitutionRegistrationScreen } from "../modules/instituciones/screens/InstitutionRegistrationScreen";
import { TabNavigator } from "./TabNavigator";

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  InstitutionRegistration: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="InstitutionRegistration" component={InstitutionRegistrationScreen} />
      <Stack.Screen name="Main" component={TabNavigator} />
    </Stack.Navigator>
  );
};
