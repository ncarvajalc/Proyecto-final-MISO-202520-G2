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

describe("ProductLocationForm - Functional", () => {
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
    faker.seed(10);
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

  const renderForm = () => {
    const onOpenChange = vi.fn();
    const utils = renderWithQueryClient(
      <ProductLocationForm open={true} onOpenChange={onOpenChange} />
    );
    return { onOpenChange, ...utils };
  };

  it("muestra la información de localización cuando la consulta es exitosa", async () => {
    const warehouse = faker.company.name();
    const zone = faker.string.alphanumeric(3).toUpperCase();
    mockGetProductLocation.mockResolvedValue({
      sku: product.sku,
      bodega: warehouse,
      zona: zone,
      encontrado: true,
    });

    const user = userEvent.setup();
    renderForm();

    await user.click(await screen.findByRole("combobox"));
    const optionLabel = `${product.sku} - ${product.nombre}`;
    await user.click(await screen.findByText(optionLabel));
    await user.click(screen.getByRole("button", { name: /consultar/i }));

    expect(mockGetProductLocation).toHaveBeenCalledWith({ sku: product.sku });
    await waitFor(() => {
      expect(
        screen.getByText("Su producto se encuentra en la bodega:")
      ).toBeInTheDocument();
    });
    expect(screen.getByText(warehouse)).toBeInTheDocument();
    expect(mockToast.success).toHaveBeenCalledWith(
      `Producto localizado en ${warehouse}, zona ${zone}`
    );
  });

  it("notifica cuando el producto no es encontrado", async () => {
    const warehouse = faker.company.name();
    const zone = faker.string.alphanumeric(3).toUpperCase();
    mockGetProductLocation.mockResolvedValue({
      sku: product.sku,
      bodega: warehouse,
      zona: zone,
      encontrado: false,
    });

    const user = userEvent.setup();
    renderForm();

    await user.click(await screen.findByRole("combobox"));
    const optionLabel = `${product.sku} - ${product.nombre}`;
    await user.click(await screen.findByText(optionLabel));
    await user.click(screen.getByRole("button", { name: /consultar/i }));

    await waitFor(() => {
      expect(mockToast.warning).toHaveBeenCalledWith(
        "Producto no localizado en ninguna bodega"
      );
    });
  });
});
