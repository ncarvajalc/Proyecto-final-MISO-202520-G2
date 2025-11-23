import axios from "axios";
import { inventoryService } from "../src/services/inventoryService";
import { BackendProductInventory, Warehouse } from "../src/types/warehouse";

describe("inventoryService", () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = "http://api.test";
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = originalEnv;
  });

  it("codifica el SKU y suma las cantidades por bodega", async () => {
    const productSku = "MED -123";
    const encodedSku = "MED%20-123";

    const inventoryResponse: BackendProductInventory[] = [
      {
        warehouse_id: "w1",
        quantity: 5,
        available_quantity: 5,
        product_id: productSku,
        warehouse: { id: "w1", nombre: "", ubicacion: "" },
      },
      {
        warehouse_id: "w1",
        quantity: 3,
        available_quantity: 3,
        product_id: productSku,
        warehouse: { id: "w1", nombre: "", ubicacion: "" },
      },
    ];

    const warehouses: Warehouse[] = [
      { id: "w1", nombre: "Bodega 1", ubicacion: "Centro" },
    ];

    jest
      .spyOn(axios, "get")
      .mockResolvedValueOnce({ data: inventoryResponse })
      .mockResolvedValueOnce({ data: warehouses });

    const result = await inventoryService.getProductInventory(productSku);

    expect(axios.get).toHaveBeenCalledWith(
      `http://api.test/inventario/producto/${encodedSku}`
    );
    expect(axios.get).toHaveBeenCalledWith("http://api.test/bodegas/");
    expect(result.total_stock).toBe(8);
    expect(result.warehouses[0].warehouse.nombre).toBe("Bodega 1");
    expect(result.warehouses[0].stock_quantity).toBe(8);
    expect(result.product_id).toBe(productSku);
  });
});
