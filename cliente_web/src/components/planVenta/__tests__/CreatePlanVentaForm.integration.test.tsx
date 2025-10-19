import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

vi.mock("@/services/planesVenta.service", () => ({
  createPlanVenta: vi.fn(),
}));

vi.mock("@/services/vendedores.service", () => ({
  getVendedores: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { CreatePlanVentaForm } from "@/components/planVenta/CreatePlanVentaForm";
import { createPlanVenta } from "@/services/planesVenta.service";
import { getVendedores } from "@/services/vendedores.service";
import { toast } from "sonner";

const mockedCreatePlanVenta = vi.mocked(createPlanVenta);
const mockedToast = vi.mocked(toast);
const mockedGetVendedores = vi.mocked(getVendedores);

const buildVendedoresResponse = () => {
  const vendedor = {
    id: faker.string.uuid(),
    nombre: faker.person.fullName(),
    correo: faker.internet.email(),
    fechaContratacion: faker.date.past().toISOString().split("T")[0],
    planDeVenta: null,
  };
  return {
    data: [vendedor],
    total: 1,
    page: 1,
    limit: 100,
    totalPages: 1,
  };
};

const setup = () => {
  const queryClient = new QueryClient();
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <CreatePlanVentaForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  utils.container.querySelector("form")?.setAttribute("novalidate", "true");
  return { onOpenChange, ...utils };
};

const selectVendedor = async (
  user: ReturnType<typeof userEvent.setup>,
  nombre: string
) => {
  const trigger = screen.getByRole("combobox", { name: /vendedor/i });
  await user.click(trigger);
  const option = await screen.findByText(nombre, { selector: "*" });
  await user.click(option);
  await waitFor(() => expect(trigger).toHaveTextContent(nombre));
};

describe("CreatePlanVentaForm - Integration", () => {
  beforeEach(() => {
    mockedCreatePlanVenta.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    mockedGetVendedores.mockReset();
    faker.seed(703);
    mockedGetVendedores.mockResolvedValue(buildVendedoresResponse());
  });

  it("envía la información y resetea el formulario tras éxito", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = setup();

    const vendedorResponse = await mockedGetVendedores.mock.results[0]!.value;
    const vendedor = vendedorResponse.data[0];
    const identificador = faker.string.alphanumeric({ length: 8 }).toUpperCase();
    const nombrePlan = faker.company.buzzPhrase();
    const periodo = `${faker.date.future({ years: 1 }).getFullYear()}-Q${faker.number.int({ min: 1, max: 4 })}`;
    const descripcion = faker.lorem.sentence();
    const meta = faker.number.int({ min: 100, max: 500 });

    mockedCreatePlanVenta.mockResolvedValue({
      id: faker.string.uuid(),
      identificador,
      nombre: nombrePlan,
      descripcion,
      periodo,
      meta,
      vendedorId: vendedor.id,
      vendedorNombre: vendedor.nombre,
      unidadesVendidas: faker.number.int({ min: 0, max: 20 }),
    });

    await user.type(screen.getByPlaceholderText("Identificador del plan"), identificador);
    await user.type(screen.getByPlaceholderText("Plan Ventas Q1 2025"), nombrePlan);
    await user.type(
      screen.getByPlaceholderText("ej. 01/01/2025 - 31/03/2025"),
      periodo
    );
    await user.type(
      screen.getByPlaceholderText("Se espera que...."),
      descripcion
    );
    await waitFor(() => expect(mockedGetVendedores).toHaveBeenCalled());
    await selectVendedor(user, vendedor.nombre);
    await user.type(
      screen.getByPlaceholderText("Cuota en monto ($)"),
      String(meta)
    );

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreatePlanVenta).toHaveBeenCalledTimes(1));
    expect(mockedCreatePlanVenta).toHaveBeenCalledWith({
      identificador,
      nombre: nombrePlan,
      descripcion,
      periodo,
      meta,
      vendedorId: vendedor.id,
    });

    await waitFor(() =>
      expect(mockedToast.success).toHaveBeenCalledWith(
        "Plan de venta creado exitosamente",
        expect.objectContaining({
          description: "El plan de venta ha sido registrado en el sistema.",
        })
      )
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Identificador del plan")).toHaveValue("")
    );
  });
});
