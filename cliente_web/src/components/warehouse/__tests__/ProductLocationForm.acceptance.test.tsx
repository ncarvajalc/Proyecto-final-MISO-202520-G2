import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/productos.service", () => ({
  getProductos: vi.fn(),
}));

vi.mock("@/services/warehouse.service", () => ({
  getProductLocation: vi.fn(),
}));

import { ProductLocationForm } from "@/components/warehouse/ProductLocationForm";
import { getProductos } from "@/services/productos.service";
import { getProductLocation } from "@/services/warehouse.service";

import { renderWithQueryClient } from "../../../../tests/test-utils";

describe("ProductLocationForm - Acceptance", () => {
  const mockGetProductos = vi.mocked(getProductos);
  const mockGetProductLocation = vi.mocked(getProductLocation);
  let product: {
    id: string;
    sku: string;
    nombre: string;
    descripcion: string;
    precio: number;
  };
  let warehouse: string;
  let zone: string;

  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(12);
    product = {
      id: faker.string.uuid(),
      sku: faker.string.alphanumeric(6).toUpperCase(),
      nombre: faker.commerce.productName(),
      descripcion: faker.commerce.productDescription(),
      precio: Number(faker.commerce.price({ min: 100, max: 1000 })),
    };
    warehouse = faker.company.name();
    zone = faker.string.alphanumeric(3).toUpperCase();
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
    mockGetProductLocation.mockResolvedValue({
      sku: product.sku,
      bodega: warehouse,
      zona: zone,
      encontrado: true,
    });
  });

  it("permite completar la consulta y cerrar el modal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithQueryClient(
      <ProductLocationForm open={true} onOpenChange={onOpenChange} />
    );

    await user.click(await screen.findByRole("combobox"));
    const optionLabel = `${product.sku} - ${product.nombre}`;
    await user.click(await screen.findByText(optionLabel));
    await user.click(screen.getByRole("button", { name: /consultar/i }));

    expect(await screen.findByText(warehouse)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
