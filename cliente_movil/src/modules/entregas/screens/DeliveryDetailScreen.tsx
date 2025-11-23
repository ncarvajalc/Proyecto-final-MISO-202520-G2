import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { orderService } from "../../../services/orderService";
import { institutionalClientService } from "../../../services/institutionalClientService";
import { OrderStatus } from "../../../types/order";
import { InstitutionalClient } from "../../../types/institutionalClient";

type DeliveryDetailRouteProp = RouteProp<
  { DeliveryDetail: { orderId: number } },
  "DeliveryDetail"
>;

export const DeliveryDetailScreen: React.FC = () => {
  const route = useRoute<DeliveryDetailRouteProp>();
  const navigation = useNavigation();
  const { orderId } = route.params;

  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [client, setClient] = useState<InstitutionalClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDeliveryDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load order data (reusing the order service)
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);

      // Load client data
      try {
        const clientData =
          await institutionalClientService.getInstitutionalClient(
            orderData.institutional_client_id
          );
        setClient(clientData);
      } catch (err) {
        console.warn("Failed to load client data", err);
      }
    } catch (err) {
      setError("Error al cargar el detalle de la entrega");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryDetail();
  }, [orderId]);

  const formatDate = (dateString: string): string => {
    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
      return dateString;
    }

    const day = String(parsedDate.getUTCDate()).padStart(2, "0");
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
    const year = parsedDate.getUTCFullYear();

    return `${day}/${month}/${year}`;
  };

  const getEstimatedDeliveryTime = (): string => {
    // For now, return a fixed time
    // TODO: In future, this could come from backend or be calculated
    return "18:00 hrs";
  };

  const getStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      pending: "En camino",
      delivered: "Entregado",
      cancelled: "Cancelado",
    };
    const normalizedStatus = status?.toLowerCase?.() ?? "";
    return statusMap[normalizedStatus] || status;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#024A77" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error || "Entrega no encontrada"}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadDeliveryDetail()}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entregas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Delivery Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.orderLabel}>
            Pedido: {order.order_number || String(order.id).padStart(9, "0")}
          </Text>
          <Text style={styles.clientName}>
            {client?.nombre_institucion ||
              order.client_name ||
              `Cliente ${order.institutional_client_id}`}
          </Text>
          <Text style={styles.orderDate}>{formatDate(order.order_date)}</Text>
          <Text style={styles.statusLabel}>
            Estado: <Text style={styles.statusValue}>{getStatusText(order.status)}</Text>
          </Text>
          <Text style={styles.estimatedTime}>
            Hora estimada entrega: {getEstimatedDeliveryTime()}
          </Text>
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={styles.productsSectionTitle}>Productos a entregar</Text>

          {order.items.map((item) => (
            <View key={`${item.product_id}-${item.product_name}`} style={styles.productItem}>
              <Text style={styles.productName}>{item.product_name}</Text>
              <Text style={styles.productUnit}>{item.unit}</Text>
              <Text style={styles.productQuantity}>{item.quantity}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  backButton: {
    fontSize: 16,
    color: "#024A77",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  summarySection: {
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    marginBottom: 24,
  },
  orderLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  clientName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 8,
  },
  statusValue: {
    fontWeight: "600",
    color: "#0f172a",
  },
  estimatedTime: {
    fontSize: 16,
    color: "#64748b",
  },
  productsSection: {
    marginBottom: 20,
  },
  productsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#024A77",
    marginBottom: 16,
    textAlign: "center",
  },
  productItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: "#64748b",
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    marginBottom: 16,
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

