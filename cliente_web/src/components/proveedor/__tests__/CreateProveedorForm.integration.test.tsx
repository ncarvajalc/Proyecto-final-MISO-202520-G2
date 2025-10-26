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

describe("CreateProveedorForm - Integration", () => {
  const mockCreateProveedor = vi.mocked(createProveedor);
  let formValues: {
    nombre: string;
    idTax: string;
    direccion: string;
    telefono: string;
    correo: string;
    contacto: string;
    certificadoNombre: string;
    certificadoCuerpo: string;
    certificadoFecha: string;
    certificadoVencimiento: string;
    certificadoUrl: string;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateProveedor.mockResolvedValue({ id: "1" } as never);
    faker.seed(3);
    const certificationDate = faker.date.past().toISOString().slice(0, 10);
    const expirationDate = faker.date.future().toISOString().slice(0, 10);
    formValues = {
      nombre: faker.company.name(),
      idTax: faker.string.alphanumeric(10),
      direccion: faker.location.streetAddress(),
      telefono: faker.string.numeric(10),
      correo: faker.internet.email(),
      contacto: faker.person.fullName(),
      certificadoNombre: faker.lorem.word(),
      certificadoCuerpo: faker.company.name(),
      certificadoFecha: certificationDate,
      certificadoVencimiento: expirationDate,
      certificadoUrl: faker.internet.url(),
    };
  });

  it("transforma los datos antes de llamar al servicio", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    const utils = renderWithQueryClient(
      <CreateProveedorForm open={true} onOpenChange={onOpenChange} />
    );
    utils.container.querySelector("form")?.setAttribute("novalidate", "true");

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
    await user.type(
      screen.getByPlaceholderText("Nombre certificado"),
      formValues.certificadoNombre
    );
    await user.type(
      screen.getByPlaceholderText("Cuerpo certificador"),
      formValues.certificadoCuerpo
    );
    await user.type(
      screen.getByLabelText("Fecha de certificación"),
      formValues.certificadoFecha
    );
    await user.type(
      screen.getByLabelText("Fecha de vencimiento"),
      formValues.certificadoVencimiento
    );
    await user.type(
      screen.getByPlaceholderText("https://ejemplo.com/certificado.pdf"),
      formValues.certificadoUrl
    );

    await user.click(screen.getByRole("button", { name: /crear/i }));

    const firstCall = mockCreateProveedor.mock.calls[0][0];
    expect(firstCall).toMatchObject({
      nombre: formValues.nombre,
      id_tax: formValues.idTax,
      direccion: formValues.direccion,
      telefono: formValues.telefono,
      contacto: formValues.contacto,
      certificado: {
        nombre: formValues.certificadoNombre,
        cuerpoCertificador: formValues.certificadoCuerpo,
        fechaCertificacion: formValues.certificadoFecha,
        fechaVencimiento: formValues.certificadoVencimiento,
        urlDocumento: formValues.certificadoUrl,
      },
    });
  });
});
