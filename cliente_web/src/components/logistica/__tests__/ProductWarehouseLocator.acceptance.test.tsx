import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

vi.mock("@/services/logistica.service", () => ({
  getProductosInventario: vi.fn(),
  getBodegas: vi.fn(),
  localizarProductoEnBodega: vi.fn(),
}));

import { ProductWarehouseLocator } from "@/components/logistica/ProductWarehouseLocator";
import {
  getProductosInventario,
  getBodegas,
  localizarProductoEnBodega,
} from "@/services/logistica.service";

const mockedGetProductosInventario = vi.mocked(getProductosInventario);
const mockedGetBodegas = vi.mocked(getBodegas);
const mockedLocalizarProductoEnBodega = vi.mocked(localizarProductoEnBodega);

const renderLocator = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ProductWarehouseLocator />
    </QueryClientProvider>
  );
};

describe("ProductWarehouseLocator - Acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(872);
  });

  it("permite localizar un producto mostrando la zona exacta", async () => {
    const user = userEvent.setup();

    const producto = {
      sku: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      nombre: faker.commerce.productName(),
    };
    const bodega = {
      id: faker.string.uuid(),
      nombre: `Bodega ${faker.location.city()}`,
    };
    const ubicacion = `${faker.string.alpha({ length: 1, casing: "upper" })}${faker.number.int({ min: 1, max: 5 })}-${faker.number.int({ min: 1, max: 9 })}`;

    mockedGetProductosInventario.mockResolvedValue([producto]);
    mockedGetBodegas.mockResolvedValue([bodega]);
    mockedLocalizarProductoEnBodega.mockResolvedValue({
      location: ubicacion,
      message: null,
    });

    renderLocator();

    const productoSelect = await screen.findByLabelText(/seleccionar producto/i);
    await user.click(productoSelect);
    await user.click(
      await screen.findByRole("option", {
        name: `${producto.sku} - ${producto.nombre}`,
      })
    );

    const bodegaSelect = screen.getByLabelText(/seleccionar bodega/i);
    await user.click(bodegaSelect);
    await user.click(
      await screen.findByRole("option", {
        name: bodega.nombre,
      })
    );

    await user.click(screen.getByRole("button", { name: /localizar/i }));

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`Ubicación encontrada:`, "i"))
      ).toBeInTheDocument();
    });
    expect(screen.getByText(ubicacion)).toBeInTheDocument();
  });

  it("informa cuando el producto no está en la bodega seleccionada", async () => {
    const user = userEvent.setup();

    const producto = {
      sku: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      nombre: faker.commerce.productName(),
    };
    const bodega = {
      id: faker.string.uuid(),
      nombre: `Bodega ${faker.location.city()}`,
    };
    const mensaje = "Producto no localizado en esta bodega";

    mockedGetProductosInventario.mockResolvedValue([producto]);
    mockedGetBodegas.mockResolvedValue([bodega]);
    mockedLocalizarProductoEnBodega.mockResolvedValue({
      location: null,
      message: mensaje,
    });

    renderLocator();

    const productoSelect = await screen.findByLabelText(/seleccionar producto/i);
    await user.click(productoSelect);
    await user.click(
      await screen.findByRole("option", {
        name: `${producto.sku} - ${producto.nombre}`,
      })
    );

    const bodegaSelect = screen.getByLabelText(/seleccionar bodega/i);
    await user.click(bodegaSelect);
    await user.click(
      await screen.findByRole("option", {
        name: bodega.nombre,
      })
    );

    await user.click(screen.getByRole("button", { name: /localizar/i }));

    expect(
      await screen.findByText(/producto no localizado en esta bodega/i)
    ).toBeInTheDocument();
  });
});
