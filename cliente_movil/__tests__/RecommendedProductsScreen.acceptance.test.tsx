import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { RecommendedProductsScreen } from "../src/modules/productos/screens/RecommendedProductsScreen";

jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock("../src/services/recommendedProductsService", () => ({
  recommendedProductsService: {
    getClientesMasCompradores: jest.fn(),
  },
}));

const { recommendedProductsService } = require("../src/services/recommendedProductsService");

describe("RecommendedProductsScreen (acceptance)", () => {
  const mockRecommended = {
    items: [
      {
        product_id: 201,
        product_name: "Monitor de signos vitales",
        current_unit_price: "199.99",
        total_quantity_sold: 25,
        institutions: "Clínica del Norte, Hospital Central",
        url_imagen: "https://example.com/monitor.png",
      },
      {
        product_id: 202,
        product_name: "Bomba de infusión",
        current_unit_price: "349.5",
        total_quantity_sold: 12,
        institutions: "Hospital Central",
        url_imagen: "",
      },
    ],
    total: 2,
    page: 1,
    limit: 10,
    total_pages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    recommendedProductsService.getClientesMasCompradores.mockResolvedValue(
      mockRecommended
    );
  });

  it("muestra tarjetas verticales con la información clave del producto recomendado", async () => {
    const { getByTestId, getByText } = render(<RecommendedProductsScreen />);

    await waitFor(() => {
      expect(
        recommendedProductsService.getClientesMasCompradores
      ).toHaveBeenCalled();
    });

    const list = getByTestId("recommended-products-list");
    expect(list).toBeTruthy();

    const firstCard = getByTestId("recommended-product-card-201");
    expect(firstCard).toBeTruthy();

    expect(getByText("Monitor de signos vitales")).toBeTruthy();
    expect(getByText("USD $199.99")).toBeTruthy();
    expect(
      getByText("Instituciones: Clínica del Norte, Hospital Central")
    ).toBeTruthy();

    const secondCard = getByTestId("recommended-product-card-202");
    expect(secondCard).toBeTruthy();
    expect(getByText("Bomba de infusión")).toBeTruthy();
    expect(getByText("USD $349.50")).toBeTruthy();
    expect(getByText("Instituciones: Hospital Central")).toBeTruthy();
  });
});
