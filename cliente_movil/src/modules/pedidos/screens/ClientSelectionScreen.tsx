import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { institutionalClientService } from "../../../services/institutionalClientService";
import { InstitutionalClient } from "../../../types/institutionalClient";

type ClientSelectionScreenNavigationProp = StackNavigationProp<any>;

export const ClientSelectionScreen: React.FC = () => {
  const navigation = useNavigation<ClientSelectionScreenNavigationProp>();
  const [clients, setClients] = useState<InstitutionalClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<InstitutionalClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadClients = async (page: number = 1) => {
    try {
      setError(null);
      const response = await institutionalClientService.getInstitutionalClients(
        page,
        50 // Load more clients per page for better selection
      );

      setClients(response.data);
      setFilteredClients(response.data);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (err) {
      setError("Error al cargar clientes");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadClients(currentPage);
  };

  const handleSearch = () => {
    if (searchText.trim() === "") {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchText.toLowerCase()) ||
          client.identification.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  };

  const handleClientSelect = (client: InstitutionalClient) => {
    navigation.navigate("NewOrder", { clientId: client.id, clientName: client.nombre_institucion });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#024A77" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadClients()}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <Text style={styles.searchLabel}>Filtrar Cliente</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Nombre o identificación del cliente"
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>Selecciona la entidad</Text>

      {/* Clients List */}
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.clientCard}
            onPress={() => handleClientSelect(item)}
          >
            <Text style={styles.clientName}>{item.nombre_institucion}</Text>
            {item.pais && (
              <Text style={styles.clientLocation}>{item.pais}</Text>
            )}
            {item.ciudad && (
              <Text style={styles.clientLocation}>{item.ciudad}</Text>
            )}
            {item.direccion && (
              <Text style={styles.clientLocation}>{item.direccion}</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              No se encontraron clientes con ese criterio
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#024A77"]}
          />
        }
        contentContainerStyle={styles.listContent}
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
    padding: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
  },
  searchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    marginBottom: 12,
  },
  searchButton: {
    width: 120,
    height: 48,
    backgroundColor: "#024A77",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  searchButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#024A77",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  clientCard: {
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  clientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 6,
  },
  clientLocation: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  clientIdentification: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 6,
  },
  clientDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  clientContact: {
    fontSize: 14,
    color: "#64748b",
    flex: 1,
  },
  clientPhone: {
    fontSize: 14,
    color: "#64748b",
  },
  clientAddress: {
    fontSize: 14,
    color: "#64748b",
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    marginBottom: 16,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#024A77",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
