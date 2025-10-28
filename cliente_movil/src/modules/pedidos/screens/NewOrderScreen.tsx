import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Picker } from "@react-native-picker/picker";
import { productService } from "../../../services/productService";
import { inventoryService } from "../../../services/inventoryService";
import { orderService } from "../../../services/orderService";
import { Product } from "../../../types/product";
import { ProductInventory } from "../../../types/warehouse";
import { OrderItemCreate } from "../../../types/order";

type ProductWithInventory = Product & {
  inventory?: ProductInventory;
};

type NewOrderScreenRouteProp = RouteProp<
  { NewOrder: { clientId: string; clientName: string } },
  "NewOrder"
>;

type NewOrderScreenNavigationProp = StackNavigationProp<any>;

interface OrderItemUI extends OrderItemCreate {
  id: string; // Temporary ID for UI list
}

export const NewOrderScreen: React.FC = () => {
  const navigation = useNavigation<NewOrderScreenNavigationProp>();
  const route = useRoute<NewOrderScreenRouteProp>();
  const { clientId, clientName } = route.params;

  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [quantity, setQuantity] = useState("");
  const [selectedItems, setSelectedItems] = useState<OrderItemUI[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts(1, 100);

      // Load inventory for each product
      const productsWithInventory = await Promise.all(
        response.data.map(async (product) => {
          try {
            const inventory = await inventoryService.getProductInventory(product.id);
            return { ...product, inventory };
          } catch (err) {
            console.warn(`Failed to load inventory for product ${product.id}`, err);
            return product;
          }
        })
      );

      setProducts(productsWithInventory);
    } catch (err) {
      console.error("Error loading products:", err);
      Alert.alert("Error", "No se pudieron cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedProduct = (): ProductWithInventory | undefined => {
    console.log("getSelectedProduct - Looking for ID:", selectedProductId, "Type:", typeof selectedProductId);
    console.log("Available products:", products.map(p => ({ id: p.id, type: typeof p.id, nombre: p.nombre })));
    return products.find((p) => p.id === selectedProductId);
  };

  const getAvailableStock = (product: ProductWithInventory): number => {
    return product.inventory?.total_stock || 0;
  };

  const handleAddProduct = () => {
    console.log("handleAddProduct called");
    console.log("selectedProductId:", selectedProductId);
    console.log("quantity:", quantity);

    if (!selectedProductId) {
      Alert.alert("Error", "Por favor selecciona un producto");
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Error", "Por favor ingresa una cantidad válida");
      return;
    }

    const product = getSelectedProduct();
    console.log("product found:", product);
    if (!product) {
      Alert.alert("Error", "Producto no encontrado");
      return;
    }

    const availableStock = getAvailableStock(product);
    if (qty > availableStock) {
      Alert.alert(
        "Stock insuficiente",
        `Solo hay ${availableStock} unidades disponibles de ${product.nombre}`
      );
      return;
    }

    // Check if product is already in the list
    const existingItemIndex = selectedItems.findIndex(
      (item) => item.product_id === selectedProductId
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...selectedItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + qty;

      if (newQuantity > availableStock) {
        Alert.alert(
          "Stock insuficiente",
          `Solo hay ${availableStock} unidades disponibles de ${product.nombre}`
        );
        return;
      }

      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity,
        subtotal: product.precio * newQuantity,
      };
      setSelectedItems(updatedItems);
    } else {
      // Add new item
      const newItem: OrderItemUI = {
        id: `temp-${Date.now()}`,
        product_id: product.id,
        product_name: product.nombre,
        quantity: qty,
        unit_price: product.precio,
        subtotal: product.precio * qty,
      };
      setSelectedItems([...selectedItems, newItem]);
    }

    // Reset selection
    setSelectedProductId(undefined);
    setQuantity("");
  };

  const handleRemoveProduct = (itemId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.id !== itemId));
  };

  const calculateSubtotal = (): number => {
    return selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateTax = (): number => {
    return calculateSubtotal() * 0.19;
  };

  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateTax();
  };

  const getTotalUnits = (): number => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (): string => {
    const date = new Date();
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleConfirmOrder = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("Error", "Agrega al menos un producto al pedido");
      return;
    }

    setCreating(true);
    try {
      const orderData = {
        institutional_client_id: clientId,
        items: selectedItems.map(({ id, ...item }) => item), // Remove temporary UI id
      };

      const createdOrder = await orderService.createOrder(orderData);

      // Navigate back to orders list immediately
      navigation.navigate("Pedidos");

      // Show alert after navigation (optional, works better on web)
      setTimeout(() => {
        Alert.alert(
          "Pedido creado",
          `Pedido #${createdOrder.id} creado exitosamente`
        );
      }, 100);
    } catch (error: any) {
      console.error("Error creating order:", error);
      const errorMessage = error.response?.data?.detail || "No se pudo crear el pedido";
      Alert.alert("Error", errorMessage);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#024A77" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.mainHeader}>
        <Text style={styles.mainHeaderTitle}>Pedidos</Text>
      </View>

      {/* Order Info */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderInfoText}>Pedido: Nuevo</Text>
        <Text style={styles.orderInfoText}>{clientName}</Text>
        <Text style={styles.orderInfoText}>{formatDate()}</Text>
        <Text style={styles.orderInfoText}>
          Productos {selectedItems.length} / Unidades {getTotalUnits()}
        </Text>
        <Text style={styles.orderTotalText}>
          Total Con Impuestos: {formatCurrency(calculateTotal())}
        </Text>
      </View>

      {/* Confirm Button */}
      <View style={styles.confirmButtonContainer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (creating || selectedItems.length === 0) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmOrder}
          disabled={creating || selectedItems.length === 0}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Add Products Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agregar Productos</Text>

        {/* Product Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedProductId}
            onValueChange={(itemValue) => {
              // Convert to number if it's a string (happens on web)
              const numValue = typeof itemValue === 'string' ? parseInt(itemValue) : itemValue;
              setSelectedProductId(numValue);
            }}
            style={styles.picker}
          >
            <Picker.Item label="Selecciona un producto..." value={undefined} />
            {products.map((product) => (
              <Picker.Item
                key={product.id}
                label={`${product.nombre} (${getAvailableStock(product)} disponibles)`}
                value={product.id}
              />
            ))}
          </Picker>
        </View>

        {/* Selected Product Info */}
        {selectedProductId && getSelectedProduct() && (
          <View style={styles.productInfo}>
            <Text style={styles.productInfoText}>
              Precio: {formatCurrency(getSelectedProduct()?.precio || 0)}
            </Text>
            <Text style={styles.productInfoText}>
              Disponible: {getAvailableStock(getSelectedProduct())} unidades
            </Text>
          </View>
        )}

        {/* Quantity Input */}
        <TextInput
          style={styles.quantityInput}
          placeholder="Cantidad"
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
          placeholderTextColor="#94a3b8"
        />

        {/* Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Products Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Productos Seleccionados</Text>

        {selectedItems.length === 0 ? (
          <Text style={styles.emptyText}>
            No has agregado productos al pedido
          </Text>
        ) : (
          <>
            {selectedItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveProduct(item.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemDetailText}>
                    Cantidad: {item.quantity}
                  </Text>
                  <Text style={styles.itemDetailText}>
                    Precio: {formatCurrency(item.unit_price)}
                  </Text>
                </View>
                <Text style={styles.itemSubtotal}>
                  Subtotal: {formatCurrency(item.subtotal)}
                </Text>
              </View>
            ))}

            {/* Totals */}
            <View style={styles.totalsContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(calculateSubtotal())}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IVA (19%):</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(calculateTax())}
                </Text>
              </View>
              <View style={[styles.totalRow, styles.totalRowFinal]}>
                <Text style={styles.totalLabelFinal}>Total:</Text>
                <Text style={styles.totalValueFinal}>
                  {formatCurrency(calculateTotal())}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
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
  mainHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  mainHeaderTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  orderInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  orderInfoText: {
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 8,
    lineHeight: 20,
  },
  orderTotalText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#024A77",
    marginTop: 8,
  },
  confirmButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  confirmButton: {
    width: "100%",
    maxWidth: 300,
    height: 48,
    backgroundColor: "#024A77",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#024A77",
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  picker: {
    height: 50,
  },
  productInfo: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  productInfoText: {
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 4,
  },
  quantityInput: {
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
  addButton: {
    height: 48,
    backgroundColor: "#024A77",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    paddingVertical: 20,
  },
  itemCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
  },
  removeButton: {
    width: 28,
    height: 28,
    backgroundColor: "#ef4444",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  removeButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemDetailText: {
    fontSize: 14,
    color: "#64748b",
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  totalsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalRowFinal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#cbd5e1",
  },
  totalLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#024A77",
  },
});
