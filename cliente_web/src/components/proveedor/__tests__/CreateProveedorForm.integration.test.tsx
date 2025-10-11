import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

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
    faker.seed(803);
  });

  it("envía la información normalizada y resetea el formulario tras éxito", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = setup();

    const payload = {
      nombre: faker.company.name(),
      id_tax: faker.string.alphanumeric({ length: 10 }),
      direccion: faker.location.streetAddress(),
      telefono: faker.phone.number(),
      correo: faker.internet.email(),
      contacto: faker.person.fullName(),
      estado: "Activo" as const,
      certificado: null,
    };

    mockedCreateProveedor.mockResolvedValue({
      id: faker.number.int({ min: 1, max: 999 }),
    });

    await user.type(screen.getByPlaceholderText("Nombre"), payload.nombre);
    await user.type(screen.getByPlaceholderText("Id tax"), payload.id_tax);
    await user.type(screen.getByPlaceholderText("Dirección"), payload.direccion);
    await user.type(screen.getByPlaceholderText("Teléfono"), payload.telefono);
    await user.type(screen.getByPlaceholderText("Correo"), payload.correo);
    await user.type(screen.getByPlaceholderText("Contacto"), payload.contacto);

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreateProveedor).toHaveBeenCalledTimes(1));
    const [payloadLlamado] = mockedCreateProveedor.mock.calls[0];
    expect(payloadLlamado).toEqual(payload);

    await waitFor(() => expect(mockedToast.success).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Nombre")).toHaveValue("")
    );
  });
});
