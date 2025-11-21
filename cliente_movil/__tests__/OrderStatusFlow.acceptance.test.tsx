import "react-native-gesture-handler/jestSetup";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TabNavigator } from "../src/navigation/TabNavigator";
import { orderService } from "../src/services/orderService";
import { institutionalClientService } from "../src/services/institutionalClientService";
import { Order } from "../src/types/order";

jest.mock("../src/modules/cartera/screens/CarteraScreen", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    CarteraScreen: () => React.createElement(Text, null, "Mock Cartera"),
  };
});

jest.mock("../src/modules/rutas/screens/RutasScreen", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    RutasScreen: () => React.createElement(Text, null, "Mock Rutas"),
  };
});

jest.mock("../src/modules/visitas/navigation/VisitStackNavigator", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    VisitStackNavigator: () => React.createElement(Text, null, "Mock Visitas"),
  };
});

jest.mock("../src/modules/productos/navigation/ProductStackNavigator", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    ProductStackNavigator: () =>
      React.createElement(Text, null, "Mock Productos"),
  };
});

jest.mock("../src/modules/entregas/screens/EntregasScreen", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    EntregasScreen: () => React.createElement(Text, null, "Mock Entregas"),
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
    getInstitutionalClients: jest.fn(),
    getInstitutionalClientsCartera: jest.fn(),
    getInstitutionalClient: jest.fn(),
  },
}));

const mockedOrderService = orderService as jest.Mocked<typeof orderService>;
const mockedInstitutionalClientService =
  institutionalClientService as jest.Mocked<typeof institutionalClientService>;

describe("Flujo de consulta de pedidos - aceptación", () => {
  const order: Order = {
    id: 120,
    institutional_client_id: "CLI-444",
    order_date: "2025-02-20T12:00:00.000Z",
    subtotal: 96000,
    tax_amount: 18240,
    total_amount: 114240,
    status: "completed",
    created_at: "2025-02-20T12:00:00.000Z",
    updated_at: "2025-02-20T12:00:00.000Z",
    items: [
      {
        id: 301,
        order_id: 120,
        product_id: 9001,
        product_name: "Catéter Central",
        quantity: 6,
        unit_price: 12000,
        subtotal: 72000,
        created_at: "2025-02-20T12:00:00.000Z",
      },
      {
        id: 302,
        order_id: 120,
        product_id: 9002,
        product_name: "Monitores de Signos Vitales",
        quantity: 2,
        unit_price: 12000,
        subtotal: 24000,
        created_at: "2025-02-20T12:00:00.000Z",
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedOrderService.getOrders.mockResolvedValue({
      data: [order],
      total: 1,
      page: 1,
      limit: 20,
      total_pages: 1,
    });

    mockedOrderService.getOrderById.mockResolvedValue(order);

    mockedInstitutionalClientService.getInstitutionalClient.mockResolvedValue({
      id: "CLI-444",
      nombre_institucion: "Hospital del Norte",
      direccion: "Av. 5 #10-20",
      ciudad: "Barranquilla",
      pais: "Colombia",
      direccion_institucional: "contacto@hospitalnorte.com",
      identificacion_tributaria: "800777666-3",
      representante_legal: "Dr. Juan Pérez",
      telefono: "3105551122",
      justificacion_acceso: null,
      certificado_camara: null,
      territory_id: null,
      country: "Colombia",
      state: "Atlántico",
      city: "Barranquilla",
      created_at: "2024-05-01T08:00:00.000Z",
      updated_at: "2024-05-01T08:00:00.000Z",
    });
  });

  it("permite navegar hasta el detalle del pedido y mantiene resaltada la pestaña de Pedidos", async () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    const initialMetrics = {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    };

    const view = render(
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer independent>
            <TabNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>,
    );

    await waitFor(() => {
      expect(view.getByText("Mock Cartera")).toBeTruthy();
    });

    const pedidosTab = view.getByLabelText("Pestaña Pedidos");

    fireEvent.press(pedidosTab);

    await waitFor(() => {
      expect(view.getByText("Listado de Pedidos")).toBeTruthy();
    });

    await waitFor(() => {
      expect(mockedOrderService.getOrders).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(view.getByText("Hospital del Norte")).toBeTruthy();
    });

    fireEvent.press(view.getByText("Hospital del Norte"));

    await waitFor(() => {
      expect(view.getByText(/Pedido: #120/)).toBeTruthy();
      expect(view.getByText("Productos seleccionados")).toBeTruthy();
    });

    await waitFor(() => {
      expect(
        view.getByLabelText("Pestaña Pedidos").props.accessibilityState?.selected,
      ).toBe(true);
    });
    expect(mockedOrderService.getOrderById).toHaveBeenCalledWith(order.id);
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
