import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
// Si necesitaras navegación, podrías importarla así:
// import { useNavigation } from "@react-navigation/native";
// import { StackNavigationProp } from "@react-navigation/stack";

// Definición de la estructura de datos para una Ruta
interface Ruta {
  id: string;
  nombreEntidad: string;
  minutosLlegada: number;
  distanciaKm: number;
  distanciaRealKm: number | null;
  pais: string;
  ciudad: string;
  direccion: string;
  destinoCoords: string;
}

// Datos de ejemplo para simular las rutas
const DATOS_RUTAS: Ruta[] = [];

/**
 * Componente para mostrar la lista de Rutas del día.
 */
export const RutasScreen: React.FC = () => {

  const handleSelectRuta = (ruta: Ruta) => {
    console.log("Ruta seleccionada:", ruta.nombreEntidad);
  };

  /**
   * Renderiza un elemento de la lista de rutas.
   */
  const renderRuta = ({ item }: { item: Ruta }) => (
    <TouchableOpacity
      style={styles.rutaCard}
      onPress={() => handleSelectRuta(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.entityName}>{item.nombreEntidad}</Text>
      </View>
      <Text style={styles.entityDetail}>{item.minutosLlegada} min - {item.distanciaKm.toFixed(1)} km</Text>
      <Text style={styles.entityDetail}>{item.direccion}</Text>
      <Text style={styles.locationDetail}>
         {item.ciudad}, {item.pais}
      </Text>
    </TouchableOpacity>
  );
  
  /**
   * Renderiza el componente a mostrar cuando la lista está vacía.
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {/* mensaje de lista vacia */}
      <Text style={styles.emptyText}>No tienes rutas asignadas para hoy.</Text>
    </View>
  );


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rutas del Día</Text>
      </View>

      <FlatList
        data={DATOS_RUTAS}
        renderItem={renderRuta}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        // si lista vacia
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", 
  },
  header: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a", 
  },
  listContent: {
    padding: 16,
    // Estilo para que el ListEmptyComponent se centre correctamente
    flexGrow: 1, 
  },
  rutaCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5, 
    borderLeftColor: "#0369A1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  entityName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginRight: 10,
  },
  timeDistanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: "#E0F2F9",
  },
  timeDistanceText: {
    fontSize: 13,
    color: "#0369A1",
    fontWeight: "600",
  },
  entityDetail: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
  },
  locationDetail: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
    fontStyle: "italic",
  },
  // ESTILOS PARA EL MENSAJE DE LISTA VACÍA
  emptyContainer: {
    flex: 1, // Opcional, pero ayuda a centrar si listContent tiene flexGrow: 1
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18, // Ligeramente más grande para que destaque
    color: "#94a3b8",
    textAlign: "center",
    fontWeight: "500",
  },
});