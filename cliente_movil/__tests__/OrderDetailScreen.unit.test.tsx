import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { OrderDetailScreen } from "../src/modules/pedidos/screens/OrderDetailScreen";
import { orderService } from "../src/services/orderService";
import { institutionalClientService } from "../src/services/institutionalClientService";
import { Order } from "../src/types/order";
import { InstitutionalClient } from "../src/types/institutionalClient";
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

describe("OrderDetailScreen - unit", () => {
  const order: Order = {
    id: 42,
    institutional_client_id: "CLI-100",
    order_date: "2025-02-12T10:30:00.000Z",
    subtotal: 70000,
    tax_amount: 13300,
    total_amount: 83300,
    status: "confirmed",
    created_at: "2025-02-12T10:30:00.000Z",
    updated_at: "2025-02-12T10:30:00.000Z",
    items: [
      {
        id: 1,
        order_id: 42,
        product_id: 99,
        product_name: "Guantes Quirúrgicos",
        quantity: 4,
        unit_price: 12000,
        subtotal: 48000,
        created_at: "2025-02-12T10:30:00.000Z",
      },
      {
        id: 2,
        order_id: 42,
        product_id: 100,
        product_name: "Batas Desechables",
        quantity: 3,
        unit_price: 9000,
        subtotal: 27000,
        created_at: "2025-02-12T10:30:00.000Z",
      },
    ],
  };

  const client: InstitutionalClient = {
    id: "CLI-100",
    nombre_institucion: "Clínica Santa María",
    direccion: "Calle 123 #45-67",
    ciudad: "Bogotá",
    pais: "Colombia",
    direccion_institucional: "contacto@clinicasantamaria.com",
    identificacion_tributaria: "900999888-1",
    representante_legal: "Dra. Paula Ríos",
    telefono: "3201234567",
    justificacion_acceso: null,
    certificado_camara: null,
    territory_id: null,
    country: "Colombia",
    state: "Bogotá",
    city: "Bogotá",
    created_at: "2024-05-01T08:00:00.000Z",
    updated_at: "2024-05-01T08:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRoute.mockReturnValue({
      key: "OrderDetail",
      name: "OrderDetail",
      params: { orderId: order.id },
    } as never);
  });

  it("muestra el resumen del pedido con los datos del cliente y productos", async () => {
    mockedOrderService.getOrderById.mockResolvedValueOnce(order);
    mockedInstitutionalClientService.getInstitutionalClient.mockResolvedValueOnce(
      client,
    );

    const view = render(<OrderDetailScreen />);

    await waitFor(() => {
      expect(view.getByText(/Pedido: #42/)).toBeTruthy();
    });

    expect(
      view.getByText("Clínica Santa María", { exact: false }),
    ).toBeTruthy();
    expect(view.getByText(/2025/)).toBeTruthy();
    expect(view.getByText(/2 productos \/ 7 Unidades/)).toBeTruthy();
    expect(view.getByText(/83\.300/)).toHaveTextContent(/\$\s*83\.300/);
    expect(view.getByText("Productos seleccionados")).toBeTruthy();
    expect(view.getByText("Guantes Quirúrgicos")).toBeTruthy();
    expect(view.getByText("Batas Desechables")).toBeTruthy();

    expect(mockedOrderService.getOrderById).toHaveBeenCalledWith(order.id);
    expect(
      mockedInstitutionalClientService.getInstitutionalClient,
    ).toHaveBeenCalledWith(order.institutional_client_id);
  });

  it("permite reintentar la carga cuando ocurre un error", async () => {
    const error = new Error("Fallo inesperado");
    mockedOrderService.getOrderById
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(order);
    mockedInstitutionalClientService.getInstitutionalClient.mockResolvedValue(
      client,
    );

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const view = render(<OrderDetailScreen />);

    await waitFor(() => {
      expect(
        view.getByText("Error al cargar el detalle del pedido"),
      ).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(view.getByText("Reintentar"));
    });

    await waitFor(() => {
      expect(view.getByText(/Pedido: #42/)).toBeTruthy();
    });

    expect(mockedOrderService.getOrderById).toHaveBeenCalledTimes(2);
    consoleErrorSpy.mockRestore();
  });
});
