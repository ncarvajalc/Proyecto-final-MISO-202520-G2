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

const renderForm = () => {
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

describe("ProductWarehouseLocationForm - Acceptance", () => {
  beforeEach(() => {
    mockedGetProductos.mockReset();
    mockedGetBodegas.mockReset();
    mockedGetProductLocationInWarehouse.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    mockedToast.warning.mockReset();
    faker.seed(2004);
  });

  it("HUP-009: permite seleccionar un producto (SKU) y una bodega desde menús desplegables", async () => {
    const user = userEvent.setup();

    // Given: Un operador logístico quiere consultar la ubicación de un producto en una bodega
    const productos = [
      {
        id: "1",
        sku: "MED-12345",
        nombre: "Termómetro Digital",
        descripcion: "Termómetro digital de alta precisión",
        precio: 45000,
        activo: true,
      },
      {
        id: "2",
        sku: "MED-67890",
        nombre: "Tensiómetro",
        descripcion: "Tensiómetro digital automático",
        precio: 120000,
        activo: true,
      },
    ];

    const bodegas = [
      { id: "1", nombre: "Bogotá-1", ubicacion: "Bogotá" },
      { id: "2", nombre: "Medellín-1", ubicacion: "Medellín" },
      { id: "3", nombre: "Cali-1", ubicacion: "Cali" },
    ];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 2,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetBodegas.mockResolvedValue(bodegas);

    renderForm();

    // When: El operador accede al formulario
    // Then: Puede ver y seleccionar un producto del menú desplegable
    await waitFor(() => {
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes[0]).not.toBeDisabled();
    });

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);

    expect(
      await screen.findByText("MED-12345 - Termómetro Digital")
    ).toBeInTheDocument();
    expect(screen.getByText("MED-67890 - Tensiómetro")).toBeInTheDocument();

    const productoOption = screen.getByText("MED-12345 - Termómetro Digital");
    await user.click(productoOption);

    // And: Puede ver y seleccionar una bodega del menú desplegable
    await user.click(comboboxes[1]);

    expect(await screen.findByText("Bogotá-1")).toBeInTheDocument();
    expect(screen.getByText("Medellín-1")).toBeInTheDocument();
    expect(screen.getByText("Cali-1")).toBeInTheDocument();

    const bodegaOption = screen.getByText("Bogotá-1");
    await user.click(bodegaOption);

    // And: El botón Localizar está habilitado
    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    expect(localizarButton).not.toBeDisabled();
  }, 20000);

  it("HUP-009: al presionar Localizar, muestra la zona o posición exacta del producto (Z4-2)", async () => {
    const user = userEvent.setup();

    // Given: Un operador ha seleccionado un producto y una bodega
    const productos = [
      {
        id: "1",
        sku: "MED-12345",
        nombre: "Termómetro Digital",
        descripcion: "Termómetro digital de alta precisión",
        precio: 45000,
        activo: true,
      },
    ];

    const bodegas = [{ id: "1", nombre: "Bogotá-1", ubicacion: "Bogotá" }];

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

    renderForm();

    // When: Selecciona el producto y la bodega
    await waitFor(() => {
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes[0]).not.toBeDisabled();
    });

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    const productoOption = await screen.findByText(
      "MED-12345 - Termómetro Digital"
    );
    await user.click(productoOption);

    await user.click(comboboxes[1]);
    const bodegaOption = await screen.findByText("Bogotá-1");
    await user.click(bodegaOption);

    // And: Presiona el botón "Localizar"
    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Then: El sistema muestra en pantalla la zona exacta (Z4-2)
    await waitFor(() =>
      expect(
        screen.getByText("Su producto se encuentra en la zona:")
      ).toBeInTheDocument()
    );

    expect(screen.getByText("Z4-2")).toBeInTheDocument();

    // And: Se muestra un mensaje de éxito
    expect(mockedToast.success).toHaveBeenCalledWith(
      "Producto localizado en zona Z4-2"
    );

    // And: Se llamó al servicio con los parámetros correctos
    expect(mockedGetProductLocationInWarehouse).toHaveBeenCalledWith({
      sku: "MED-12345",
      bodegaId: "1",
    });
  }, 20000);

  it("HUP-009: muestra mensaje cuando el producto no se encuentra en la bodega seleccionada", async () => {
    const user = userEvent.setup();

    // Given: Un operador quiere localizar un producto que no está en la bodega seleccionada
    const productos = [
      {
        id: "1",
        sku: "MED-99999",
        nombre: "Producto Agotado",
        descripcion: "Producto temporalmente agotado",
        precio: 25000,
        activo: true,
      },
    ];

    const bodegas = [{ id: "2", nombre: "Medellín-1", ubicacion: "Medellín" }];

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

    renderForm();

    // When: El operador selecciona el producto y la bodega, y presiona "Localizar"
    await waitFor(() => {
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes[0]).not.toBeDisabled();
    });

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    const productoOption = await screen.findByText(
      "MED-99999 - Producto Agotado"
    );
    await user.click(productoOption);

    await user.click(comboboxes[1]);
    const bodegaOption = await screen.findByText("Medellín-1");
    await user.click(bodegaOption);

    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Then: Se muestra el mensaje "Producto no localizado en esta bodega"
    await waitFor(() =>
      expect(
        screen.getByText("Producto no localizado en esta bodega")
      ).toBeInTheDocument()
    );

    // And: Se muestra un toast de advertencia
    expect(mockedToast.warning).toHaveBeenCalledWith(
      "Producto no localizado en esta bodega"
    );
  }, 20000);

  it("HUP-009: no permite presionar Localizar si no se ha seleccionado producto o bodega", async () => {
    const user = userEvent.setup();

    // Given: Un operador logístico abre el formulario de consulta
    const productos = [
      {
        id: "1",
        sku: "MED-001",
        nombre: "Producto Test",
        descripcion: faker.commerce.productDescription(),
        precio: 10000,
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

    renderForm();

    // When: No se ha seleccionado ningún producto ni bodega
    await waitFor(() => {
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes[0]).toBeInTheDocument();
    });

    // Then: El botón "Localizar" está deshabilitado
    let localizarButton = screen.getByRole("button", { name: /localizar/i });
    expect(localizarButton).toBeDisabled();

    // When: Se selecciona solo el producto (sin bodega)
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    const productoOption = await screen.findByText("MED-001 - Producto Test");
    await user.click(productoOption);

    // Then: El botón "Localizar" sigue deshabilitado
    localizarButton = screen.getByRole("button", { name: /localizar/i });
    expect(localizarButton).toBeDisabled();

    // When: Se selecciona la bodega también
    await user.click(comboboxes[1]);
    const bodegaOption = await screen.findByText("Bogotá-1");
    await user.click(bodegaOption);

    // Then: El botón "Localizar" se habilita
    localizarButton = screen.getByRole("button", { name: /localizar/i });
    expect(localizarButton).not.toBeDisabled();
  }, 20000);

  it("HUP-009: flujo completo - localizar productos en diferentes bodegas", async () => {
    const user = userEvent.setup();

    // Given: Un operador necesita localizar varios productos en diferentes bodegas
    const productos = [
      {
        id: "1",
        sku: "MED-001",
        nombre: "Producto A",
        descripcion: faker.commerce.productDescription(),
        precio: 10000,
        activo: true,
      },
      {
        id: "2",
        sku: "MED-002",
        nombre: "Producto B",
        descripcion: faker.commerce.productDescription(),
        precio: 20000,
        activo: true,
      },
    ];

    const bodegas = [
      { id: "1", nombre: "Bogotá-1" },
      { id: "2", nombre: "Medellín-1" },
      { id: "3", nombre: "Cali-1" },
    ];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 2,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetBodegas.mockResolvedValue(bodegas);

    // Primera consulta - producto encontrado en Bogotá
    mockedGetProductLocationInWarehouse.mockResolvedValueOnce({
      sku: "MED-001",
      bodega: "Bogotá-1",
      zona: "Z1-3",
      encontrado: true,
    });

    renderForm();

    // When: Localiza el primer producto en Bogotá
    await waitFor(() => {
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes[0]).not.toBeDisabled();
    });

    let comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    let option = await screen.findByText("MED-001 - Producto A");
    await user.click(option);

    await user.click(comboboxes[1]);
    option = await screen.findByText("Bogotá-1");
    await user.click(option);

    let localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Then: Ve la ubicación del primer producto
    await waitFor(() => expect(screen.getByText("Z1-3")).toBeInTheDocument());

    // When: Localiza el segundo producto en Medellín (no encontrado)
    mockedGetProductLocationInWarehouse.mockResolvedValueOnce({
      sku: "MED-002",
      bodega: "Medellín-1",
      zona: "",
      encontrado: false,
    });

    comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    option = await screen.findByText("MED-002 - Producto B");
    await user.click(option);

    await user.click(comboboxes[1]);
    option = await screen.findByText("Medellín-1");
    await user.click(option);

    localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Then: Ve que el producto no fue encontrado en esa bodega
    await waitFor(() =>
      expect(
        screen.getByText("Producto no localizado en esta bodega")
      ).toBeInTheDocument()
    );

    // When: Busca el mismo producto en Cali (encontrado)
    mockedGetProductLocationInWarehouse.mockResolvedValueOnce({
      sku: "MED-002",
      bodega: "Cali-1",
      zona: "Z5-8",
      encontrado: true,
    });

    comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[1]);
    option = await screen.findByText("Cali-1");
    await user.click(option);

    localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Then: Ve la ubicación en Cali
    await waitFor(() => expect(screen.getByText("Z5-8")).toBeInTheDocument());

    // And: Todas las consultas se realizaron correctamente
    expect(mockedGetProductLocationInWarehouse).toHaveBeenCalledTimes(3);
  }, 30000);

  it("HUP-009: optimiza la preparación de pedidos mostrando ubicación exacta", async () => {
    const user = userEvent.setup();

    // Given: Un operador logístico necesita preparar un pedido urgente
    const productos = [
      {
        id: "1",
        sku: "MED-URGENT",
        nombre: "Producto Urgente",
        descripcion: "Producto para pedido urgente",
        precio: 50000,
        activo: true,
      },
    ];

    const bodegas = [{ id: "3", nombre: "Cali-1", ubicacion: "Cali" }];

    // Sistema retorna ubicación exacta
    const locationResult = {
      sku: "MED-URGENT",
      bodega: "Cali-1",
      zona: "Z3-7",
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

    renderForm();

    // When: Selecciona el producto y la bodega específica
    await waitFor(() => {
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes[0]).not.toBeDisabled();
    });

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    const productoOption = await screen.findByText(
      "MED-URGENT - Producto Urgente"
    );
    await user.click(productoOption);

    await user.click(comboboxes[1]);
    const bodegaOption = await screen.findByText("Cali-1");
    await user.click(bodegaOption);

    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    await user.click(localizarButton);

    // Then: El sistema muestra la zona específica dentro de la bodega
    await waitFor(() => expect(screen.getByText("Z3-7")).toBeInTheDocument());

    // And: Muestra un indicador visual de que el producto fue encontrado
    const successIndicator = screen.getByText(
      "Su producto se encuentra en la zona:"
    );
    expect(successIndicator).toBeInTheDocument();

    // And: La información es clara y precisa para optimizar la preparación
    expect(mockedGetProductLocationInWarehouse).toHaveBeenCalledWith({
      sku: "MED-URGENT",
      bodegaId: "3",
    });

    expect(mockedToast.success).toHaveBeenCalledWith(
      "Producto localizado en zona Z3-7"
    );
  }, 20000);
});
