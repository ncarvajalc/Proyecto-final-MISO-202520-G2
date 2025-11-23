import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { DeliveryDetailScreen } from "../src/modules/entregas/screens/DeliveryDetailScreen";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  useNavigation: () => ({
    goBack: mockNavigate,
  }),
  useRoute: () => ({
    params: { orderId: 99 },
  }),
}));

jest.mock("../src/services/orderService", () => ({
  orderService: {
    getOrderById: jest.fn(),
  },
}));

jest.mock("../src/services/institutionalClientService", () => ({
  institutionalClientService: {
    getInstitutionalClient: jest.fn(),
  },
}));

const { orderService } = require("../src/services/orderService");
const { institutionalClientService } = require("../src/services/institutionalClientService");

describe("DeliveryDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra la información del pedido devuelta por el endpoint de estado", async () => {
    orderService.getOrderById.mockResolvedValue({
      id: 99,
      order_number: "000000099",
      institutional_client_id: "CL-1",
      client_name: "Clínica Central",
      order_date: "2024-05-01",
      status: "pending",
      subtotal: 100,
      tax_amount: 19,
      total_amount: 119,
      product_count: 1,
      total_units: 2,
      items: [
        {
          product_id: 1,
          product_name: "Guantes",
          unit: "Caja",
          quantity: 2,
          unit_price: 50,
          total_price: 100,
        },
      ],
    });

    institutionalClientService.getInstitutionalClient.mockResolvedValue({
      nombre_institucion: "Clínica Central",
    });

    const { getByText } = render(<DeliveryDetailScreen />);

    await waitFor(() => {
      expect(orderService.getOrderById).toHaveBeenCalled();
    });

    expect(getByText("Pedido: 000000099")).toBeTruthy();

    expect(getByText("Clínica Central")).toBeTruthy();
    expect(getByText("01/05/2024")).toBeTruthy();
    expect(getByText("Guantes")).toBeTruthy();
    expect(getByText("Caja")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(orderService.getOrderById).toHaveBeenCalledWith(99);
  });

  it("formatea fechas con hora y estados en mayúsculas sin perder el día", async () => {
    orderService.getOrderById.mockResolvedValue({
      id: 100,
      order_number: "000000100",
      institutional_client_id: "CL-2",
      client_name: "Clínica Norte",
      order_date: "2024-06-15T00:00:00Z",
      status: "DELIVERED",
      subtotal: 50,
      tax_amount: 9.5,
      total_amount: 59.5,
      product_count: 1,
      total_units: 1,
      items: [
        {
          product_id: 2,
          product_name: "Mascarilla",
          unit: "Unidad",
          quantity: 1,
          unit_price: 50,
          total_price: 50,
        },
      ],
    });

    institutionalClientService.getInstitutionalClient.mockResolvedValue({
      nombre_institucion: "Clínica Norte",
    });

    const { getByText } = render(<DeliveryDetailScreen />);

    await waitFor(() => {
      expect(orderService.getOrderById).toHaveBeenCalled();
    });

    expect(getByText("15/06/2024")).toBeTruthy();
    expect(getByText("Estado: Entregado")).toBeTruthy();
  });
});
