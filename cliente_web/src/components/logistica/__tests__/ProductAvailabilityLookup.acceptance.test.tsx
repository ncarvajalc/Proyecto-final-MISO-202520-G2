import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

vi.mock("@/services/logistica.service", () => ({
  getProductosInventario: vi.fn(),
  consultarDisponibilidadProducto: vi.fn(),
}));

import { ProductAvailabilityLookup } from "@/components/logistica/ProductAvailabilityLookup";
import {
  getProductosInventario,
  consultarDisponibilidadProducto,
} from "@/services/logistica.service";

const mockedGetProductosInventario = vi.mocked(getProductosInventario);
const mockedConsultarDisponibilidadProducto = vi.mocked(
  consultarDisponibilidadProducto
);

const renderLookup = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ProductAvailabilityLookup />
    </QueryClientProvider>
  );
};

describe("ProductAvailabilityLookup - Acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(108);
  });

  it("muestra la bodega disponible cuando el servicio responde positivamente", async () => {
    const user = userEvent.setup();

    const producto = {
      sku: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      nombre: faker.commerce.productName(),
    };
    const bodegaDisponible = `Bodega ${faker.location.city()}`;

    mockedGetProductosInventario.mockResolvedValue([producto]);
    mockedConsultarDisponibilidadProducto.mockResolvedValue({
      warehouseId: faker.string.uuid(),
      warehouseName: bodegaDisponible,
      message: null,
    });

    renderLookup();

    const productoSelect = await screen.findByLabelText(/seleccionar producto/i);
    await user.click(productoSelect);
    await user.click(
      await screen.findByRole("option", {
        name: `${producto.sku} - ${producto.nombre}`,
      })
    );

    await user.click(screen.getByRole("button", { name: /consultar/i }));

    expect(
      await screen.findByText(new RegExp(`Disponible en`, "i"))
    ).toBeInTheDocument();
    expect(screen.getByText(bodegaDisponible)).toBeInTheDocument();
  });

  it("informa cuando el producto no tiene disponibilidad en bodegas", async () => {
    const user = userEvent.setup();

    const producto = {
      sku: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      nombre: faker.commerce.productName(),
    };

    mockedGetProductosInventario.mockResolvedValue([producto]);
    mockedConsultarDisponibilidadProducto.mockResolvedValue({
      warehouseId: null,
      warehouseName: null,
      message: "Producto sin disponibilidad en bodega",
    });

    renderLookup();

    const productoSelect = await screen.findByLabelText(/seleccionar producto/i);
    await user.click(productoSelect);
    await user.click(
      await screen.findByRole("option", {
        name: `${producto.sku} - ${producto.nombre}`,
      })
    );

    await user.click(screen.getByRole("button", { name: /consultar/i }));

    expect(
      await screen.findByText(/producto sin disponibilidad en bodega/i)
    ).toBeInTheDocument();
  });
});
