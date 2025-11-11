import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { recommendedProductsService, RecommendedProduct } from "../../../services/recommendedProductsService";

type RecommendedProductsScreenNavigationProp = StackNavigationProp<any>;

export const RecommendedProductsScreen: React.FC = () => {
  const navigation = useNavigation<RecommendedProductsScreenNavigationProp>();
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadRecommendedProducts = async (page: number = 1) => {
    try {
      setError(null);
      const response = await recommendedProductsService.getClientesMasCompradores(page);
      setProducts(response.items);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (err) {
      setError("Error al cargar productos recomendados");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRecommendedProducts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecommendedProducts(1);
  };

  const handleProductPress = (productId: number, name: string) => {
    console.log(productId + " - " + name)
    /*navigation.navigate("ProductDetail", {
      productId: productId,
      productName: name,
    });*/
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
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => loadRecommendedProducts()}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatPrice = (price: string) => {
    return `$${Number(price).toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Productos</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Productos recomendados por los clientes top</Text>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.product_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => handleProductPress(item.product_id, item.product_name)}
          >
            <View style={styles.productImageContainer}>
              {item.url_imagen ? (
                <Image
                  source={{ uri: item.url_imagen }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>Sin imagen</Text>
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.product_name}</Text>
              <Text style={styles.productPrice}>
                {formatPrice(item.current_unit_price)}
              </Text>
              <Text style={styles.productInstitutions} numberOfLines={5}>
                {item.institutions}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#024A77"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No hay productos recomendados</Text>
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#024A77",
    textAlign: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  listContent: {
    padding: 16,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImageContainer: {
    width: "40%",
    aspectRatio: 1,
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  placeholderText: {
    color: "#64748b",
    fontSize: 14,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#024A77",
    marginBottom: 8,
  },
  productInstitutions: {
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