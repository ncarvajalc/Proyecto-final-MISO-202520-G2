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
        } as any,
        stock_quantity: 15,
        available_quantity: 15,
      },
      {
        warehouse: {
          id: "2",
          nombre: "Bodega Norte",
          ubicacion: "Zona Norte",
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

  it("muestra los nombres de bodegas usando el campo nombre del inventario", async () => {
    const { getAllByText } = render(<ProductosScreen />);

    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalled();
    });

    expect(getAllByText("Bodega Principal, Bodega Norte")[0]).toBeTruthy();
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

  it("elimina espacios innecesarios al filtrar por SKU o nombre", async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <ProductosScreen />
    );

    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalled();
    });

    fireEvent.changeText(getByPlaceholderText("Nombre producto"), "  sku-102   ");
    fireEvent.press(getByText("Buscar"));

    await waitFor(() => {
      expect(getByText("Mascarilla N95")).toBeTruthy();
      expect(queryByText("Guantes de Látex")).toBeNull();
    });
  });

  it("carga la siguiente página cuando se llega al final de la lista", async () => {
    productService.getProducts
      .mockResolvedValueOnce({
        data: [mockProducts.data[0]],
        total: 2,
        page: 1,
        limit: 20,
        total_pages: 2,
      })
      .mockResolvedValueOnce({
        data: [mockProducts.data[1]],
        total: 2,
        page: 2,
        limit: 20,
        total_pages: 2,
      });

    const { getByTestId, getByText } = render(<ProductosScreen />);

    await waitFor(() => {
      expect(getByText("Guantes de Látex")).toBeTruthy();
    });

    fireEvent(getByTestId("products-list"), "onEndReached");

    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalledTimes(2);
      expect(getByText("Mascarilla N95")).toBeTruthy();
    });
  });

  it("recarga desde la primera página al hacer pull-to-refresh", async () => {
    productService.getProducts
      .mockResolvedValueOnce({
        data: [mockProducts.data[0]],
        total: 3,
        page: 1,
        limit: 20,
        total_pages: 2,
      })
      .mockResolvedValueOnce({
        data: [mockProducts.data[1]],
        total: 3,
        page: 2,
        limit: 20,
        total_pages: 2,
      })
      .mockResolvedValueOnce({
        data: [mockProducts.data[0]],
        total: 3,
        page: 1,
        limit: 20,
        total_pages: 2,
      });

    const { getByTestId, queryByText, getByText } = render(
      <ProductosScreen />
    );

    await waitFor(() => {
      expect(getByText("Guantes de Látex")).toBeTruthy();
    });

    fireEvent(getByTestId("products-list"), "onEndReached");

    await waitFor(() => {
      expect(getByText("Mascarilla N95")).toBeTruthy();
    });

    fireEvent(getByTestId("products-list"), "onRefresh");

    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalledTimes(3);
      expect(queryByText("Mascarilla N95")).toBeNull();
      expect(getByText("Guantes de Látex")).toBeTruthy();
    });
  });
});
