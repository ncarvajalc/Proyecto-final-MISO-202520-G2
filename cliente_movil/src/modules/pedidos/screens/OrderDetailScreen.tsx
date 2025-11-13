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
import { Order } from "../../../types/order";
import { InstitutionalClient } from "../../../types/institutionalClient";

type OrderDetailRouteProp = RouteProp<
  { OrderDetail: { orderId: number } },
  "OrderDetail"
>;

export const OrderDetailScreen: React.FC = () => {
  const route = useRoute<OrderDetailRouteProp>();
  const navigation = useNavigation();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [client, setClient] = useState<InstitutionalClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load order data
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);

      // Load client data
      try {
        const clientData = await institutionalClientService.getInstitutionalClient(
          orderData.institutional_client_id
        );
        setClient(clientData);
      } catch (err) {
        console.warn("Failed to load client data", err);
      }
    } catch (err) {
      setError("Error al cargar el detalle del pedido");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

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

  const getTotalUnits = (): number => {
    if (!order) return 0;
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
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
        <Text style={styles.errorText}>{error || "Pedido no encontrado"}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadOrderDetail()}
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
        <Text style={styles.headerTitle}>Pedidos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.orderLabel}>Pedido: #{order.id}</Text>
          <Text style={styles.clientName}>
            {client?.nombre_institucion || `Cliente ${order.institutional_client_id}`}
          </Text>
          <Text style={styles.orderDate}>{formatDate(order.order_date)}</Text>
          <Text style={styles.orderInfo}>
            {order.items.length} productos / {getTotalUnits()} Unidades
          </Text>
          <Text style={styles.orderInfo}>
            {formatCurrency(order.total_amount)} con Impuestos
          </Text>
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={styles.productsSectionTitle}>Productos seleccionados</Text>

          {order.items.map((item, index) => (
            <View key={item.id} style={styles.productItem}>
              <Text style={styles.productName}>{item.product_name}</Text>
              <Text style={styles.productUnit}>Unidad</Text>
              <Text style={styles.productQuantity}>{item.quantity}</Text>
              <Text style={styles.productPrice}>
                {formatCurrency(item.subtotal)}
              </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
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
  orderInfo: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 8,
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
    fontSize: 14,
    color: "#64748b",
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
    marginBottom: 4,
  },
  productPrice: {
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
