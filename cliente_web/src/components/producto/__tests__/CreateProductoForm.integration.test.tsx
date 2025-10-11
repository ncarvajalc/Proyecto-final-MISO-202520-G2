import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/productos.service", () => ({
  createProducto: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { CreateProductoForm } from "@/components/producto/CreateProductoForm";
import { createProducto } from "@/services/productos.service";
import { toast } from "sonner";

const mockedCreateProducto = vi.mocked(createProducto);
const mockedToast = vi.mocked(toast);

const setup = () => {
  const queryClient = new QueryClient();
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <CreateProductoForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  const formElement = utils.container.querySelector("form");
  formElement?.setAttribute("novalidate", "true");
  return { onOpenChange, ...utils };
};

describe("CreateProductoForm - Integration", () => {
  beforeEach(() => {
    mockedCreateProducto.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
  });

  it("envía los campos mínimos y reinicia el formulario tras éxito", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = setup();

    mockedCreateProducto.mockResolvedValue({ id: "123" });

    await user.type(screen.getByPlaceholderText("MED-001"), "MED-321");
    await user.type(
      screen.getByPlaceholderText("Nombre del producto"),
      "Producto Integración"
    );
    await user.type(
      screen.getByPlaceholderText("Descripción del producto"),
      "Descripción integración"
    );
    await user.clear(screen.getByPlaceholderText("5000"));
    await user.type(screen.getByPlaceholderText("5000"), "12345");

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreateProducto).toHaveBeenCalledTimes(1));
    const [payload] = mockedCreateProducto.mock.calls[0];
    expect(payload).toEqual({
      sku: "MED-321",
      nombre: "Producto Integración",
      descripcion: "Descripción integración",
      precio: 12345,
      activo: true,
    });

    await waitFor(() => expect(mockedToast.success).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Nombre del producto")).toHaveValue("")
    );
  });
});
