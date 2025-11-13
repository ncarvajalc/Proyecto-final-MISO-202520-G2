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
import { productService } from "../../../services/productService";
import { inventoryService } from "../../../services/inventoryService";
import { Product } from "../../../types/product";
import { ProductInventory } from "../../../types/warehouse";

type ProductosScreenNavigationProp = StackNavigationProp<any>;

type ProductWithInventory = Product & {
  inventory?: ProductInventory;
};

export const ProductosScreen: React.FC = () => {
  const navigation = useNavigation<ProductosScreenNavigationProp>();
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadProducts = async (page: number = 1) => {
    try {
      setError(null);
      const response = await productService.getProducts(page, 20);

      // Load inventory for each product using SKU
      const productsWithInventory = await Promise.all(
        response.data.map(async (product) => {
          try {
            const inventory = await inventoryService.getProductInventory(product.sku);
            return { ...product, inventory };
          } catch (err) {
            // If inventory fails, just return product without inventory
            console.warn(`Failed to load inventory for product ${product.sku}`, err);
            return product;
          }
        })
      );

      setProducts(productsWithInventory);
      setFilteredProducts(productsWithInventory);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (err) {
      setError("Error al cargar productos");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts(currentPage);
  };

  const handleSearch = () => {
    if (searchText.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) =>
        product.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const handleProductSelect = (product: ProductWithInventory) => {
    navigation.navigate("ProductDetail", {
      productId: product.id,
      productName: product.nombre,
    });
  };

  const getUnit = (product: Product): string => {
    const unitSpec = product.especificaciones?.find(
      (spec) => spec.nombre.toLowerCase() === "unidad"
    );
    return unitSpec?.valor || "Unidad";
  };

  const getWarehouseNames = (inventory?: ProductInventory): string => {
    if (!inventory || !inventory.warehouses || inventory.warehouses.length === 0) {
      return "Sin inventario";
    }
    return inventory.warehouses.map((w) => w.warehouse.name).join(", ");
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
        <TouchableOpacity style={styles.retryButton} onPress={() => loadProducts()}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Productos</Text>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filtrar Productos</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Nombre producto"
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.recommendedLink}
          accessibilityRole="button"
          testID="recommended-products-link"
          onPress={() => navigation.navigate("RecommendedProducts")}
        >
          <Text style={styles.recommendedLinkText}>Ver productos recomendados</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>Productos</Text>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => handleProductSelect(item)}
          >
            <Text style={styles.productName}>{item.nombre}</Text>
            <Text style={styles.productUnit}>{getUnit(item)}</Text>
            <Text style={styles.productStock}>
              {item.inventory?.total_stock || 0} Disponible
            </Text>
            <Text style={styles.productWarehouses} numberOfLines={2}>
              {getWarehouseNames(item.inventory)}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No se encontraron productos</Text>
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
  recommendedLink: {
    alignItems: "center",
    marginTop: 12,
  },
  recommendedLinkText: {
    color: "#024A77",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
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
  productCard: {
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  productName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  productUnit: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  productStock: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  productWarehouses: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
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
