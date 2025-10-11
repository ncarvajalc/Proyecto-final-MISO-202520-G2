import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateProductoForm } from "@/components/producto/CreateProductoForm";
import { createProducto } from "@/services/productos.service";

const mockedCreateProducto = vi.mocked(createProducto);

vi.mock("@/services/productos.service", () => ({
  createProducto: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderForm = () => {
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

describe("CreateProductoForm - Unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra errores cuando los campos requeridos están vacíos", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /crear/i }));

    expect(
      await screen.findByText("El SKU es requerido")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("El nombre es requerido")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("La descripción es requerida")
    ).toBeInTheDocument();
  });

  it("evita el envío cuando el precio no es válido", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText("MED-001"), "MED-777");
    await user.type(screen.getByPlaceholderText("Nombre del producto"), "Producto QA");
    await user.type(
      screen.getByPlaceholderText("Descripción del producto"),
      "Descripción de QA"
    );
    await user.clear(screen.getByPlaceholderText("5000"));
    await user.type(screen.getByPlaceholderText("5000"), "0");

    await user.click(screen.getByRole("button", { name: /crear/i }));

    expect(
      await screen.findByText("El precio debe ser mayor a 0")
    ).toBeInTheDocument();
    expect(mockedCreateProducto).not.toHaveBeenCalled();
  });
});
