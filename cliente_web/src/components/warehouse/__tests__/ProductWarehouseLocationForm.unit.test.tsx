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
import { getBodegas } from "@/services/warehouse.service";

import { renderWithQueryClient } from "../../../../tests/test-utils";

describe("ProductWarehouseLocationForm - Unit", () => {
  const mockGetProductos = vi.mocked(getProductos);
  const mockGetBodegas = vi.mocked(getBodegas);
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
    faker.seed(13);
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

  const renderForm = () =>
    renderWithQueryClient(
      <ProductWarehouseLocationForm open={true} onOpenChange={vi.fn()} />
    );

  const chooseOptions = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByRole("combobox", { name: "SKU" }));
    const productLabel = `${product.sku} - ${product.nombre}`;
    await user.click(await screen.findByText(productLabel));
    await user.click(await screen.findByRole("combobox", { name: "Bodega" }));
    await user.click(await screen.findByText(warehouse.nombre));
  };

  it("muestra los selectores de producto y bodega", async () => {
    renderForm();

    expect(
      screen.getByRole("heading", { name: /consulta de producto/i })
    ).toBeInTheDocument();
    expect(await screen.findByRole("combobox", { name: "SKU" })).toBeDefined();
    expect(await screen.findByRole("combobox", { name: "Bodega" })).toBeDefined();
  });

  it("habilita el botón cuando hay un producto y una bodega seleccionados", async () => {
    renderForm();
    const user = userEvent.setup();

    await chooseOptions(user);
    expect(
      await screen.findByRole("button", { name: /localizar/i })
    ).toBeEnabled();
  });
});
