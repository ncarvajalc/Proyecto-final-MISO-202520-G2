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

const setup = () => {
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

describe("CreateProveedorForm - Integration", () => {
  beforeEach(() => {
    mockedCreateProveedor.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
  });

  it("envía la información normalizada y resetea el formulario tras éxito", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = setup();

    mockedCreateProveedor.mockResolvedValue({ id: 1 });

    await user.type(screen.getByPlaceholderText("Nombre"), "Proveedor QA");
    await user.type(screen.getByPlaceholderText("Id tax"), "987654");
    await user.type(screen.getByPlaceholderText("Dirección"), "Calle 99");
    await user.type(screen.getByPlaceholderText("Teléfono"), "3200000");
    await user.type(screen.getByPlaceholderText("Correo"), "qa@test.com");
    await user.type(screen.getByPlaceholderText("Contacto"), "Lina QA");

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreateProveedor).toHaveBeenCalledTimes(1));
    const [payload] = mockedCreateProveedor.mock.calls[0];
    expect(payload).toEqual({
      nombre: "Proveedor QA",
      id_tax: "987654",
      direccion: "Calle 99",
      telefono: "3200000",
      correo: "qa@test.com",
      contacto: "Lina QA",
      estado: "Activo",
      certificado: null,
    });

    await waitFor(() => expect(mockedToast.success).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Nombre")).toHaveValue("")
    );
  });
});
