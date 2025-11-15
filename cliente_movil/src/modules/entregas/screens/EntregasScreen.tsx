import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { orderService } from "../../../services/orderService";
import { ScheduledDelivery } from "../../../types/order";

export const EntregasScreen: React.FC = () => {
  const [dateInput, setDateInput] = useState("");
  const [deliveries, setDeliveries] = useState<ScheduledDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  /**
   * Validates date format DD/MM/YYYY
   */
  const isValidDateFormat = (date: string): boolean => {
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) {
      return false;
    }

    const [day, month, year] = date.split("/").map(Number);

    // Basic validation
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;

    return true;
  };

  /**
   * Handles search button press
   */
  const handleSearch = async () => {
    if (!dateInput.trim()) {
      Alert.alert("Error", "Por favor ingrese una fecha");
      return;
    }

    if (!isValidDateFormat(dateInput)) {
      Alert.alert(
        "Formato inválido",
        "Por favor use el formato DD/MM/YYYY (ej: 15/11/2024)"
      );
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await orderService.getScheduledDeliveries(dateInput);
      setDeliveries(response.data);
    } catch (error) {
      console.error("Error fetching scheduled deliveries:", error);
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Error al consultar entregas programadas";
      Alert.alert("Error", errorMessage);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles delivery card press
   * TODO: Navigate to delivery detail screen (Future Sprint)
   */
  const handleDeliveryPress = (delivery: ScheduledDelivery) => {
    // TODO: Implement navigation to delivery detail screen
    // This will be implemented in a future sprint
    console.log("Delivery selected:", delivery.client_name);
    Alert.alert(
      "Detalle de entrega",
      `Funcionalidad pendiente para: ${delivery.client_name}\n\nSe implementará en el próximo sprint.`
    );
  };

  /**
   * Renders a delivery card
   */
  const renderDeliveryCard = ({ item }: { item: ScheduledDelivery }) => (
    <TouchableOpacity
      style={styles.deliveryCard}
      onPress={() => handleDeliveryPress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.clientName}>{item.client_name}</Text>
      <Text style={styles.deliveryDetail}>{item.address}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Entregas</Text>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filtrar Fecha</Text>
        <TextInput
          style={styles.dateInput}
          placeholder="DD/MM/YYYY"
          value={dateInput}
          onChangeText={setDateInput}
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          maxLength={10}
        />
        <Text style={styles.helperText}>Digita la fecha a buscar</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.searchButtonText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Section */}
      {searched && (
        <>
          <Text style={styles.sectionTitle}>Selecciona la entrega</Text>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#024A77" />
            </View>
          ) : (
            <FlatList
              data={deliveries}
              keyExtractor={(item, index) => `${item.client_name}-${index}`}
              renderItem={renderDeliveryCard}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No hay entregas programadas para esta fecha
                  </Text>
                </View>
              }
              contentContainerStyle={styles.listContent}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0f172a",
  },
  avatarText: {
    fontSize: 24,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  dateInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: "#3b82f6",
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#024A77",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deliveryCard: {
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
  deliveryDetail: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
});
