import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ProductosScreen } from "../src/modules/productos/screens/ProductosScreen";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock("../src/services/productService", () => ({
  productService: {
    getProducts: jest.fn(),
  },
}));

jest.mock("../src/services/inventoryService", () => ({
  inventoryService: {
    getProductInventory: jest.fn(),
  },
}));

const { productService } = require("../src/services/productService");
const { inventoryService } = require("../src/services/inventoryService");

describe("ProductosScreen", () => {
  const mockProducts = {
    data: [
      {
        id: 101,
        sku: "SKU-101",
        nombre: "Guantes de Látex",
        descripcion: "Caja x 100",
        precio: 12.5,
        activo: true,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
        especificaciones: [
          { nombre: "Unidad", valor: "Caja" },
        ],
      },
      {
        id: 102,
        sku: "SKU-102",
        nombre: "Mascarilla N95",
        descripcion: "Empaque individual",
        precio: 4.5,
        activo: true,
        created_at: "2024-01-02",
        updated_at: "2024-01-02",
      },
    ],
    total: 2,
    page: 1,
    limit: 20,
    total_pages: 1,
  };

  const mockInventory = {
    product_id: "SKU-101",
    total_stock: 25,
    warehouses: [
      {
        warehouse: {
          id: "1",
          nombre: "Bodega Principal",
          ubicacion: "Centro",
          name: "Bodega Principal",
        } as any,
        stock_quantity: 15,
        available_quantity: 15,
      },
      {
        warehouse: {
          id: "2",
          nombre: "Bodega Norte",
          ubicacion: "Zona Norte",
          name: "Bodega Norte",
        } as any,
        stock_quantity: 10,
        available_quantity: 10,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    productService.getProducts.mockResolvedValue(mockProducts);
    inventoryService.getProductInventory.mockResolvedValue(mockInventory);
  });

  it("muestra los controles de filtrado y permite navegar a la pantalla de recomendados", async () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(
      <ProductosScreen />
    );

    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalled();
    });

    expect(getByPlaceholderText("Nombre producto")).toBeTruthy();
    expect(getByText("Buscar")).toBeTruthy();

    const recommendedButton = getByTestId("recommended-products-link");
    fireEvent.press(recommendedButton);

    expect(mockNavigate).toHaveBeenCalledWith("RecommendedProducts");
  });

  it("filtra los productos por nombre cuando se presiona el botón Buscar", async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <ProductosScreen />
    );

    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalled();
    });

    fireEvent.changeText(getByPlaceholderText("Nombre producto"), "guantes");
    fireEvent.press(getByText("Buscar"));

    await waitFor(() => {
      expect(queryByText("Mascarilla N95")).toBeNull();
    });
    expect(getByText("Guantes de Látex")).toBeTruthy();
  });
});
