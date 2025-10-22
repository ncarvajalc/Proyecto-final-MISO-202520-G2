import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { VisitListScreen } from "../screens/VisitListScreen";
import { ClientVisitsScreen } from "../screens/ClientVisitsScreen";
import { VisitFormScreen } from "../screens/VisitFormScreen";

export type VisitStackParamList = {
  VisitList: undefined;
  ClientVisits: { clientId: string; clientName: string };
  VisitForm: { clientId: string; clientName: string };
};

const Stack = createStackNavigator<VisitStackParamList>();

export const VisitStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="VisitList" component={VisitListScreen} />
      <Stack.Screen name="ClientVisits" component={ClientVisitsScreen} />
      <Stack.Screen name="VisitForm" component={VisitFormScreen} />
    </Stack.Navigator>
  );
};
