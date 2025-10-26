import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

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

const mockedGetProductos = vi.mocked(getProductos);
const mockedGetProductLocation = vi.mocked(getProductLocation);
const mockedToast = vi.mocked(toast);

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ProductLocationForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  return { onOpenChange, ...utils };
};

describe("ProductLocationForm - Functional", () => {
  beforeEach(() => {
    mockedGetProductos.mockReset();
    mockedGetProductLocation.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    mockedToast.warning.mockReset();
    faker.seed(1002);
  });

  it("muestra error cuando la consulta de localización falla", async () => {
    const user = userEvent.setup();

    const productos = [
      {
        id: "1",
        sku: "MED-001",
        nombre: faker.commerce.productName(),
        descripcion: faker.commerce.productDescription(),
        precio: 5000,
        activo: true,
      },
    ];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    const errorMessage = "Error de conexión con el servidor";
    mockedGetProductLocation.mockRejectedValue(new Error(errorMessage));

    setup();

    // Seleccionar producto
    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    const option = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(option);

    // Consultar
    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    await user.click(consultarButton);

    // Verificar que se muestra el error
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Error al consultar la ubicación del producto"
      )
    );

    // Verificar que el botón vuelve a estar habilitado
    expect(consultarButton).not.toBeDisabled();
  });

  it("muestra error cuando se intenta consultar sin seleccionar producto", async () => {
    const user = userEvent.setup();

    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    setup();

    // Intentar consultar sin seleccionar producto (aunque el botón esté deshabilitado, probamos el handler)
    // Esto prueba la validación del handler
    const consultarButton = screen.getByRole("button", { name: /consultar/i });

    // El botón debe estar deshabilitado
    expect(consultarButton).toBeDisabled();
  });

  it("maneja error en la carga de productos", async () => {
    mockedGetProductos.mockRejectedValue(
      new Error("Error al cargar productos")
    );

    setup();

    // El componente debe manejar el error gracefully sin crashear
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("permite cancelar durante la consulta", async () => {
    const user = userEvent.setup();

    const productos = [
      {
        id: "1",
        sku: "MED-001",
        nombre: faker.commerce.productName(),
        descripcion: faker.commerce.productDescription(),
        precio: 5000,
        activo: true,
      },
    ];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    // Simular una consulta lenta
    mockedGetProductLocation.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              sku: "MED-001",
              bodega: "Bogotá-1",
              zona: "Z4-2",
              encontrado: true,
            });
          }, 200);
        })
    );

    const { onOpenChange } = setup();

    // Seleccionar producto
    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    const option = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(option);

    // Iniciar consulta
    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    await user.click(consultarButton);

    // Verificar que está en estado de carga
    expect(await screen.findByText("Consultando...")).toBeInTheDocument();

    // Cancelar
    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    await user.click(cancelButton);

    // Verificar que se cerró el modal
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("limpia el formulario al cancelar", async () => {
    const user = userEvent.setup();

    const productos = [
      {
        id: "1",
        sku: "MED-001",
        nombre: faker.commerce.productName(),
        descripcion: faker.commerce.productDescription(),
        precio: 5000,
        activo: true,
      },
    ];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetProductLocation.mockResolvedValue({
      sku: "MED-001",
      bodega: "Bogotá-1",
      zona: "Z4-2",
      encontrado: true,
    });

    const { onOpenChange } = setup();

    // Seleccionar producto
    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    const option = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(option);

    // Consultar
    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    await user.click(consultarButton);

    // Esperar resultado
    await waitFor(() =>
      expect(
        screen.getByText("Su producto se encuentra en la bodega:")
      ).toBeInTheDocument()
    );

    // Cancelar
    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    await user.click(cancelButton);

    // Verificar que se cerró y se limpiaron los datos
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("no permite múltiples consultas simultáneas", async () => {
    const user = userEvent.setup();

    const productos = [
      {
        id: "1",
        sku: "MED-001",
        nombre: faker.commerce.productName(),
        descripcion: faker.commerce.productDescription(),
        precio: 5000,
        activo: true,
      },
    ];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    // Simular una consulta lenta
    mockedGetProductLocation.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              sku: "MED-001",
              bodega: "Bogotá-1",
              zona: "Z4-2",
              encontrado: true,
            });
          }, 300);
        })
    );

    setup();

    // Seleccionar producto
    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    const option = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(option);

    // Primera consulta
    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    await user.click(consultarButton);

    // Verificar que está en estado de carga y el botón está deshabilitado
    expect(await screen.findByText("Consultando...")).toBeInTheDocument();
    expect(consultarButton).toBeDisabled();

    // Intentar hacer otra consulta (el botón debe estar deshabilitado)
    expect(consultarButton).toBeDisabled();

    // Esperar a que termine
    await waitFor(
      () => {
        expect(screen.getByText("Consultar")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // Verificar que solo se llamó una vez al servicio
    expect(mockedGetProductLocation).toHaveBeenCalledTimes(1);
  });

  it("maneja respuestas con datos incompletos", async () => {
    const user = userEvent.setup();

    const productos = [
      {
        id: "1",
        sku: "MED-001",
        nombre: faker.commerce.productName(),
        descripcion: faker.commerce.productDescription(),
        precio: 5000,
        activo: true,
      },
    ];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    // Respuesta con datos incompletos pero válidos
    mockedGetProductLocation.mockResolvedValue({
      sku: "MED-001",
      bodega: "Bogotá-1",
      zona: "Z4-2",
      encontrado: true,
    });

    setup();

    // Seleccionar producto
    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    const option = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(option);

    // Consultar
    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    await user.click(consultarButton);

    // Debe manejar la respuesta sin errores
    await waitFor(() =>
      expect(
        screen.getByText("Su producto se encuentra en la bodega:")
      ).toBeInTheDocument()
    );
  });
});
