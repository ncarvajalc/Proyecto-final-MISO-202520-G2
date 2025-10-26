import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/productos.service", () => ({
  getProductos: vi.fn(),
}));

vi.mock("@/services/warehouse.service", () => ({
  getBodegas: vi.fn(),
  getProductLocationInWarehouse: vi.fn(),
}));

import { ProductWarehouseLocationForm } from "@/components/warehouse/ProductWarehouseLocationForm";
import { getProductos } from "@/services/productos.service";
import {
  getBodegas,
  getProductLocationInWarehouse,
} from "@/services/warehouse.service";

import { renderWithQueryClient } from "../../../../tests/test-utils";

describe("ProductWarehouseLocationForm - Acceptance", () => {
  const mockGetProductos = vi.mocked(getProductos);
  const mockGetBodegas = vi.mocked(getBodegas);
  const mockGetProductLocation = vi.mocked(getProductLocationInWarehouse);
  let product: {
    id: string;
    sku: string;
    nombre: string;
    descripcion: string;
    precio: number;
  };
  let warehouse: { id: string; nombre: string };
  let zone: string;

  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(16);
    product = {
      id: faker.string.uuid(),
      sku: faker.string.alphanumeric(6).toUpperCase(),
      nombre: faker.commerce.productName(),
      descripcion: faker.commerce.productDescription(),
      precio: Number(faker.commerce.price({ min: 100, max: 1000 })),
    };
    warehouse = { id: faker.string.uuid(), nombre: faker.company.name() };
    zone = faker.string.alphanumeric(4).toUpperCase();
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
    mockGetProductLocation.mockResolvedValue({
      sku: product.sku,
      bodega: warehouse.id,
      zona: zone,
      encontrado: true,
    });
  });

  it("permite completar el flujo y cerrar el modal", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    renderWithQueryClient(
      <ProductWarehouseLocationForm open={true} onOpenChange={onOpenChange} />
    );

    await user.click(await screen.findByRole("combobox", { name: "SKU" }));
    const productLabel = `${product.sku} - ${product.nombre}`;
    await user.click(await screen.findByText(productLabel));
    await user.click(await screen.findByRole("combobox", { name: "Bodega" }));
    await user.click(await screen.findByText(warehouse.nombre));
    await user.click(await screen.findByRole("button", { name: /localizar/i }));

    expect(await screen.findByText(zone)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
