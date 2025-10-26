import { faker } from "@faker-js/faker";
import { screen, waitFor } from "@testing-library/react";
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

describe("CreateProveedorForm - Unit", () => {
  const mockCreateProveedor = vi.mocked(createProveedor);
  let requiredFields: {
    nombre: string;
    idTax: string;
    direccion: string;
    telefono: string;
    contacto: string;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(1);
    requiredFields = {
      nombre: faker.company.name(),
      idTax: faker.string.alphanumeric(10),
      direccion: faker.location.streetAddress(),
      telefono: faker.string.numeric(10),
      contacto: faker.person.fullName(),
    };
  });

  const renderForm = () => {
    const utils = renderWithQueryClient(
      <CreateProveedorForm open={true} onOpenChange={vi.fn()} />
    );
    utils.container.querySelector("form")?.setAttribute("novalidate", "true");
    return utils;
  };

  it("valida que los campos obligatorios sean requeridos", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(async () => {
      expect(screen.getByText("El nombre es requerido")).toBeInTheDocument();
      expect(screen.getByText("El Tax ID es requerido")).toBeInTheDocument();
      expect(screen.getByText("La dirección es requerida")).toBeInTheDocument();
      expect(screen.getByText("El teléfono es requerido")).toBeInTheDocument();
      expect(screen.getByText("El contacto es requerido")).toBeInTheDocument();
      expect(
        await screen.findByText(/correo electrónico válido/i)
      ).toBeInTheDocument();
    });
    expect(mockCreateProveedor).not.toHaveBeenCalled();
  });

  it("rechaza correos con formato inválido", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText("Nombre"), requiredFields.nombre);
    await user.type(screen.getByPlaceholderText("Id tax"), requiredFields.idTax);
    await user.type(
      screen.getByPlaceholderText("Dirección"),
      requiredFields.direccion
    );
    await user.type(
      screen.getByPlaceholderText("Teléfono"),
      requiredFields.telefono
    );
    await user.type(
      screen.getByPlaceholderText("Correo"),
      faker.lorem.word()
    );
    await user.type(screen.getByPlaceholderText("Contacto"), requiredFields.contacto);

    await user.click(screen.getByRole("button", { name: /crear/i }));

    expect(mockCreateProveedor).not.toHaveBeenCalled();
  });
});
