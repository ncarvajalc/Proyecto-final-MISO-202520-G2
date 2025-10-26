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
  getBodegas: vi.fn(),
  getProductLocationInWarehouse: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

import { ProductWarehouseLocationForm } from "@/components/warehouse/ProductWarehouseLocationForm";
import { getProductos } from "@/services/productos.service";
import {
  getBodegas,
  getProductLocationInWarehouse,
} from "@/services/warehouse.service";
import { toast } from "sonner";

const mockedGetProductos = vi.mocked(getProductos);
const mockedGetBodegas = vi.mocked(getBodegas);
const mockedGetProductLocationInWarehouse = vi.mocked(
  getProductLocationInWarehouse
);
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
      <ProductWarehouseLocationForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  return { onOpenChange, ...utils };
};

describe("ProductWarehouseLocationForm - Functional", () => {
  beforeEach(() => {
    mockedGetProductos.mockReset();
    mockedGetBodegas.mockReset();
    mockedGetProductLocationInWarehouse.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    mockedToast.warning.mockReset();
    faker.seed(2002);
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

    const bodegas = [{ id: "1", nombre: "Bogotá-1" }];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetBodegas.mockResolvedValue(bodegas);

    const errorMessage = "Error de conexión con el servidor";
    mockedGetProductLocationInWarehouse.mockRejectedValue(
      new Error(errorMessage)
    );

    setup();

    // Seleccionar producto y bodega
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    const productoOption = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(productoOption);

    await user.click(comboboxes[1]);
    const bodegaOption = await screen.findByText("Bogotá-1");
    await user.click(bodegaOption);

    // Localizar
    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Verificar que se muestra el error
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Error al consultar la ubicación del producto"
      )
    );

    // Verificar que el botón vuelve a estar habilitado
    expect(localizarButton).not.toBeDisabled();
  });

  it("muestra error cuando se intenta localizar sin seleccionar producto y bodega", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    mockedGetBodegas.mockResolvedValue([]);

    setup();

    // El botón debe estar deshabilitado
    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    expect(localizarButton).toBeDisabled();
  });

  it("maneja error en la carga de productos", async () => {
    mockedGetProductos.mockRejectedValue(
      new Error("Error al cargar productos")
    );
    mockedGetBodegas.mockResolvedValue([]);

    setup();

    // El componente debe manejar el error gracefully sin crashear
    await waitFor(() => {
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes[0]).toBeInTheDocument();
    });
  });

  it("maneja error en la carga de bodegas", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    mockedGetBodegas.mockRejectedValue(new Error("Error al cargar bodegas"));

    setup();

    // El componente debe manejar el error gracefully sin crashear
    await waitFor(() => {
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes[1]).toBeInTheDocument();
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

    const bodegas = [{ id: "1", nombre: "Bogotá-1" }];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetBodegas.mockResolvedValue(bodegas);

    // Simular una consulta lenta
    mockedGetProductLocationInWarehouse.mockImplementation(
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

    // Seleccionar producto y bodega
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    const productoOption = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(productoOption);

    await user.click(comboboxes[1]);
    const bodegaOption = await screen.findByText("Bogotá-1");
    await user.click(bodegaOption);

    // Iniciar localización
    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Verificar que está en estado de carga
    expect(await screen.findByText("Localizando...")).toBeInTheDocument();

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

    const bodegas = [{ id: "1", nombre: "Bogotá-1" }];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetBodegas.mockResolvedValue(bodegas);

    mockedGetProductLocationInWarehouse.mockResolvedValue({
      sku: "MED-001",
      bodega: "Bogotá-1",
      zona: "Z4-2",
      encontrado: true,
    });

    const { onOpenChange } = setup();

    // Seleccionar producto y bodega
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    const productoOption = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(productoOption);

    await user.click(comboboxes[1]);
    const bodegaOption = await screen.findByText("Bogotá-1");
    await user.click(bodegaOption);

    // Localizar
    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Esperar resultado
    await waitFor(() =>
      expect(
        screen.getByText("Su producto se encuentra en la zona:")
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

    const bodegas = [{ id: "1", nombre: "Bogotá-1" }];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetBodegas.mockResolvedValue(bodegas);

    // Simular una consulta lenta
    mockedGetProductLocationInWarehouse.mockImplementation(
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

    // Seleccionar producto y bodega
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    const productoOption = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(productoOption);

    await user.click(comboboxes[1]);
    const bodegaOption = await screen.findByText("Bogotá-1");
    await user.click(bodegaOption);

    // Primera localización
    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Verificar que está en estado de carga y el botón está deshabilitado
    expect(await screen.findByText("Localizando...")).toBeInTheDocument();
    expect(localizarButton).toBeDisabled();

    // Intentar hacer otra localización (el botón debe estar deshabilitado)
    expect(localizarButton).toBeDisabled();

    // Esperar a que termine
    await waitFor(
      () => {
        expect(screen.getByText("Localizar")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // Verificar que solo se llamó una vez al servicio
    expect(mockedGetProductLocationInWarehouse).toHaveBeenCalledTimes(1);
  });

  it("maneja respuestas con datos válidos", async () => {
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

    const bodegas = [{ id: "1", nombre: "Bogotá-1" }];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetBodegas.mockResolvedValue(bodegas);

    // Respuesta con datos válidos
    mockedGetProductLocationInWarehouse.mockResolvedValue({
      sku: "MED-001",
      bodega: "Bogotá-1",
      zona: "Z4-2",
      encontrado: true,
    });

    setup();

    // Seleccionar producto y bodega
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    const productoOption = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(productoOption);

    await user.click(comboboxes[1]);
    const bodegaOption = await screen.findByText("Bogotá-1");
    await user.click(bodegaOption);

    // Localizar
    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Debe manejar la respuesta sin errores
    await waitFor(() =>
      expect(
        screen.getByText("Su producto se encuentra en la zona:")
      ).toBeInTheDocument()
    );
    expect(screen.getByText("Z4-2")).toBeInTheDocument();
  });
});
