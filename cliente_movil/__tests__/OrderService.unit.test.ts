import axios from "axios";
import type { AxiosResponse } from "axios";

jest.mock("axios");

describe("orderService", () => {
  const originalEnv = process.env;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.EXPO_PUBLIC_API_URL = "https://orders.example.com";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const importService = () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const orderModule =
      require("../src/services/orderService") as typeof import("../src/services/orderService");
    return orderModule.orderService;
  };

  it("envía los parámetros de paginación y cliente institucional", async () => {
    const mockOrders = {
      data: [
        {
          id: 1,
          numero_pedido: "P-100",
          fecha: "2024-04-01",
          cliente: "Cliente Demo",
          total: 250_000,
        },
      ],
      total: 1,
      page: 2,
      limit: 10,
    };

    mockedAxios.get.mockResolvedValue({ data: mockOrders } as AxiosResponse);

    const service = importService();
    const result = await service.getOrders(2, 10, "CLI-101");

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://orders.example.com/pedidos/",
      {
        params: {
          page: 2,
          limit: 10,
          institutional_client_id: "CLI-101",
        },
      }
    );
    expect(result).toEqual(mockOrders);
  });

  it("omite el cliente institucional cuando no se envía", async () => {
    const mockOrders = {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    };

    mockedAxios.get.mockResolvedValue({ data: mockOrders } as AxiosResponse);

    const service = importService();
    const result = await service.getOrders();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://orders.example.com/pedidos/",
      {
        params: {
          page: 1,
          limit: 20,
        },
      }
    );
    expect(result).toEqual(mockOrders);
  });

  it("consulta el detalle del pedido por id", async () => {
    const mockOrder = {
      id: 555,
      numero_pedido: "PED-555",
      cliente: "Cliente Institucional",
      fecha: "2024-04-05",
      total: 980000,
    };

    mockedAxios.get.mockResolvedValue({ data: mockOrder } as AxiosResponse);

    const service = importService();
    const result = await service.getOrderById(555);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://orders.example.com/pedidos/555"
    );
    expect(result).toEqual(mockOrder);
  });

  it("propaga el error cuando la petición falla", async () => {
    const error = new Error("Network down");
    mockedAxios.get.mockRejectedValue(error);

    const service = importService();

    await expect(service.getOrders()).rejects.toThrow("Network down");
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});
