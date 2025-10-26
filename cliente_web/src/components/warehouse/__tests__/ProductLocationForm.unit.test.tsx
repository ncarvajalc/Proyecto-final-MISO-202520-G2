import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/productos.service", () => ({
  getProductos: vi.fn(),
}));

import { ProductLocationForm } from "@/components/warehouse/ProductLocationForm";
import { getProductos } from "@/services/productos.service";

import { renderWithQueryClient } from "../../../../tests/test-utils";

describe("ProductLocationForm - Unit", () => {
  const mockGetProductos = vi.mocked(getProductos);
  let product: {
    id: string;
    sku: string;
    nombre: string;
    descripcion: string;
    precio: number;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(9);
    product = {
      id: faker.string.uuid(),
      sku: faker.string.alphanumeric(6).toUpperCase(),
      nombre: faker.commerce.productName(),
      descripcion: faker.commerce.productDescription(),
      precio: Number(faker.commerce.price({ min: 100, max: 1000 })),
    };
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
  });

  const renderForm = () =>
    renderWithQueryClient(
      <ProductLocationForm open={true} onOpenChange={vi.fn()} />
    );

  it("renderiza el encabezado y deshabilita la consulta sin selección", async () => {
    renderForm();

    expect(
      screen.getByRole("heading", { name: "Disponibilidad en bodega" })
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /consultar/i })).toBeDisabled();
  });

  it("habilita la consulta cuando el usuario selecciona un producto", async () => {
    const user = userEvent.setup();
    renderForm();

    const selector = await screen.findByRole("combobox");
    await user.click(selector);
    const optionLabel = `${product.sku} - ${product.nombre}`;
    await user.click(await screen.findByText(optionLabel));

    expect(screen.getByRole("button", { name: /consultar/i })).toBeEnabled();
  });
});
