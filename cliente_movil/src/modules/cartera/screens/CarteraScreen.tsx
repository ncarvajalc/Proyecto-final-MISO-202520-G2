import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { institutionalClientService } from "../../../services/institutionalClientService";
import { InstitutionalClient } from "../../../types/institutionalClient";

type CarteraScreenNavigationProp = StackNavigationProp<any>;

export const CarteraScreen: React.FC = () => {
  const navigation = useNavigation<CarteraScreenNavigationProp>();
  const [entities, setEntities] = useState<InstitutionalClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadEntities();
  }, [page, searchQuery]);

  const loadEntities = async () => {
    try {
      setIsLoading(true);
      const response = await institutionalClientService.getInstitutionalClients(
        page,
        10,
        searchQuery
      );
      setEntities(response.data);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error("Error loading entities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEntity = (entity: InstitutionalClient) => {
    navigation.navigate("EntityVisitList", {
      institutionId: entity.id,
      institutionName: entity.nombre_institucion,
    });
  };

  const renderEntity = ({ item }: { item: InstitutionalClient }) => (
    <TouchableOpacity
      style={styles.entityCard}
      onPress={() => handleSelectEntity(item)}
    >
      <View style={styles.entityHeader}>
        <Text style={styles.entityName}>{item.nombre_institucion}</Text>
      </View>
      <Text style={styles.entityDetail}>{item.direccion}</Text>
      <Text style={styles.entityDetail}>NIT: {item.identificacion_tributaria}</Text>
      <Text style={styles.entityDetail}>{item.telefono}</Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery
          ? "No se encontraron instituciones"
          : "No hay instituciones registradas"}
      </Text>
    </View>
  );

  if (isLoading && entities.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0369A1" />
        <Text style={styles.loadingText}>Cargando instituciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Selecciona la entidad</Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar institución..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setPage(1);
            }}
          />
        </View>
      </View>

      <FlatList
        data={entities}
        renderItem={renderEntity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshing={isLoading}
        onRefresh={loadEntities}
      />

      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
            onPress={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>
              Anterior
            </Text>
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Página {page} de {totalPages}
          </Text>

          <TouchableOpacity
            style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
            onPress={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            <Text style={[styles.paginationButtonText, page === totalPages && styles.paginationButtonTextDisabled]}>
              Siguiente
            </Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  listContent: {
    padding: 16,
  },
  entityCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entityHeader: {
    marginBottom: 8,
  },
  entityName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  entityDetail: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#0369A1",
  },
  paginationButtonDisabled: {
    backgroundColor: "#e2e8f0",
  },
  paginationButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  paginationButtonTextDisabled: {
    color: "#94a3b8",
  },
  pageInfo: {
    fontSize: 14,
    color: "#64748b",
  },
});
