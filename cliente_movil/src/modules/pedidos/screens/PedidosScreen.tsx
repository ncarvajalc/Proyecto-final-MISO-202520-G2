import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { orderService } from "../../../services/orderService";
import { institutionalClientService } from "../../../services/institutionalClientService";
import { Order } from "../../../types/order";
import { InstitutionalClient } from "../../../types/institutionalClient";

type PedidosScreenNavigationProp = StackNavigationProp<any>;

type OrderWithClient = Order & {
  client?: InstitutionalClient;
};

export const PedidosScreen: React.FC = () => {
  const navigation = useNavigation<PedidosScreenNavigationProp>();
  const [orders, setOrders] = useState<OrderWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadOrders = async (page: number = 1) => {
    try {
      setError(null);
      const response = await orderService.getOrders(page, 20);

      // Load client data for each order
      const ordersWithClients = await Promise.all(
        response.data.map(async (order) => {
          try {
            const client = await institutionalClientService.getInstitutionalClient(
              order.institutional_client_id
            );
            return { ...order, client };
          } catch (err) {
            // If client fetch fails, just return order without client
            console.warn(`Failed to load client for order ${order.id}`, err);
            return order;
          }
        })
      );

      setOrders(ordersWithClients);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (err) {
      setError("Error al cargar pedidos");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Reload orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOrders(currentPage);
    }, [currentPage])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders(currentPage);
  };

  const handleNewOrder = () => {
    navigation.navigate("ClientSelection");
  };

  const handleOrderSelect = (order: OrderWithClient) => {
    navigation.navigate("OrderDetail", { orderId: order.id });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      processing: "En Proceso",
      completed: "Completado",
      cancelled: "Cancelado",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
      pending: "#f59e0b",
      confirmed: "#3b82f6",
      processing: "#8b5cf6",
      completed: "#10b981",
      cancelled: "#ef4444",
    };
    return colorMap[status] || "#64748b";
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
        <TouchableOpacity style={styles.retryButton} onPress={() => loadOrders()}>
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

      {/* New Order Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.newOrderButton} onPress={handleNewOrder}>
          <Text style={styles.newOrderButtonText}>Nuevo Pedido</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>Listado de Pedidos</Text>

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => handleOrderSelect(item)}
          >
            <Text style={styles.clientName}>
              {item.client?.nombre_institucion || `Cliente ${item.institutional_client_id}`}
            </Text>

            <Text style={styles.orderDate}>
              {formatDate(item.order_date)}
            </Text>

            <Text style={styles.orderStatus}>
              {getStatusText(item.status)}
            </Text>

            <Text style={styles.orderProducts}>
              {item.items?.length || 0} productos
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No se encontraron pedidos</Text>
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
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  newOrderButton: {
    width: 200,
    height: 48,
    backgroundColor: "#024A77",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  newOrderButtonText: {
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
  orderCard: {
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
  orderDate: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  orderStatus: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  orderProducts: {
    fontSize: 14,
    color: "#64748b",
  },
  itemsCount: {
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
