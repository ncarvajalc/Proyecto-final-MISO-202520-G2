import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import { ProductLocationForm } from "@/components/warehouse/ProductLocationForm";
import { getProductos } from "@/services/productos.service";
import { getProductLocation } from "@/services/warehouse.service";

const mockedGetProductos = vi.mocked(getProductos);

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
      <ProductLocationForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  return { onOpenChange, ...utils };
};

describe("ProductLocationForm - Unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(1001);
  });

  it("renderiza el formulario con el título correcto", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    renderForm();

    expect(screen.getByText("Disponibilidad en bodega")).toBeInTheDocument();
    expect(
      screen.getByText("Seleccione el producto que quiere consultar")
    ).toBeInTheDocument();
  });

  it("muestra el selector de SKU", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    renderForm();

    expect(screen.getByLabelText("SKU")).toBeInTheDocument();
  });

  it("deshabilita el selector mientras carga productos", async () => {
    mockedGetProductos.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    renderForm();

    // El combobox debe estar deshabilitado mientras carga
    const combobox = screen.getByRole("combobox");
    expect(combobox).toBeDisabled();
  });

  it("muestra la lista de productos en el selector", async () => {
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

    renderForm();

    const combobox = screen.getByRole("combobox");
    await userEvent.click(combobox);

    expect(
      await screen.findByText(`${productos[0].sku} - ${productos[0].nombre}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${productos[1].sku} - ${productos[1].nombre}`)
    ).toBeInTheDocument();
  });

  it("muestra mensaje cuando no hay productos disponibles", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    renderForm();

    const combobox = screen.getByRole("combobox");
    await userEvent.click(combobox);

    expect(
      await screen.findByText("No hay productos disponibles")
    ).toBeInTheDocument();
  });

  it("deshabilita el botón Consultar cuando no hay SKU seleccionado", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    renderForm();

    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    expect(consultarButton).toBeDisabled();
  });

  it("habilita el botón Consultar cuando se selecciona un SKU", async () => {
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

    renderForm();

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);

    const option = await screen.findByText(
      `${productos[0].sku} - ${productos[0].nombre}`
    );
    await user.click(option);

    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    expect(consultarButton).not.toBeDisabled();
  });

  it("muestra el botón Cancelar", async () => {
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

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

    const { onOpenChange } = renderForm();

    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
