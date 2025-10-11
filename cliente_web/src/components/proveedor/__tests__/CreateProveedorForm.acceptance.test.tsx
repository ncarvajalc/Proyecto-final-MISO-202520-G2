import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/proveedores.service", () => ({
  createProveedor: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { CreateProveedorForm } from "@/components/proveedor/CreateProveedorForm";
import { createProveedor } from "@/services/proveedores.service";
import { toast } from "sonner";

const mockedCreateProveedor = vi.mocked(createProveedor);
const mockedToast = vi.mocked(toast);

const renderForm = () => {
  const queryClient = new QueryClient();
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <CreateProveedorForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  const formElement = utils.container.querySelector("form");
  formElement?.setAttribute("novalidate", "true");
  return { onOpenChange, ...utils };
};

describe("CreateProveedorForm - Acceptance", () => {
  beforeEach(() => {
    mockedCreateProveedor.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
  });

  it("permite registrar un proveedor con certificado y estado personalizado", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderForm();

    mockedCreateProveedor.mockResolvedValue({ id: 42 });

    await user.type(screen.getByPlaceholderText("Nombre"), "Proveedor Integral");
    await user.type(screen.getByPlaceholderText("Id tax"), "123456789");
    await user.type(screen.getByPlaceholderText("Dirección"), "Av 123");
    await user.type(screen.getByPlaceholderText("Teléfono"), "3001234567");
    await user.type(screen.getByPlaceholderText("Correo"), "integral@test.com");
    await user.type(screen.getByPlaceholderText("Contacto"), "Carlos Integral");

    const estadoTrigger = screen.getByRole("combobox", { name: /Estado/i });
    await user.click(estadoTrigger);
    const inactivoOption = await screen.findByRole("option", { name: /Inactivo/i });
    await user.click(inactivoOption);

    await user.type(
      screen.getByPlaceholderText("Nombre certificado"),
      "Certificado Calidad"
    );
    await user.type(
      screen.getByPlaceholderText("Cuerpo certificador"),
      "Entidad Global"
    );
    await user.type(
      screen.getByLabelText(/Fecha de certificación/i),
      "2025-01-01"
    );
    await user.type(
      screen.getByLabelText(/Fecha de vencimiento/i),
      "2026-01-01"
    );
    await user.type(
      screen.getByPlaceholderText("https://ejemplo.com/certificado.pdf"),
      "https://example.com/certificado.pdf"
    );

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreateProveedor).toHaveBeenCalledTimes(1));
    const [payload] = mockedCreateProveedor.mock.calls[0];
    expect(payload).toEqual({
      nombre: "Proveedor Integral",
      id_tax: "123456789",
      direccion: "Av 123",
      telefono: "3001234567",
      correo: "integral@test.com",
      contacto: "Carlos Integral",
      estado: "Inactivo",
      certificado: {
        nombre: "Certificado Calidad",
        cuerpoCertificador: "Entidad Global",
        fechaCertificacion: "2025-01-01",
        fechaVencimiento: "2026-01-01",
        urlDocumento: "https://example.com/certificado.pdf",
      },
    });

    await waitFor(() => expect(mockedToast.success).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
