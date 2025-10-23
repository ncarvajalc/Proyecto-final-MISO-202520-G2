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

describe("ProductWarehouseLocator - Functional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(311);
  });

  it("deshabilita localizar hasta elegir producto y bodega y envía los parámetros correctos", async () => {
    const user = userEvent.setup();

    const producto = {
      sku: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      nombre: faker.commerce.productName(),
    };
    const bodega = {
      id: faker.string.uuid(),
      nombre: `Bodega ${faker.location.city()}`,
    };

    mockedGetProductosInventario.mockResolvedValue([producto]);
    mockedGetBodegas.mockResolvedValue([bodega]);
    mockedLocalizarProductoEnBodega.mockResolvedValue({
      location: "Z4-2",
      message: null,
    });

    renderLocator();

    const localizarButton = await screen.findByRole("button", { name: /localizar/i });
    expect(localizarButton).toBeDisabled();

    const productoSelect = screen.getByLabelText(/seleccionar producto/i);
    await user.click(productoSelect);
    await user.click(
      await screen.findByRole("option", {
        name: `${producto.sku} - ${producto.nombre}`,
      })
    );

    await waitFor(() => expect(localizarButton).toBeDisabled());

    const bodegaSelect = screen.getByLabelText(/seleccionar bodega/i);
    await user.click(bodegaSelect);
    await user.click(
      await screen.findByRole("option", {
        name: bodega.nombre,
      })
    );

    await waitFor(() => expect(localizarButton).toBeEnabled());

    await user.click(localizarButton);

    await waitFor(() => {
      expect(mockedLocalizarProductoEnBodega).toHaveBeenCalledTimes(1);
    });

    const [call] = mockedLocalizarProductoEnBodega.mock.calls;
    expect(call?.[0]).toEqual({
      sku: producto.sku,
      warehouseId: bodega.id,
    });
  });

  it("muestra mensajes claros cuando no hay datos disponibles", async () => {
    mockedGetProductosInventario.mockResolvedValue([]);
    mockedGetBodegas.mockResolvedValue([]);
    mockedLocalizarProductoEnBodega.mockResolvedValue({ location: null, message: null });

    renderLocator();

    expect(
      await screen.findByText(/no hay productos disponibles para localizar/i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/no hay bodegas disponibles/i)).toBeInTheDocument();

    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    expect(localizarButton).toBeDisabled();
  });

  it("muestra mensajes de error cuando fallan las consultas de productos o bodegas", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockedGetProductosInventario.mockRejectedValue(new Error("Inventario no disponible"));
    mockedGetBodegas.mockRejectedValue(new Error("Bodegas no disponibles"));

    renderLocator();

    expect(
      await screen.findByText(/no se pudieron cargar los productos/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/no se pudieron cargar las bodegas/i)
    ).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it("muestra el mensaje de error del servicio cuando la localización falla", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const producto = {
      sku: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      nombre: faker.commerce.productName(),
    };
    const bodega = {
      id: faker.string.uuid(),
      nombre: `Bodega ${faker.location.city()}`,
    };

    mockedGetProductosInventario.mockResolvedValue([producto]);
    mockedGetBodegas.mockResolvedValue([bodega]);
    mockedLocalizarProductoEnBodega.mockRejectedValue(
      new Error("Servicio de localización no disponible")
    );

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

    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await waitFor(() => expect(localizarButton).toBeEnabled());

    await user.click(localizarButton);

    await waitFor(() => {
      expect(mockedLocalizarProductoEnBodega).toHaveBeenCalledTimes(1);
    });

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(/servicio de localización no disponible/i);

    consoleErrorSpy.mockRestore();
  });

  it("usa el mensaje de error por defecto cuando no hay detalles de la excepción", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const producto = {
      sku: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      nombre: faker.commerce.productName(),
    };
    const bodega = {
      id: faker.string.uuid(),
      nombre: `Bodega ${faker.location.city()}`,
    };

    mockedGetProductosInventario.mockResolvedValue([producto]);
    mockedGetBodegas.mockResolvedValue([bodega]);
    const errorSinMensaje = new Error("");
    mockedLocalizarProductoEnBodega.mockRejectedValue(errorSinMensaje);

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

    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await waitFor(() => expect(localizarButton).toBeEnabled());

    await user.click(localizarButton);

    await waitFor(() => {
      expect(mockedLocalizarProductoEnBodega).toHaveBeenCalledTimes(1);
    });

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(/no se pudo localizar el producto en la bodega seleccionada/i);

    consoleErrorSpy.mockRestore();
  });
});
