import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { OrderDetailScreen } from "../src/modules/pedidos/screens/OrderDetailScreen";
import { orderService } from "../src/services/orderService";
import { institutionalClientService } from "../src/services/institutionalClientService";
import { Order } from "../src/types/order";
import { useRoute } from "@react-navigation/native";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({
      goBack: jest.fn(),
      navigate: jest.fn(),
    }),
    useRoute: jest.fn(),
  };
});

jest.mock("../src/services/orderService", () => ({
  orderService: {
    getOrders: jest.fn(),
    getOrderById: jest.fn(),
    createOrder: jest.fn(),
  },
}));

jest.mock("../src/services/institutionalClientService", () => ({
  institutionalClientService: {
    getInstitutionalClient: jest.fn(),
  },
}));

type UseRouteMock = jest.MockedFunction<typeof useRoute>;
const mockedUseRoute = useRoute as unknown as UseRouteMock;
const mockedOrderService = orderService as jest.Mocked<typeof orderService>;
const mockedInstitutionalClientService =
  institutionalClientService as jest.Mocked<typeof institutionalClientService>;

describe("OrderDetailScreen - functional", () => {
  const order: Order = {
    id: 73,
    institutional_client_id: "CLI-901",
    order_date: "2025-02-15T15:00:00.000Z",
    subtotal: 55000,
    tax_amount: 10450,
    total_amount: 65450,
    status: "pending",
    created_at: "2025-02-15T15:00:00.000Z",
    updated_at: "2025-02-15T15:00:00.000Z",
    items: [
      {
        id: 7,
        order_id: 73,
        product_id: 501,
        product_name: "Tapabocas Triple Capa",
        quantity: 10,
        unit_price: 1500,
        subtotal: 15000,
        created_at: "2025-02-15T15:00:00.000Z",
      },
      {
        id: 8,
        order_id: 73,
        product_id: 502,
        product_name: "Gel Antibacterial 500ml",
        quantity: 5,
        unit_price: 8000,
        subtotal: 40000,
        created_at: "2025-02-15T15:00:00.000Z",
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRoute.mockReturnValue({
      key: "OrderDetail",
      name: "OrderDetail",
      params: { orderId: order.id },
    } as never);
  });

  it("usa el identificador del cliente cuando la carga del cliente falla", async () => {
    mockedOrderService.getOrderById.mockResolvedValue(order);
    mockedInstitutionalClientService.getInstitutionalClient.mockRejectedValue(
      new Error("Cliente no disponible"),
    );

    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    const view = render(<OrderDetailScreen />);

    await waitFor(() => {
      expect(view.getByText(/Pedido: #73/)).toBeTruthy();
    });

    expect(
      view.getByText("Cliente CLI-901", { exact: false }),
    ).toBeTruthy();
    expect(view.getByText("Tapabocas Triple Capa")).toBeTruthy();
    expect(view.getByText("Gel Antibacterial 500ml")).toBeTruthy();
    expect(view.getByText(/2 productos \/ 15 Unidades/)).toBeTruthy();
    expect(view.getByText(/65\.450/)).toHaveTextContent(/\$\s*65\.450/);

    consoleWarnSpy.mockRestore();
  });
});
