import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import { ProductWarehouseLocationForm } from "@/components/warehouse/ProductWarehouseLocationForm";
import { getProductos } from "@/services/productos.service";
import {
  getBodegas,
  getProductLocationInWarehouse,
} from "@/services/warehouse.service";

const mockedGetProductos = vi.mocked(getProductos);
const mockedGetBodegas = vi.mocked(getBodegas);

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

describe("ProductWarehouseLocationForm - Unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(2001);
  });

  it("renderiza el formulario con el título correcto", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    mockedGetBodegas.mockResolvedValue([]);

    renderForm();

    expect(
      screen.getByText("Consulta de producto en bodega")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Seleccione el producto que quiere consultar")
    ).toBeInTheDocument();
  });

  it("muestra los dos selectores (SKU y Bodega)", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    mockedGetBodegas.mockResolvedValue([]);

    renderForm();

    expect(screen.getByLabelText("SKU")).toBeInTheDocument();
    expect(screen.getByLabelText("Bodega")).toBeInTheDocument();
  });

  it("muestra los pasos numerados", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    mockedGetBodegas.mockResolvedValue([]);

    renderForm();

    expect(screen.getByText("1. Seleccionar producto")).toBeInTheDocument();
    expect(screen.getByText("2. Seleccionar bodega")).toBeInTheDocument();
  });

  it("deshabilita los selectores mientras carga datos", async () => {
    mockedGetProductos.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );
    mockedGetBodegas.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    renderForm();

    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes[0]).toBeDisabled(); // SKU selector
    expect(comboboxes[1]).toBeDisabled(); // Bodega selector
  });

  it("muestra la lista de productos en el selector de SKU", async () => {
    const productos = [
      {
        id: "1",
        sku: "MED-001",
        nombre: faker.commerce.productName(),
        descripcion: faker.commerce.productDescription(),
        precio: 5000,
        activo: true,
      },
      {
        id: "2",
        sku: "MED-002",
        nombre: faker.commerce.productName(),
        descripcion: faker.commerce.productDescription(),
        precio: 7000,
        activo: true,
      },
    ];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 2,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetBodegas.mockResolvedValue([]);

    renderForm();

    const comboboxes = screen.getAllByRole("combobox");
    await userEvent.click(comboboxes[0]); // Click SKU selector

    expect(
      await screen.findByText(`${productos[0].sku} - ${productos[0].nombre}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${productos[1].sku} - ${productos[1].nombre}`)
    ).toBeInTheDocument();
  });

  it("muestra la lista de bodegas en el selector de Bodega", async () => {
    const bodegas = [
      { id: "1", nombre: "Bogotá-1" },
      { id: "2", nombre: "Medellín-1" },
    ];

    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    mockedGetBodegas.mockResolvedValue(bodegas);

    renderForm();

    const comboboxes = screen.getAllByRole("combobox");
    await userEvent.click(comboboxes[1]); // Click Bodega selector

    expect(await screen.findByText("Bogotá-1")).toBeInTheDocument();
    expect(screen.getByText("Medellín-1")).toBeInTheDocument();
  });

  it("muestra mensaje cuando no hay productos disponibles", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    mockedGetBodegas.mockResolvedValue([]);

    renderForm();

    const comboboxes = screen.getAllByRole("combobox");
    await userEvent.click(comboboxes[0]);

    expect(
      await screen.findByText("No hay productos disponibles")
    ).toBeInTheDocument();
  });

  it("muestra mensaje cuando no hay bodegas disponibles", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    mockedGetBodegas.mockResolvedValue([]);

    renderForm();

    const comboboxes = screen.getAllByRole("combobox");
    await userEvent.click(comboboxes[1]);

    expect(
      await screen.findByText("No hay bodegas disponibles")
    ).toBeInTheDocument();
  });

  it("deshabilita el botón Localizar cuando no hay selecciones", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    mockedGetBodegas.mockResolvedValue([]);

    renderForm();

    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    expect(localizarButton).toBeDisabled();
  });

  it("deshabilita el botón Localizar cuando solo se selecciona producto", async () => {
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

    mockedGetBodegas.mockResolvedValue([]);

    renderForm();

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);

    const option = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(option);

    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    expect(localizarButton).toBeDisabled();
  });

  it("habilita el botón Localizar cuando se seleccionan ambos (producto y bodega)", async () => {
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

    renderForm();

    // Seleccionar producto
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    const productoOption = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(productoOption);

    // Seleccionar bodega
    await user.click(comboboxes[1]);
    const bodegaOption = await screen.findByText("Bogotá-1");
    await user.click(bodegaOption);

    const localizarButton = screen.getByRole("button", { name: /localizar/i });
    expect(localizarButton).not.toBeDisabled();
  });

  it("muestra el botón Cancelar", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    mockedGetBodegas.mockResolvedValue([]);

    renderForm();

    expect(
      screen.getByRole("button", { name: /cancelar/i })
    ).toBeInTheDocument();
  });

  it("cierra el modal al hacer clic en Cancelar", async () => {
    const user = userEvent.setup();
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    mockedGetBodegas.mockResolvedValue([]);

    const { onOpenChange } = renderForm();

    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
