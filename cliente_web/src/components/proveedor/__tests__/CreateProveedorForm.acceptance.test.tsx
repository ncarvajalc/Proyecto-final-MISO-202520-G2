import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
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

import { renderWithQueryClient } from "../../../../tests/test-utils";

describe("CreateProveedorForm - Acceptance", () => {
  const mockCreateProveedor = vi.mocked(createProveedor);
  let formValues: {
    nombre: string;
    idTax: string;
    direccion: string;
    telefono: string;
    correo: string;
    contacto: string;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateProveedor.mockResolvedValue({ id: "1" } as never);
    faker.seed(4);
    formValues = {
      nombre: faker.company.name(),
      idTax: faker.string.alphanumeric(10),
      direccion: faker.location.streetAddress(),
      telefono: faker.string.numeric(10),
      correo: faker.internet.email(),
      contacto: faker.person.fullName(),
    };
  });

  it("permite crear un proveedor y cerrar el modal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithQueryClient(
      <CreateProveedorForm open={true} onOpenChange={onOpenChange} />
    );

    await user.type(screen.getByPlaceholderText("Nombre"), formValues.nombre);
    await user.type(screen.getByPlaceholderText("Id tax"), formValues.idTax);
    await user.type(
      screen.getByPlaceholderText("Dirección"),
      formValues.direccion
    );
    await user.type(
      screen.getByPlaceholderText("Teléfono"),
      formValues.telefono
    );
    await user.type(screen.getByPlaceholderText("Correo"), formValues.correo);
    await user.type(screen.getByPlaceholderText("Contacto"), formValues.contacto);

    await user.click(screen.getByRole("button", { name: /crear/i }));

    expect(mockCreateProveedor).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
