import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { PedidosScreen, ClientSelectionScreen, NewOrderScreen, OrderDetailScreen } from "../screens";

export type PedidosStackParamList = {
  Pedidos: undefined;
  ClientSelection: undefined;
  NewOrder: { clientId: string; clientName: string };
  OrderDetail: { orderId: number };
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
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
};
