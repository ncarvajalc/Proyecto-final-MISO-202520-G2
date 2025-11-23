import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { ProductDetailScreen } from "../src/modules/productos/screens/ProductDetailScreen";
import { productService } from "../src/services/productService";
import { inventoryService } from "../src/services/inventoryService";

jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  useRoute: () => ({
    params: { productId: 42, productName: "Producto Médico" },
  }),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock("../src/services/productService");
jest.mock("../src/services/inventoryService");

const mockProductService = productService as jest.Mocked<typeof productService>;
const mockInventoryService = inventoryService as jest.Mocked<
  typeof inventoryService
>;

describe("ProductDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseProduct = {
    id: 42,
    sku: "MED -123",
    nombre: "Monitor de signos vitales",
    descripcion: "Equipo avanzado para monitoreo de pacientes",
    precio: 1500000,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    especificaciones: [{ nombre: "Peso", valor: "2kg" }],
    hojaTecnica: { urlManual: "http://manual" },
  };

  it("muestra el detalle del producto y su inventario", async () => {
    mockProductService.getProductById.mockResolvedValue(baseProduct);
    mockInventoryService.getProductInventory.mockResolvedValue({
      product_id: baseProduct.sku,
      total_stock: 50,
      warehouses: [
        {
          warehouse: {
            id: "w1",
            nombre: "Bodega Principal",
            ubicacion: "Centro",
          },
          stock_quantity: 50,
          available_quantity: 45,
        },
      ],
    });

    const { getByText, getAllByText } = render(<ProductDetailScreen />);

    await waitFor(() => {
      expect(getByText(baseProduct.nombre)).toBeTruthy();
      expect(mockProductService.getProductById).toHaveBeenCalledWith(42);
      expect(mockInventoryService.getProductInventory).toHaveBeenCalledWith(
        baseProduct.sku
      );
    });

    const stockLabels = getAllByText("Stock Total:");
    expect(stockLabels.length).toBeGreaterThanOrEqual(1);
    expect(getByText("50 unidades")).toBeTruthy();
    expect(getByText("Bodega Principal")).toBeTruthy();
    expect(getByText("Disponible:")).toBeTruthy();
    expect(getByText("45")).toBeTruthy();
  });

  it("muestra el detalle del producto incluso si el inventario falla", async () => {
    mockProductService.getProductById.mockResolvedValue(baseProduct);
    mockInventoryService.getProductInventory.mockRejectedValue(
      new Error("inventory failure")
    );

    const { getByText, queryByText } = render(<ProductDetailScreen />);

    await waitFor(() => {
      expect(getByText(baseProduct.nombre)).toBeTruthy();
    });

    expect(queryByText("Error al cargar información del producto")).toBeNull();
    expect(getByText("Información de inventario no disponible")).toBeTruthy();
  });
});
