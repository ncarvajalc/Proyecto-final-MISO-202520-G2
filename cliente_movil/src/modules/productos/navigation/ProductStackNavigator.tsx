import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { ProductosScreen } from "../screens/ProductosScreen";
import { ProductDetailScreen } from "../screens/ProductDetailScreen";
import { RecommendedProductsScreen } from "../screens/RecommendedProductsScreen";

export type ProductStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: number; productName: string };
};

const Stack = createStackNavigator<ProductStackParamList>();

export const ProductStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProductList" component={ProductosScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="RecommendedProducts" component={RecommendedProductsScreen} />
    </Stack.Navigator>
  );
};
