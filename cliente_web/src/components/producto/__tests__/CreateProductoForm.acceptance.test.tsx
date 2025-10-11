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

describe("CreateProductoForm - Acceptance", () => {
  beforeEach(() => {
    mockedCreateProducto.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
  });

  it("permite registrar un producto con especificaciones y hoja técnica completa", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderForm();

    mockedCreateProducto.mockResolvedValue({ id: "777" });

    await user.type(screen.getByPlaceholderText("MED-001"), "MED-432");
    await user.type(
      screen.getByPlaceholderText("Nombre del producto"),
      "Producto Acceptance"
    );
    await user.type(
      screen.getByPlaceholderText("Descripción del producto"),
      "Descripción completa"
    );
    await user.clear(screen.getByPlaceholderText("5000"));
    await user.type(screen.getByPlaceholderText("5000"), "22222");

    await user.click(screen.getByRole("button", { name: /agregar/i }));
    const [nombreEspecificacion] = screen.getAllByPlaceholderText("Nombre");
    const [valorEspecificacion] = screen.getAllByPlaceholderText("Valor");
    await user.type(nombreEspecificacion, "Presentación");
    await user.type(valorEspecificacion, "Caja x 50");

    await user.type(
      screen.getByPlaceholderText("https://ejemplo.com/manual.pdf"),
      "https://example.com/manual.pdf"
    );
    await user.type(
      screen.getByPlaceholderText("https://ejemplo.com/instalacion.pdf"),
      "https://example.com/instalacion.pdf"
    );

    const certPlaceholder = screen.getByText("Selecciona certificaciones");
    const certTrigger = certPlaceholder.closest("button");
    expect(certTrigger).not.toBeNull();
    await user.click(certTrigger!);
    const invimaOptions = await screen.findAllByText("INVIMA");
    await user.click(invimaOptions[0]!);

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreateProducto).toHaveBeenCalledTimes(1));
    const [payload] = mockedCreateProducto.mock.calls[0];
    expect(payload).toEqual({
      sku: "MED-432",
      nombre: "Producto Acceptance",
      descripcion: "Descripción completa",
      precio: 22222,
      activo: true,
      especificaciones: [{ nombre: "Presentación", valor: "Caja x 50" }],
      hojaTecnica: {
        urlManual: "https://example.com/manual.pdf",
        urlHojaInstalacion: "https://example.com/instalacion.pdf",
        certificaciones: ["INVIMA"],
      },
    });

    await waitFor(() => expect(mockedToast.success).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
