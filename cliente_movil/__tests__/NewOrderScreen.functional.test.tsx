import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import { NewOrderScreen } from "../src/modules/pedidos/screens/NewOrderScreen";
import { productService } from "../src/services/productService";
import { inventoryService } from "../src/services/inventoryService";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: jest.fn(),
  };
});

type UseRouteMock = jest.MockedFunction<typeof useRoute>;
const mockedUseRoute = useRoute as unknown as UseRouteMock;

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

const mockedProductService = productService as jest.Mocked<typeof productService>;
const mockedInventoryService = inventoryService as jest.Mocked<typeof inventoryService>;

const productWithZeroId = {
  id: 0,
  sku: "SKU-0",
  nombre: "Producto con ID cero",
  descripcion: "",
  precio: 12000,
  activo: true,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

describe("NewOrderScreen - selección de producto con id 0", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRoute.mockReturnValue({
      key: "NewOrder",
      name: "NewOrder",
      params: { clientId: "CLI-001", clientName: "Clinica Central" },
    } as never);

    mockedProductService.getProducts.mockResolvedValue({
      data: [productWithZeroId],
      total: 1,
      page: 1,
      limit: 100,
      total_pages: 1,
    });

    mockedInventoryService.getProductInventory.mockResolvedValue({
      product_id: "0",
      total_stock: 5,
      warehouses: [],
    });

    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("permite agregar productos cuyo identificador sea 0", async () => {
    const view = render(<NewOrderScreen />);

    await waitFor(() => {
      expect(view.getByTestId("product-picker")).toBeTruthy();
    });

    const picker = view.getByTestId("product-picker");
    fireEvent(picker, "onValueChange", 0);

    const quantityInput = view.getByPlaceholderText("Cantidad");
    fireEvent.changeText(quantityInput, "2");

    fireEvent.press(view.getByText("Agregar"));

    await waitFor(() => {
      expect(view.getByText(/Producto con ID cero/)).toBeTruthy();
      expect(view.getByText(/Cantidad: 2/)).toBeTruthy();
    });
  });
});
