import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { orderService } from "../../../services/orderService";
import { ScheduledDelivery } from "../../../types/order";
import { EntregasStackParamList } from "../navigation/EntregasStackNavigator";

type EntregasScreenNavigationProp = StackNavigationProp<
  EntregasStackParamList,
  "EntregasList"
>;

export const EntregasScreen: React.FC = () => {
  const navigation = useNavigation<EntregasScreenNavigationProp>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deliveries, setDeliveries] = useState<ScheduledDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  /**
   * Formats a Date object to DD/MM/YYYY string
   */
  const formatDateToString = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  /**
   * Handles date picker change
   */
  const handleDateChange = (event: unknown, date?: Date): void => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      setDeliveries([]);
      setSearched(false);
      if (Platform.OS === "ios") {
        setShowDatePicker(false);
      }
    }
  };

  /**
   * Handles search button press
   */
  const handleSearch = async () => {
    if (!selectedDate) {
      Alert.alert("Error", "Por favor seleccione una fecha");
      return;
    }

    const dateString = formatDateToString(selectedDate);
    setDeliveries([]);
    setLoading(true);
    setSearched(true);

    try {
      const firstPage = await orderService.getScheduledDeliveries(dateString);
      const allDeliveries = [...firstPage.data];

      const pageSize = Number(firstPage.limit) || firstPage.data.length || 20;
      const totalDeliveries = Number(firstPage.total) || allDeliveries.length;
      const totalPages =
        Number(firstPage.total_pages) ||
        Math.max(1, Math.ceil(totalDeliveries / pageSize));

      for (let page = 2; page <= totalPages; page++) {
        const nextPage = await orderService.getScheduledDeliveries(
          dateString,
          page,
          pageSize
        );

        allDeliveries.push(...nextPage.data);

        if (allDeliveries.length >= totalDeliveries) {
          break;
        }
      }

      setDeliveries(allDeliveries);
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
   * Handles delivery card press - navigates to delivery detail screen
   */
  const handleDeliveryPress = (delivery: ScheduledDelivery) => {
    navigation.navigate("DeliveryDetail", { orderId: delivery.order_id });
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
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text
            style={[styles.dateText, !selectedDate && styles.datePlaceholder]}
          >
            {selectedDate ? formatDateToString(selectedDate) : "DD/MM/YYYY"}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            testID="entregas-date-picker"
            onChange={handleDateChange}
          />
        )}
        <Text style={styles.helperText}>Selecciona la fecha a buscar</Text>
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
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#0f172a",
  },
  datePlaceholder: {
    color: "#94a3b8",
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
