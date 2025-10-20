import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const EntregasScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entregas</Text>
      <Text style={styles.subtitle}>Sección en desarrollo</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
  },
});
