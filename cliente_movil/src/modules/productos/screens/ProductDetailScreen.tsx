import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { Product } from "../../../types/product";
import { ProductInventory } from "../../../types/warehouse";
import { productService } from "../../../services/productService";
import { inventoryService } from "../../../services/inventoryService";

type ProductDetailRouteProp = RouteProp<
  { ProductDetail: { productId: number; productName: string } },
  "ProductDetail"
>;

export const ProductDetailScreen: React.FC = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation();
  const { productId } = route.params;

  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<ProductInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get product data to obtain SKU
      const productData = await productService.getProductById(productId);
      setProduct(productData);

      // Then get inventory using SKU
      const inventoryData = await inventoryService.getProductInventory(productData.sku);
      setInventory(inventoryData);
    } catch (err) {
      setError("Error al cargar información del producto");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#024A77" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || "Producto no encontrado"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProductData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Product Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.productName}>{product.nombre}</Text>
          <View
            style={[
              styles.statusBadge,
              product.activo ? styles.statusActive : styles.statusInactive,
            ]}
          >
            <Text style={styles.statusText}>
              {product.activo ? "Activo" : "Inactivo"}
            </Text>
          </View>
        </View>
        <Text style={styles.productSku}>SKU: {product.sku}</Text>
        <Text style={styles.productPrice}>{formatPrice(product.precio)}</Text>
      </View>

      {/* Product Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>{product.descripcion}</Text>
      </View>

      {/* Specifications */}
      {product.especificaciones && product.especificaciones.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Especificaciones</Text>
          {product.especificaciones.map((spec, index) => (
            <View key={index} style={styles.specRow}>
              <Text style={styles.specLabel}>{spec.nombre}:</Text>
              <Text style={styles.specValue}>{spec.valor}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Technical Sheet */}
      {product.hojaTecnica && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoja Técnica</Text>
          {product.hojaTecnica.urlManual && (
            <View style={styles.techSheetRow}>
              <Text style={styles.techSheetLabel}>Manual:</Text>
              <Text style={styles.techSheetLink}>
                {product.hojaTecnica.urlManual}
              </Text>
            </View>
          )}
          {product.hojaTecnica.urlHojaInstalacion && (
            <View style={styles.techSheetRow}>
              <Text style={styles.techSheetLabel}>Hoja de Instalación:</Text>
              <Text style={styles.techSheetLink}>
                {product.hojaTecnica.urlHojaInstalacion}
              </Text>
            </View>
          )}
          {product.hojaTecnica.certificaciones &&
            product.hojaTecnica.certificaciones.length > 0 && (
              <View style={styles.techSheetRow}>
                <Text style={styles.techSheetLabel}>Certificaciones:</Text>
                <Text style={styles.techSheetValue}>
                  {product.hojaTecnica.certificaciones.join(", ")}
                </Text>
              </View>
            )}
        </View>
      )}

      {/* Inventory Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventario</Text>

        {inventory ? (
          <>
            {/* Total Stock Summary */}
            <View style={styles.inventorySummary}>
              <Text style={styles.totalStockLabel}>Stock Total:</Text>
              <Text style={styles.totalStockValue}>{inventory.total_stock} unidades</Text>
            </View>

            {/* Warehouse Breakdown */}
            <Text style={styles.warehouseTitle}>Disponibilidad por Bodega</Text>
            {inventory.warehouses.length > 0 ? (
              inventory.warehouses.map((item, index) => (
                <View key={index} style={styles.warehouseCard}>
                  <Text style={styles.warehouseName}>{item.warehouse.nombre}</Text>
                  <Text style={styles.warehouseLocation}>{item.warehouse.ubicacion}</Text>

                  <View style={styles.stockInfo}>
                    <View style={styles.stockItem}>
                      <Text style={styles.stockLabel}>Stock Total:</Text>
                      <Text style={styles.stockValue}>{item.stock_quantity}</Text>
                    </View>
                    <View style={styles.stockItem}>
                      <Text style={styles.stockLabel}>Disponible:</Text>
                      <Text style={[styles.stockValue, styles.availableValue]}>
                        {item.available_quantity}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyInventory}>
                <Text style={styles.emptyText}>
                  No hay inventario disponible en ninguna bodega
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyInventory}>
            <Text style={styles.emptyText}>
              Información de inventario no disponible
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  header: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    marginRight: 12,
  },
  productSku: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
    fontFamily: "monospace",
  },
  productPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#024A77",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: "#dcfce7",
  },
  statusInactive: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  section: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
  },
  specRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  specLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    width: 150,
  },
  specValue: {
    fontSize: 14,
    color: "#0f172a",
    flex: 1,
  },
  techSheetRow: {
    marginBottom: 12,
  },
  techSheetLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },
  techSheetLink: {
    fontSize: 14,
    color: "#024A77",
    textDecorationLine: "underline",
  },
  techSheetValue: {
    fontSize: 14,
    color: "#0f172a",
  },
  inventorySummary: {
    backgroundColor: "#f1f5f9",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  totalStockLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
  totalStockValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#024A77",
  },
  warehouseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  warehouseCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  warehouseName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  warehouseLocation: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },
  stockInfo: {
    flexDirection: "row",
    gap: 20,
  },
  stockItem: {
    flex: 1,
  },
  stockLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  availableValue: {
    color: "#059669",
  },
  emptyInventory: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
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
