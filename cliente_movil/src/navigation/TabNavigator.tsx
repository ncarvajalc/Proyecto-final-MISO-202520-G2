import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CarteraScreen } from "../modules/cartera/screens/CarteraScreen";
import { RutasScreen } from "../modules/rutas/screens/RutasScreen";
import { VisitStackNavigator } from "../modules/visitas/navigation/VisitStackNavigator";
import { ProductStackNavigator } from "../modules/productos/navigation/ProductStackNavigator";
import { PedidosStackNavigator } from "../modules/pedidos/navigation/PedidosStackNavigator";
import { EntregasStackNavigator } from "../modules/entregas/navigation/EntregasStackNavigator";

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Cartera"
      screenOptions={{
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#000000",
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 8,
          fontWeight: "600",
          marginTop: 0,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 6,
          marginBottom: 0,
        },
      }}
    >
      <Tab.Screen
        name="Cartera"
        component={CarteraScreen}
        options={{
          title: "Cartera",
          tabBarLabel: "Cartera",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Rutas"
        component={RutasScreen}
        options={{
          title: "Rutas",
          tabBarLabel: "Rutas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Visitas"
        component={VisitStackNavigator}
        options={{
          title: "Visitas",
          tabBarLabel: "Visitas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Productos"
        component={ProductStackNavigator}
        options={{
          title: "Productos",
          tabBarLabel: "Productos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Pedidos"
        component={PedidosStackNavigator}
        options={{
          title: "Pedidos",
          tabBarLabel: "Pedidos",
          tabBarTestID: "tab-pedidos",
          tabBarAccessibilityLabel: "Pestaña Pedidos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Entregas"
        component={EntregasStackNavigator}
        options={{
          title: "Entregas",
          tabBarLabel: "Entregas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};
