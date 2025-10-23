import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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

describe("ProductAvailabilityLookup - Functional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(497);
  });

  it("deshabilita consultar hasta elegir un producto y consulta el servicio con el SKU", async () => {
    const user = userEvent.setup();

    const producto = {
      sku: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      nombre: faker.commerce.productName(),
    };

    mockedGetProductosInventario.mockResolvedValue([producto]);
    mockedConsultarDisponibilidadProducto.mockResolvedValue({
      warehouseId: faker.string.uuid(),
      warehouseName: `Bodega ${faker.location.city()}`,
      message: null,
    });

    renderLookup();

    const consultarButton = await screen.findByRole("button", { name: /consultar/i });
    expect(consultarButton).toBeDisabled();

    const productoSelect = screen.getByLabelText(/seleccionar producto/i);
    await user.click(productoSelect);
    await user.click(
      await screen.findByRole("option", {
        name: `${producto.sku} - ${producto.nombre}`,
      })
    );

    await waitFor(() => expect(consultarButton).toBeEnabled());

    await user.click(consultarButton);

    await waitFor(() => {
      expect(mockedConsultarDisponibilidadProducto).toHaveBeenCalledTimes(1);
    });

    const [call] = mockedConsultarDisponibilidadProducto.mock.calls;
    expect(call?.[0]).toBe(producto.sku);
  });

  it("muestra mensajes cuando no hay productos registrados", async () => {
    mockedGetProductosInventario.mockResolvedValue([]);
    mockedConsultarDisponibilidadProducto.mockResolvedValue({
      warehouseId: null,
      warehouseName: null,
      message: null,
    });

    renderLookup();

    expect(
      await screen.findByText(/no hay productos registrados en el inventario/i)
    ).toBeInTheDocument();
    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    expect(consultarButton).toBeDisabled();
  });

  it("muestra un mensaje de error cuando el inventario no puede consultarse", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockedGetProductosInventario.mockRejectedValue(new Error("No disponible"));

    renderLookup();

    expect(
      await screen.findByText(/no se pudieron cargar los productos/i)
    ).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it("muestra el mensaje de error del servicio cuando la disponibilidad falla", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const producto = {
      sku: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      nombre: faker.commerce.productName(),
    };

    mockedGetProductosInventario.mockResolvedValue([producto]);
    mockedConsultarDisponibilidadProducto.mockRejectedValue(
      new Error("Servicio de disponibilidad no disponible")
    );

    renderLookup();

    const productoSelect = await screen.findByLabelText(/seleccionar producto/i);
    await user.click(productoSelect);
    await user.click(
      await screen.findByRole("option", {
        name: `${producto.sku} - ${producto.nombre}`,
      })
    );

    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    await waitFor(() => expect(consultarButton).toBeEnabled());

    await user.click(consultarButton);

    await waitFor(() => {
      expect(mockedConsultarDisponibilidadProducto).toHaveBeenCalledTimes(1);
    });

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(/servicio de disponibilidad no disponible/i);

    consoleErrorSpy.mockRestore();
  });

  it("usa el mensaje de error por defecto cuando la excepción no tiene detalle", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const producto = {
      sku: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      nombre: faker.commerce.productName(),
    };

    mockedGetProductosInventario.mockResolvedValue([producto]);
    mockedConsultarDisponibilidadProducto.mockRejectedValue(new Error(""));

    renderLookup();

    const productoSelect = await screen.findByLabelText(/seleccionar producto/i);
    await user.click(productoSelect);
    await user.click(
      await screen.findByRole("option", {
        name: `${producto.sku} - ${producto.nombre}`,
      })
    );

    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    await waitFor(() => expect(consultarButton).toBeEnabled());

    await user.click(consultarButton);

    await waitFor(() => {
      expect(mockedConsultarDisponibilidadProducto).toHaveBeenCalledTimes(1);
    });

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(/no se pudo consultar la disponibilidad del producto/i);

    consoleErrorSpy.mockRestore();
  });
});
