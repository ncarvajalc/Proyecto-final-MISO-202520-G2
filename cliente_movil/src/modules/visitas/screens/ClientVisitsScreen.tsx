import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { VisitCard } from "../components/VisitCard";
import { visitService } from "../../../services/visitService";
import { Visit } from "../../../types/visit";

type ClientVisitsScreenRouteProp = RouteProp<
  { ClientVisits: { clientId: string; clientName: string } },
  "ClientVisits"
>;

type ClientVisitsScreenNavigationProp = StackNavigationProp<any>;

export const ClientVisitsScreen: React.FC = () => {
  const route = useRoute<ClientVisitsScreenRouteProp>();
  const navigation = useNavigation<ClientVisitsScreenNavigationProp>();
  const { clientId, clientName } = route.params;

  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVisits = async () => {
    try {
      setError(null);
      const response = await visitService.getVisits();
      // TODO: Filter by clientId when backend supports it
      // For now, filter by client name
      const clientVisits = response.data.filter(
        (visit: Visit) => visit.nombre_institucion === clientName
      );
      setVisits(clientVisits);
    } catch (err) {
      setError("Error al cargar visitas");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadVisits();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0369A1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0369A1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visitas</Text>
      </View>

      {/* Register Visit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate("VisitForm", { clientId, clientName })}
        >
          <Text style={styles.registerButtonText}>Registrar visita</Text>
        </TouchableOpacity>
      </View>

      {/* Title with client name */}
      <Text style={styles.listTitle}>Listado de Visitas - {clientName}</Text>

      {/* Visits list */}
      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VisitCard visit={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>
              No hay visitas programadas para este cliente
            </Text>
          </View>
        }
        contentContainerStyle={
          visits.length === 0 ? styles.emptyList : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  registerButton: {
    backgroundColor: "#0369A1",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  registerButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  listTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0369A1",
    textAlign: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
  },
});
