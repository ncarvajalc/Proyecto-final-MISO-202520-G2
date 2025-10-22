import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Visit } from "../../../types/visit";

interface VisitCardProps {
  visit: Visit;
}

export const VisitCard: React.FC<VisitCardProps> = ({ visit }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-ES");
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{visit.nombre_institucion}</Text>
      <Text style={styles.text}>Dirección: {visit.direccion}</Text>
      <Text style={styles.text}>Hora: {formatDate(visit.hora)}</Text>
      <Text style={styles.estado}>Estado: {visit.estado}</Text>
      {visit.observacion && (
        <Text style={styles.text}>Observación: {visit.observacion}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
    color: "#333",
  },
  estado: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    color: "#007AFF",
  },
});
