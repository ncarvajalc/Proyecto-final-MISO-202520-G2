import { faker } from "@faker-js/faker";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { CreateProveedorForm } from "@/components/proveedor/CreateProveedorForm";
import { createProveedor } from "@/services/proveedores.service";
import { toast } from "sonner";

import { renderWithQueryClient } from "../../../../tests/test-utils";

vi.mock("@/services/proveedores.service", () => ({
  createProveedor: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCreateProveedor = vi.mocked(createProveedor);
const mockToast = vi.mocked(toast);

type ProveedorFormValues = {
  nombre: string;
  idTax: string;
  direccion: string;
  telefono: string;
  correo: string;
  contacto: string;
  certificadoNombre?: string;
  certificadoCuerpo?: string;
  certificadoFecha?: string;
  certificadoVencimiento?: string;
  certificadoUrl?: string;
};

const buildProveedorValues = (options: { includeCertificado?: boolean } = {}) => {
  const base: ProveedorFormValues = {
    nombre: faker.company.name(),
    idTax: faker.string.alphanumeric(10),
    direccion: faker.location.streetAddress(),
    telefono: faker.string.numeric(10),
    correo: faker.internet.email(),
    contacto: faker.person.fullName(),
  };

  if (!options.includeCertificado) {
    return base;
  }

  return {
    ...base,
    certificadoNombre: faker.lorem.word(),
    certificadoCuerpo: faker.company.name(),
    certificadoFecha: faker.date.past().toISOString().slice(0, 10),
    certificadoVencimiento: faker.date.future().toISOString().slice(0, 10),
    certificadoUrl: faker.internet.url(),
  };
};

const fillProveedorForm = async (
  user: ReturnType<typeof userEvent.setup>,
  values: ProveedorFormValues
) => {
  await user.type(screen.getByPlaceholderText("Nombre"), values.nombre);
  await user.type(screen.getByPlaceholderText("Id tax"), values.idTax);
  await user.type(screen.getByPlaceholderText("Dirección"), values.direccion);
  await user.type(screen.getByPlaceholderText("Teléfono"), values.telefono);
  await user.type(screen.getByPlaceholderText("Correo"), values.correo);
  await user.type(screen.getByPlaceholderText("Contacto"), values.contacto);

  if (values.certificadoNombre) {
    await user.type(
      screen.getByPlaceholderText("Nombre certificado"),
      values.certificadoNombre
    );
  }
  if (values.certificadoCuerpo) {
    await user.type(
      screen.getByPlaceholderText("Cuerpo certificador"),
      values.certificadoCuerpo
    );
  }
  if (values.certificadoFecha) {
    await user.type(
      screen.getByLabelText("Fecha de certificación"),
      values.certificadoFecha
    );
  }
  if (values.certificadoVencimiento) {
    await user.type(
      screen.getByLabelText("Fecha de vencimiento"),
      values.certificadoVencimiento
    );
  }
  if (values.certificadoUrl) {
    await user.type(
      screen.getByPlaceholderText("https://ejemplo.com/certificado.pdf"),
      values.certificadoUrl
    );
  }
};

const submitForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /crear/i }));
};

const resetProveedorMocks = (seed: number) => {
  vi.clearAllMocks();
  faker.seed(seed);
};

export const runCreateProveedorIntegrationSuite = () => {
  beforeEach(() => {
    resetProveedorMocks(3);
    mockCreateProveedor.mockResolvedValue({ id: "1" } as never);
  });

  it("transforma los datos antes de llamar al servicio", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const values = buildProveedorValues({ includeCertificado: true });

    const utils = renderWithQueryClient(
      <CreateProveedorForm open={true} onOpenChange={onOpenChange} />
    );
    utils.container.querySelector("form")?.setAttribute("novalidate", "true");

    await fillProveedorForm(user, values);
    await submitForm(user);

    await waitFor(() => expect(mockCreateProveedor).toHaveBeenCalledTimes(1));
    const firstCall = mockCreateProveedor.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(firstCall).toMatchObject({
      nombre: values.nombre,
      id_tax: values.idTax,
      direccion: values.direccion,
      telefono: values.telefono,
      correo: values.correo,
      contacto: values.contacto,
      certificado: {
        nombre: values.certificadoNombre,
        cuerpoCertificador: values.certificadoCuerpo,
        fechaCertificacion: values.certificadoFecha,
        fechaVencimiento: values.certificadoVencimiento,
        urlDocumento: values.certificadoUrl,
      },
    });
  });
};

export const runCreateProveedorAcceptanceSuite = () => {
  beforeEach(() => {
    resetProveedorMocks(4);
    mockCreateProveedor.mockResolvedValue({ id: "1" } as never);
    mockToast.success.mockReset();
  });

  it("permite crear un proveedor y cerrar el modal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const values = buildProveedorValues();

    renderWithQueryClient(
      <CreateProveedorForm open={true} onOpenChange={onOpenChange} />
    );

    await fillProveedorForm(user, values);
    await submitForm(user);

    await waitFor(() => expect(mockCreateProveedor).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
};
