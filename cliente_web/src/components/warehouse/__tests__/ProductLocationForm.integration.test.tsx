import { faker } from "@faker-js/faker";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/productos.service", () => ({
  getProductos: vi.fn(),
}));

vi.mock("@/services/warehouse.service", () => ({
  getProductLocation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

import { ProductLocationForm } from "@/components/warehouse/ProductLocationForm";
import { getProductos } from "@/services/productos.service";
import { getProductLocation } from "@/services/warehouse.service";
import { toast } from "sonner";

import { renderWithQueryClient } from "../../../../tests/test-utils";

describe("ProductLocationForm - Integration", () => {
  const mockGetProductos = vi.mocked(getProductos);
  const mockGetProductLocation = vi.mocked(getProductLocation);
  const mockToast = vi.mocked(toast);
  let product: {
    id: string;
    sku: string;
    nombre: string;
    descripcion: string;
    precio: number;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(11);
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

  it("muestra un error si la consulta de ubicación falla", async () => {
    const error = new Error("network error");
    mockGetProductLocation.mockRejectedValue(error);

    const user = userEvent.setup();
    renderWithQueryClient(
      <ProductLocationForm open={true} onOpenChange={vi.fn()} />
    );

    await user.click(await screen.findByRole("combobox"));
    const optionLabel = `${product.sku} - ${product.nombre}`;
    await user.click(await screen.findByText(optionLabel));
    await user.click(screen.getByRole("button", { name: /consultar/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Error al consultar la ubicación del producto"
      );
    });
    expect(mockGetProductLocation).toHaveBeenCalledWith({ sku: product.sku });
    expect(screen.getByRole("button", { name: /consultar/i })).toBeEnabled();
  });
});
