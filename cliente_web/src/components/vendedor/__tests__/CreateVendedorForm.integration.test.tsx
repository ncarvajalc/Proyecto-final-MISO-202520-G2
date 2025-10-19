import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

vi.mock("@/services/vendedores.service", () => ({
  createVendedor: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { CreateVendedorForm } from "@/components/vendedor/CreateVendedorForm";
import { createVendedor } from "@/services/vendedores.service";
import { toast } from "sonner";

const mockedCreateVendedor = vi.mocked(createVendedor);
const mockedToast = vi.mocked(toast);

const setup = () => {
  const queryClient = new QueryClient();
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <CreateVendedorForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  utils.container.querySelector("form")?.setAttribute("novalidate", "true");
  return { onOpenChange, ...utils };
};

describe("CreateVendedorForm - Integration", () => {
  beforeEach(() => {
    mockedCreateVendedor.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    faker.seed(953);
  });

  it("envía la información correcta y resetea el formulario tras éxito", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = setup();

    const vendedorCreado = {
      id: faker.string.uuid(),
      nombre: faker.person.fullName(),
      correo: faker.internet.email(),
      fechaContratacion: faker.date.past().toISOString().split("T")[0],
      planDeVenta: null,
    };

    mockedCreateVendedor.mockResolvedValue(vendedorCreado);

    await user.type(
      screen.getByPlaceholderText("Nombre del vendedor"),
      vendedorCreado.nombre
    );
    await user.type(screen.getByPlaceholderText("Email"), vendedorCreado.correo);

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreateVendedor).toHaveBeenCalledTimes(1));
    expect(mockedCreateVendedor).toHaveBeenCalledWith(
      {
        nombre: vendedorCreado.nombre,
        correo: vendedorCreado.correo,
      },
      expect.anything()
    );

    await waitFor(() =>
      expect(mockedToast.success).toHaveBeenCalledWith(
        "Vendedor creado exitosamente",
        expect.objectContaining({
          description: "El vendedor ha sido registrado en el sistema.",
        })
      )
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Nombre del vendedor")).toHaveValue("")
    );
  });
});
