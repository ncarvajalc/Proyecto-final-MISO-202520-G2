import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { institutionalClientService } from "../../../services/institutionalClientService";
import { InstitutionalClient } from "../../../types/institutionalClient";

type VisitListScreenNavigationProp = StackNavigationProp<any>;

export const VisitListScreen: React.FC = () => {
  const navigation = useNavigation<VisitListScreenNavigationProp>();
  const [clients, setClients] = useState<InstitutionalClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<InstitutionalClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadClients = async () => {
    try {
      setError(null);
      const response = await institutionalClientService.getInstitutionalClients();
      setClients(response.data);
      setFilteredClients(response.data);
    } catch (err) {
      setError("Error al cargar clientes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSearch = () => {
    if (searchText.trim() === "") {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter((client) =>
        client.nombre_institucion.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  };

  const handleClientSelect = (client: InstitutionalClient) => {
    navigation.navigate("ClientVisits", {
      clientId: client.id,
      clientName: client.nombre_institucion,
    });
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Visitas</Text>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filtrar Cliente</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Nombre del cliente"
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
            <Text style={styles.clientDetail}>{item.direccion}</Text>
            <Text style={styles.clientDetail}>NIT: {item.identificacion_tributaria}</Text>
            <Text style={styles.clientDetail}>{item.telefono}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No se encontraron clientes</Text>
          </View>
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
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
  },
  filterLabel: {
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
    borderBottomColor: "#000000",
  },
  clientName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  clientDetail: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
  },
});
