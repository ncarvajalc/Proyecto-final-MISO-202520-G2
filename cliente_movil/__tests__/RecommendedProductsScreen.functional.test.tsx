import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { RecommendedProductsScreen } from "../src/modules/productos/screens/RecommendedProductsScreen";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock("../src/services/recommendedProductsService", () => ({
  recommendedProductsService: {
    getClientesMasCompradores: jest.fn(),
  },
}));

const { recommendedProductsService } = require("../src/services/recommendedProductsService");

describe("RecommendedProductsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    recommendedProductsService.getClientesMasCompradores.mockResolvedValue({
      items: [
        {
          product_id: 10,
          product_name: "Guantes quirúrgicos",
          current_unit_price: "5.5",
          total_quantity_sold: 500,
          institutions: "Clínica Central",
          url_imagen: "https://example.com/image.jpg",
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      total_pages: 1,
    });
  });

  it("navega al detalle del producto recomendado al presionar la tarjeta", async () => {
    const { getByTestId } = render(<RecommendedProductsScreen />);

    await waitFor(() => {
      expect(recommendedProductsService.getClientesMasCompradores).toHaveBeenCalled();
    });

    fireEvent.press(getByTestId("recommended-product-card-10"));

    expect(mockNavigate).toHaveBeenCalledWith("ProductDetail", {
      productId: 10,
      productName: "Guantes quirúrgicos",
    });
  });
});
