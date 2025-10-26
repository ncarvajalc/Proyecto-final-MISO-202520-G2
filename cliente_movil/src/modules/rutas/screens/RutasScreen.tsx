import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ruta } from "../../../types/route";
import routesService from "../../../services/routesService";
import { useAuth } from "../../../contexts/auth-hooks";

/**
 * Componente para mostrar la lista de Rutas del día.
 */
export const RutasScreen: React.FC = () => {
  const { user } = useAuth();

  const [routes, setRoutes] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRuta = (ruta: Ruta) => {
    console.log("Ruta seleccionada:", ruta.nombreEntidad);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const salespersonId = user?.id ?? "";
        const data = await routesService.getRoutesBySalesperson(salespersonId);
        if (mounted) setRoutes(data);
      } catch (err) {
        console.warn("RutasScreen: failed to load routes", err);
        if (mounted) setError("Error al cargar rutas");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user]);

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

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Cargando rutas...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          renderItem={renderRuta}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
        />
      )}
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

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#94a3b8",
    textAlign: "center",
    fontWeight: "500",
  },
});