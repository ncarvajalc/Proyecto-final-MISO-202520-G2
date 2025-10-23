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

describe("ProductLocationForm - Acceptance", () => {
  beforeEach(() => {
    mockedGetProductos.mockReset();
    mockedGetProductLocation.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    mockedToast.warning.mockReset();
    faker.seed(1004);
  });

  it("HUP-009: permite consultar la ubicación de productos en bodega (Producto Encontrado)", async () => {
    const user = userEvent.setup();

    // Given: Un operador logístico quiere consultar la ubicación de un producto
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

    const locationResult = {
      sku: "MED-12345",
      bodega: "Bogotá-1",
      zona: "Z4-2",
      encontrado: true,
    };

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 2,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    mockedGetProductLocation.mockResolvedValue(locationResult);

    const { onOpenChange } = renderForm();

    // When: El operador selecciona un producto (SKU) desde el menú desplegable
    // Esperar a que los productos se carguen y el combobox esté habilitado
    await waitFor(() => {
      const combobox = screen.getByRole("combobox");
      expect(combobox).not.toBeDisabled();
    });

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);

    const option = await screen.findByText("MED-12345 - Termómetro Digital");
    await user.click(option);

    // And: Presiona el botón "Consultar"
    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    expect(consultarButton).not.toBeDisabled();

    await user.click(consultarButton);

    // Then: El sistema muestra en pantalla la zona o posición exacta del producto
    await waitFor(() =>
      expect(
        screen.getByText("Su producto se encuentra en la bodega:")
      ).toBeInTheDocument()
    );

    expect(screen.getByText("Bogotá-1")).toBeInTheDocument();
    expect(screen.getByText("Z4-2")).toBeInTheDocument();

    // And: Se muestra un mensaje de éxito
    expect(mockedToast.success).toHaveBeenCalledWith(
      "Producto localizado en Bogotá-1, zona Z4-2"
    );

    // And: Se llamó al servicio con los parámetros correctos
    expect(mockedGetProductLocation).toHaveBeenCalledWith({
      sku: "MED-12345",
    });
  }, 20000);

  it("HUP-009: muestra mensaje cuando el producto no se encuentra en ninguna bodega", async () => {
    const user = userEvent.setup();

    // Given: Un operador logístico quiere consultar un producto que no está en bodega
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

    const locationResult = {
      sku: "MED-99999",
      bodega: "",
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

    mockedGetProductLocation.mockResolvedValue(locationResult);

    renderForm();

    // When: El operador selecciona el producto y presiona "Consultar"
    const combobox = screen.getByRole("combobox");
    await user.click(combobox);

    const option = await screen.findByText("MED-99999 - Producto Agotado");
    await user.click(option);

    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    await user.click(consultarButton);

    // Then: Se muestra el mensaje "Producto no localizado en ninguna bodega"
    await waitFor(() =>
      expect(
        screen.getByText("Producto no localizado en ninguna bodega")
      ).toBeInTheDocument()
    );

    // And: Se muestra un toast de advertencia
    expect(mockedToast.warning).toHaveBeenCalledWith(
      "Producto no localizado en ninguna bodega"
    );
  }, 20000);

  it("HUP-009: no permite presionar Consultar si no se ha seleccionado producto", async () => {
    // Given: Un operador logístico abre el formulario de consulta
    mockedGetProductos.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1000,
      totalPages: 0,
    });

    renderForm();

    // When: No se ha seleccionado ningún producto
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    // Then: El botón "Consultar" está deshabilitado
    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    expect(consultarButton).toBeDisabled();

    // And: No se puede hacer clic en él
    await userEvent.click(consultarButton);
    expect(mockedGetProductLocation).not.toHaveBeenCalled();
  }, 20000);

  it("HUP-009: flujo completo - consultar múltiples productos en una sesión", async () => {
    const user = userEvent.setup();

    // Given: Un operador logístico necesita consultar varios productos
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
      {
        id: "3",
        sku: "MED-003",
        nombre: "Producto C",
        descripcion: faker.commerce.productDescription(),
        precio: 30000,
        activo: true,
      },
    ];

    mockedGetProductos.mockResolvedValue({
      data: productos,
      total: 3,
      page: 1,
      limit: 1000,
      totalPages: 1,
    });

    // Primera consulta - producto encontrado
    mockedGetProductLocation.mockResolvedValueOnce({
      sku: "MED-001",
      bodega: "Bogotá-1",
      zona: "Z1-1",
      encontrado: true,
    });

    renderForm();

    // When: Consulta el primer producto
    let combobox = screen.getByRole("combobox");
    await user.click(combobox);
    let option = await screen.findByText("MED-001 - Producto A");
    await user.click(option);

    let consultarButton = screen.getByRole("button", { name: /consultar/i });
    await user.click(consultarButton);

    // Then: Ve la ubicación del primer producto
    await waitFor(() =>
      expect(screen.getByText("Bogotá-1")).toBeInTheDocument()
    );
    expect(screen.getByText("Z1-1")).toBeInTheDocument();

    // When: Consulta el segundo producto (no encontrado)
    mockedGetProductLocation.mockResolvedValueOnce({
      sku: "MED-002",
      bodega: "",
      zona: "",
      encontrado: false,
    });

    combobox = screen.getByRole("combobox");
    await user.click(combobox);
    option = await screen.findByText("MED-002 - Producto B");
    await user.click(option);

    consultarButton = screen.getByRole("button", { name: /consultar/i });
    await user.click(consultarButton);

    // Then: Ve que el producto no fue encontrado
    await waitFor(() =>
      expect(
        screen.getByText("Producto no localizado en ninguna bodega")
      ).toBeInTheDocument()
    );

    // When: Consulta el tercer producto (encontrado en otra bodega)
    mockedGetProductLocation.mockResolvedValueOnce({
      sku: "MED-003",
      bodega: "Medellín-1",
      zona: "Z5-8",
      encontrado: true,
    });

    combobox = screen.getByRole("combobox");
    await user.click(combobox);
    option = await screen.findByText("MED-003 - Producto C");
    await user.click(option);

    consultarButton = screen.getByRole("button", { name: /consultar/i });
    await user.click(consultarButton);

    // Then: Ve la ubicación del tercer producto
    await waitFor(() =>
      expect(screen.getByText("Medellín-1")).toBeInTheDocument()
    );
    expect(screen.getByText("Z5-8")).toBeInTheDocument();

    // And: Todas las consultas se realizaron correctamente
    expect(mockedGetProductLocation).toHaveBeenCalledTimes(3);
  }, 30000);

  it("HUP-009: permite optimizar la preparación de pedidos mostrando ubicación exacta", async () => {
    const user = userEvent.setup();

    // Given: Un operador logístico necesita preparar un pedido
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

    // Sistema retorna ubicación exacta con bodega y zona
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

    mockedGetProductLocation.mockResolvedValue(locationResult);

    renderForm();

    // When: Consulta el producto
    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    const option = await screen.findByText("MED-URGENT - Producto Urgente");
    await user.click(option);

    const consultarButton = screen.getByRole("button", { name: /consultar/i });
    await user.click(consultarButton);

    // Then: El sistema muestra la bodega exacta
    await waitFor(() => expect(screen.getByText("Cali-1")).toBeInTheDocument());

    // And: Muestra la zona específica dentro de la bodega
    expect(screen.getByText("Z3-7")).toBeInTheDocument();

    // And: Muestra un indicador visual de que el producto fue encontrado
    const successIndicator = screen.getByText(
      "Su producto se encuentra en la bodega:"
    );
    expect(successIndicator).toBeInTheDocument();

    // And: La información es clara y precisa para optimizar la preparación
    expect(mockedGetProductLocation).toHaveBeenCalledWith({
      sku: "MED-URGENT",
    });

    expect(mockedToast.success).toHaveBeenCalledWith(
      "Producto localizado en Cali-1, zona Z3-7"
    );
  }, 20000);
});
