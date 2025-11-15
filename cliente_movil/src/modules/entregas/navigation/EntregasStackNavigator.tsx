import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { EntregasScreen } from "../screens/EntregasScreen";
import { DeliveryDetailScreen } from "../screens/DeliveryDetailScreen";

export type EntregasStackParamList = {
  EntregasList: undefined;
  DeliveryDetail: { orderId: number };
};

const Stack = createStackNavigator<EntregasStackParamList>();

export const EntregasStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="EntregasList" component={EntregasScreen} />
      <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
    </Stack.Navigator>
  );
};

