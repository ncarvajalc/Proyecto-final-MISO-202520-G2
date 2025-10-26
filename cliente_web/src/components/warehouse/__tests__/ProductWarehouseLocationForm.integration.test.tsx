import { faker } from "@faker-js/faker";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/productos.service", () => ({
  getProductos: vi.fn(),
}));

vi.mock("@/services/warehouse.service", () => ({
  getBodegas: vi.fn(),
  getProductLocationInWarehouse: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

import { ProductWarehouseLocationForm } from "@/components/warehouse/ProductWarehouseLocationForm";
import { getProductos } from "@/services/productos.service";
import {
  getBodegas,
  getProductLocationInWarehouse,
} from "@/services/warehouse.service";
import { toast } from "sonner";

import { renderWithQueryClient } from "../../../../tests/test-utils";

describe("ProductWarehouseLocationForm - Integration", () => {
  const mockGetProductos = vi.mocked(getProductos);
  const mockGetBodegas = vi.mocked(getBodegas);
  const mockGetProductLocation = vi.mocked(getProductLocationInWarehouse);
  const mockToast = vi.mocked(toast);
  let product: {
    id: string;
    sku: string;
    nombre: string;
    descripcion: string;
    precio: number;
  };
  let warehouse: { id: string; nombre: string };

  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(15);
    product = {
      id: faker.string.uuid(),
      sku: faker.string.alphanumeric(6).toUpperCase(),
      nombre: faker.commerce.productName(),
      descripcion: faker.commerce.productDescription(),
      precio: Number(faker.commerce.price({ min: 100, max: 1000 })),
    };
    warehouse = { id: faker.string.uuid(), nombre: faker.company.name() };
    mockGetProductos.mockResolvedValue({
      data: [
        {
          id: product.id,
          sku: product.sku,
          nombre: product.nombre,
          descripcion: product.descripcion,
          precio: product.precio,
          activo: true,
        },
      ],
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });
    mockGetBodegas.mockResolvedValue([warehouse]);
  });

  const chooseOptions = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByRole("combobox", { name: "SKU" }));
    const productLabel = `${product.sku} - ${product.nombre}`;
    await user.click(await screen.findByText(productLabel));
    await user.click(await screen.findByRole("combobox", { name: "Bodega" }));
    await user.click(await screen.findByText(warehouse.nombre));
  };

  it("muestra un error si el servicio falla", async () => {
    mockGetProductLocation.mockRejectedValue(new Error("network"));

    renderWithQueryClient(
      <ProductWarehouseLocationForm open={true} onOpenChange={vi.fn()} />
    );
    const user = userEvent.setup();

    await chooseOptions(user);
    await user.click(await screen.findByRole("button", { name: /localizar/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Error al consultar la ubicación del producto"
      );
    });
    expect(mockGetProductLocation).toHaveBeenCalledWith({
      sku: product.sku,
      bodegaId: warehouse.id,
    });
    expect(await screen.findByRole("button", { name: /localizar/i })).toBeEnabled();
  });
});
