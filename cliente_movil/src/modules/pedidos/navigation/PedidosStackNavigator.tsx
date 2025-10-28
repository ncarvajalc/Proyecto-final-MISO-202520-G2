import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { PedidosScreen, ClientSelectionScreen, NewOrderScreen } from "../screens";

export type PedidosStackParamList = {
  Pedidos: undefined;
  ClientSelection: undefined;
  NewOrder: { clientId: string; clientName: string };
};

const Stack = createStackNavigator<PedidosStackParamList>();

export const PedidosStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Pedidos" component={PedidosScreen} />
      <Stack.Screen name="ClientSelection" component={ClientSelectionScreen} />
      <Stack.Screen name="NewOrder" component={NewOrderScreen} />
    </Stack.Navigator>
  );
};
