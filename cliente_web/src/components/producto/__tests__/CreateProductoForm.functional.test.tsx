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

describe("CreateProductoForm - Functional", () => {
  beforeEach(() => {
    mockedCreateProducto.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
  });

  it("muestra un mensaje de error cuando la creación falla", async () => {
    const user = userEvent.setup();
    setup();

    mockedCreateProducto.mockRejectedValue(new Error("Error inesperado"));

    await user.type(screen.getByPlaceholderText("MED-001"), "MED-654");
    await user.type(
      screen.getByPlaceholderText("Nombre del producto"),
      "Producto Funcional"
    );
    await user.type(
      screen.getByPlaceholderText("Descripción del producto"),
      "Descripción funcional"
    );
    await user.clear(screen.getByPlaceholderText("5000"));
    await user.type(screen.getByPlaceholderText("5000"), "54321");

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreateProducto).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Error al crear producto", {
        description: "Error inesperado",
      })
    );
  });
});
