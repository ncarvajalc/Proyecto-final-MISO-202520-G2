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
    faker.seed(804);
  });

  it(
    "permite registrar un proveedor con certificado y estado personalizado",
    async () => {
      const user = userEvent.setup({ delay: 0 });
      const { onOpenChange } = renderForm();

      mockedCreateProveedor.mockResolvedValue({
        id: faker.number.int({ min: 1, max: 1000 }),
      });

      const estadoSeleccionado = faker.helpers.arrayElement([
        "Activo",
        "Inactivo",
      ]) as "Activo" | "Inactivo";
      const fechaCertificacionDate = faker.date.future({ years: 1 });
      const fechaVencimientoDate = faker.date.future({
        years: 2,
        refDate: fechaCertificacionDate,
      });
      const certificado = {
        nombre: faker.company.buzzPhrase(),
        cuerpoCertificador: faker.company.name(),
        fechaCertificacion: fechaCertificacionDate.toISOString().split("T")[0],
        fechaVencimiento: fechaVencimientoDate.toISOString().split("T")[0],
        urlDocumento: faker.internet.url(),
      };
      const proveedor = {
        nombre: faker.company.name(),
        id_tax: faker.string.numeric({ length: 9 }),
        direccion: faker.location.streetAddress(),
        telefono: faker.phone.number(),
        correo: faker.internet.email(),
        contacto: faker.person.fullName(),
      };

      await user.type(screen.getByPlaceholderText("Nombre"), proveedor.nombre);
      await user.type(screen.getByPlaceholderText("Id tax"), proveedor.id_tax);
      await user.type(
        screen.getByPlaceholderText("Dirección"),
        proveedor.direccion
      );
      await user.type(screen.getByPlaceholderText("Teléfono"), proveedor.telefono);
      await user.type(screen.getByPlaceholderText("Correo"), proveedor.correo);
      await user.type(screen.getByPlaceholderText("Contacto"), proveedor.contacto);

      const estadoTrigger = screen.getByRole("combobox", { name: /Estado/i });
      await user.click(estadoTrigger);
      const option = await screen.findByRole("option", { name: estadoSeleccionado });
      await user.click(option);

      await user.type(
        screen.getByPlaceholderText("Nombre certificado"),
        certificado.nombre
      );
      await user.type(
        screen.getByPlaceholderText("Cuerpo certificador"),
        certificado.cuerpoCertificador
      );
      await user.type(
        screen.getByLabelText(/Fecha de certificación/i),
        certificado.fechaCertificacion
      );
      await user.type(
        screen.getByLabelText(/Fecha de vencimiento/i),
        certificado.fechaVencimiento
      );
      await user.type(
        screen.getByPlaceholderText("https://ejemplo.com/certificado.pdf"),
        certificado.urlDocumento
      );

      await user.click(screen.getByRole("button", { name: /crear/i }));

      await waitFor(() => expect(mockedCreateProveedor).toHaveBeenCalledTimes(1));
      const [payload] = mockedCreateProveedor.mock.calls[0];
      expect(payload).toEqual({
        ...proveedor,
        estado: estadoSeleccionado,
        certificado,
      });

      await waitFor(() => expect(mockedToast.success).toHaveBeenCalled());
      expect(onOpenChange).toHaveBeenCalledWith(false);
    },
    10000
  );
});
