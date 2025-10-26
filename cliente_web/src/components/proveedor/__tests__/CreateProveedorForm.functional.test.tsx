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
import { toast } from "sonner";

import { renderWithQueryClient } from "../../../../tests/test-utils";

describe("CreateProveedorForm - Functional", () => {
  const mockCreateProveedor = vi.mocked(createProveedor);
  const mockToast = vi.mocked(toast);
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
    faker.seed(2);
    formValues = {
      nombre: faker.company.name(),
      idTax: faker.string.alphanumeric(10),
      direccion: faker.location.streetAddress(),
      telefono: faker.string.numeric(10),
      correo: faker.internet.email(),
      contacto: faker.person.fullName(),
    };
  });

  const renderForm = (onOpenChange = vi.fn()) => {
    const utils = renderWithQueryClient(
      <CreateProveedorForm open={true} onOpenChange={onOpenChange} />
    );
    utils.container.querySelector("form")?.setAttribute("novalidate", "true");
    return { onOpenChange, ...utils };
  };

  const fillRequiredFields = async () => {
    const user = userEvent.setup();
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
    return user;
  };

  it("envía el formulario y muestra una notificación de éxito", async () => {
    mockCreateProveedor.mockResolvedValue({ id: "1" } as never);
    const { onOpenChange } = renderForm(vi.fn());

    const user = await fillRequiredFields();
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(mockCreateProveedor).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith(
        "Proveedor creado exitosamente"
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("muestra un error cuando la creación falla", async () => {
    mockCreateProveedor.mockRejectedValue(new Error("boom"));

    renderForm();

    const user = await fillRequiredFields();
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Error al crear proveedor",
        expect.any(Object)
      );
    });
  });
});
