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

describe("ProductWarehouseLocationForm - Integration", () => {
  beforeEach(() => {
    mockedGetProductos.mockReset();
    mockedGetBodegas.mockReset();
    mockedGetProductLocationInWarehouse.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    mockedToast.warning.mockReset();
    faker.seed(2003);
  });

  it("consulta la localización exitosamente cuando el producto se encuentra en la bodega", async () => {
    const user = userEvent.setup();

    const productos = [
      {
        id: "1",
        sku: "MED-12345",
        nombre: "Producto Test",
        descripcion: faker.commerce.productDescription(),
        precio: 5000,
        activo: true,
      },
    ];

    const bodegas = [
      { id: "1", nombre: "Bogotá-1" },
      { id: "2", nombre: "Medellín-1" },
    ];

    const locationResult = {
      sku: "MED-12345",
      bodega: "Bogotá-1",
      zona: "Z4-2",
      encontrado: true,
    };

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetBodegas.mockResolvedValue(bodegas);
    mockedGetProductLocationInWarehouse.mockResolvedValue(locationResult);

    setup();

    // Seleccionar producto
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    const productoOption = await screen.findByText("MED-12345 - Producto Test");
    await user.click(productoOption);

    // Seleccionar bodega
    await user.click(comboboxes[1]);
    const bodegaOption = await screen.findByText("Bogotá-1");
    await user.click(bodegaOption);

    // Localizar
    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Verificar que se llamó al servicio con los parámetros correctos
    await waitFor(() =>
      expect(mockedGetProductLocationInWarehouse).toHaveBeenCalledWith({
        sku: "MED-12345",
        bodegaId: "1",
      })
    );

    // Verificar que se muestra el toast de éxito
    await waitFor(() =>
      expect(mockedToast.success).toHaveBeenCalledWith(
        "Producto localizado en zona Z4-2"
      )
    );

    // Verificar que se muestra el resultado
    expect(
      await screen.findByText("Su producto se encuentra en la zona:")
    ).toBeInTheDocument();
    expect(screen.getByText("Z4-2")).toBeInTheDocument();
  });

  it("muestra mensaje cuando el producto no se encuentra en la bodega seleccionada", async () => {
    const user = userEvent.setup();

    const productos = [
      {
        id: "1",
        sku: "MED-99999",
        nombre: "Producto No Existente",
        descripcion: faker.commerce.productDescription(),
        precio: 5000,
        activo: true,
      },
    ];

    const bodegas = [{ id: "2", nombre: "Medellín-1" }];

    const locationResult = {
      sku: "MED-99999",
      bodega: "Medellín-1",
      zona: "",
      encontrado: false,
    };

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 1,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetBodegas.mockResolvedValue(bodegas);
    mockedGetProductLocationInWarehouse.mockResolvedValue(locationResult);

    setup();

    // Seleccionar producto
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    const productoOption = await screen.findByText(
      "MED-99999 - Producto No Existente"
    );
    await user.click(productoOption);

    // Seleccionar bodega
    await user.click(comboboxes[1]);
    const bodegaOption = await screen.findByText("Medellín-1");
    await user.click(bodegaOption);

    // Localizar
    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Verificar que se llamó al servicio
    await waitFor(() =>
      expect(mockedGetProductLocationInWarehouse).toHaveBeenCalledWith({
        sku: "MED-99999",
        bodegaId: "2",
      })
    );

    // Verificar que se muestra el toast de advertencia
    await waitFor(() =>
      expect(mockedToast.warning).toHaveBeenCalledWith(
        "Producto no localizado en esta bodega"
      )
    );

    // Verificar que se muestra el mensaje de no encontrado
    expect(
      await screen.findByText("Producto no localizado en esta bodega")
    ).toBeInTheDocument();
  });

  it("muestra indicador de carga durante la consulta", async () => {
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

    const bodegas = [{ id: "1", nombre: "Cali-1" }];

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
              bodega: "Cali-1",
              zona: "Z1-1",
              encontrado: true,
            });
          }, 100);
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
    const bodegaOption = await screen.findByText("Cali-1");
    await user.click(bodegaOption);

    // Localizar
    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Verificar que se muestra el estado de carga
    expect(await screen.findByText("Localizando...")).toBeInTheDocument();

    // Esperar a que termine
    await waitFor(
      () => {
        expect(screen.getByText("Localizar")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("reinicia el resultado al hacer una nueva consulta", async () => {
    const user = userEvent.setup();

    const productos = [
      {
        id: "1",
        sku: "MED-001",
        nombre: "Producto 1",
        descripcion: faker.commerce.productDescription(),
        precio: 5000,
        activo: true,
      },
      {
        id: "2",
        sku: "MED-002",
        nombre: "Producto 2",
        descripcion: faker.commerce.productDescription(),
        precio: 7000,
        activo: true,
      },
    ];

    const bodegas = [
      { id: "1", nombre: "Bogotá-1" },
      { id: "2", nombre: "Medellín-1" },
    ];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 2,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetBodegas.mockResolvedValue(bodegas);

    // Primera consulta - producto encontrado
    mockedGetProductLocationInWarehouse.mockResolvedValueOnce({
      sku: "MED-001",
      bodega: "Bogotá-1",
      zona: "Z4-2",
      encontrado: true,
    });

    setup();

    // Primera consulta
    let comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    let option = await screen.findByText("MED-001 - Producto 1");
    await user.click(option);

    await user.click(comboboxes[1]);
    option = await screen.findByText("Bogotá-1");
    await user.click(option);

    let localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    await waitFor(() =>
      expect(
        screen.getByText("Su producto se encuentra en la zona:")
      ).toBeInTheDocument()
    );
    expect(screen.getByText("Z4-2")).toBeInTheDocument();

    // Segunda consulta - producto no encontrado
    mockedGetProductLocationInWarehouse.mockResolvedValueOnce({
      sku: "MED-002",
      bodega: "Medellín-1",
      zona: "",
      encontrado: false,
    });

    comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    option = await screen.findByText("MED-002 - Producto 2");
    await user.click(option);

    await user.click(comboboxes[1]);
    option = await screen.findByText("Medellín-1");
    await user.click(option);

    localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Verificar que el resultado anterior ya no está visible y se muestra el nuevo
    await waitFor(() => {
      expect(
        screen.getByText("Producto no localizado en esta bodega")
      ).toBeInTheDocument();
    });
  });

  it("carga productos y bodegas con límite de 1000 al abrir el modal", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    mockedGetBodegas.mockResolvedValue([]);

    setup();

    await waitFor(() => {
      expect(mockedGetProductos).toHaveBeenCalledWith({
        page: 1,
        limit: 1000,
      });
      expect(mockedGetBodegas).toHaveBeenCalled();
    });
  });
});
