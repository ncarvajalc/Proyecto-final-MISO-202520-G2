import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { EntregasScreen } from "../src/modules/entregas/screens/EntregasScreen";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

let mockSelectedDate = new Date(2024, 4, 1);

jest.mock("../src/services/orderService", () => ({
  orderService: {
    getScheduledDeliveries: jest.fn(),
  },
}));

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const { View } = require("react-native");
  return ({ onChange, testID }: any) => (
    <View
      testID={testID || "mock-date-picker"}
      onStartShouldSetResponder={() => true}
      onResponderRelease={() => onChange?.({}, mockSelectedDate)}
    />
  );
});

const { orderService } = require("../src/services/orderService");

describe("EntregasScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectedDate = new Date(2024, 4, 1);
  });

  it("limpia los resultados previos al elegir una nueva fecha y vuelve a consultar", async () => {
    (orderService.getScheduledDeliveries as jest.Mock)
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 1,
            client_name: "Cliente Uno",
            country: "CO",
            city: "Bogotá",
            address: "Calle 1",
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      })
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 2,
            client_name: "Cliente Dos",
            country: "CO",
            city: "Medellín",
            address: "Calle 2",
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      });

    const { getByText, getByTestId, queryByText } = render(<EntregasScreen />);

    fireEvent.press(getByText("DD/MM/YYYY"));
    fireEvent(getByTestId("entregas-date-picker"), "onResponderRelease");

    await waitFor(() => {
      expect(getByText("01/05/2024")).toBeTruthy();
    });

    fireEvent.press(getByText("Buscar"));

    await waitFor(() => {
      expect(getByText("Cliente Uno")).toBeTruthy();
    });

    // Change date and ensure previous results disappear until searching again
    mockSelectedDate = new Date(2024, 5, 1);
    fireEvent.press(getByText("01/05/2024"));
    fireEvent(getByTestId("entregas-date-picker"), "onResponderRelease");

    await waitFor(() => {
      expect(queryByText("Cliente Uno")).toBeNull();
    });

    fireEvent.press(getByText("Buscar"));

    await waitFor(() => {
      expect(orderService.getScheduledDeliveries).toHaveBeenLastCalledWith(
        "01/06/2024"
      );
      expect(getByText("Cliente Dos")).toBeTruthy();
    });
  });
});
