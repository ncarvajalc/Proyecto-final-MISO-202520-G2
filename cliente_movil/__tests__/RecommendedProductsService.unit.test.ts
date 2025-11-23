import axios from "axios";
import {
  recommendedProductsService,
  RecommendedProductsResponse,
} from "../src/services/recommendedProductsService";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("recommendedProductsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("solicita la lista de clientes top compradores con los parámetros correctos", async () => {
    const apiResponse: RecommendedProductsResponse = {
      items: [
        {
          product_id: 1,
          product_name: "Producto 1",
          current_unit_price: "10.5",
          total_quantity_sold: 100,
          institutions: "Hospital Central",
          url_imagen: "https://example.com/image.jpg",
        },
      ],
      total: 1,
      page: 2,
      limit: 20,
      total_pages: 5,
    };

    mockedAxios.get.mockResolvedValueOnce({ data: apiResponse });

    const result = await recommendedProductsService.getClientesMasCompradores(2, 20);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/pedidos/clientes/mas-compradores"),
      {
        params: { page: 2, limit: 20 },
      }
    );
    expect(result).toEqual(apiResponse);
  });

  it("usa la respuesta simulada cuando la API retorna una lista vacía", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        total_pages: 0,
      },
    });

    const result = await recommendedProductsService.getClientesMasCompradores();

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toEqual(result.items.length);
  });

  it("retorna la respuesta simulada cuando ocurre un error en la solicitud", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Network error"));

    const fallback = await recommendedProductsService.getClientesMasCompradores();

    expect(fallback.items.length).toBeGreaterThan(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});
