import axios from "axios";

jest.mock("axios");
jest.mock("../src/config/api", () => ({
  getApiBaseUrl: jest.fn(() => "https://api.example.com"),
  API_BASE_URL: "https://api.example.com",
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("productService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("utiliza la URL base normalizada para consultar productos", async () => {
    const { productService } = require("../src/services/productService");

    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [], total: 0, page: 2, limit: 15, total_pages: 0 },
    });

    await productService.getProducts(2, 15);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://api.example.com/productos/",
      { params: { page: 2, limit: 15 } }
    );
  });
});
