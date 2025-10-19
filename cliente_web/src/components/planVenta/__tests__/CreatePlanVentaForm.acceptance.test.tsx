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
  return {
    data: Array.from({ length: 2 }, () => ({
      id: faker.string.uuid(),
      nombre: faker.person.fullName(),
      correo: faker.internet.email(),
      fechaContratacion: faker.date.past().toISOString().split("T")[0],
      planDeVenta: null,
    })),
    total: 2,
    page: 1,
    limit: 100,
    totalPages: 1,
  };
};

const renderComponent = () => {
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

describe("CreatePlanVentaForm - Acceptance", () => {
  beforeEach(() => {
    mockedCreatePlanVenta.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    mockedGetVendedores.mockReset();
    faker.seed(704);
    mockedGetVendedores.mockResolvedValue(buildVendedoresResponse());
  });

  it("notifica al usuario cuando el backend responde con un detail específico", async () => {
    const user = userEvent.setup();
    renderComponent();

    const errorDetail = faker.lorem.sentence();
    const spacedDetail = `  ${errorDetail}  `;
    mockedCreatePlanVenta.mockRejectedValue(
      Object.assign(new Error(faker.lorem.sentence()), { detail: spacedDetail })
    );

    await waitFor(() => expect(mockedGetVendedores).toHaveBeenCalled());
    const vendedores = await mockedGetVendedores.mock.results[0]!.value;
    const vendedor = vendedores.data[0];
    const identificador = faker.string.alphanumeric({ length: 8 }).toUpperCase();
    const nombrePlan = faker.company.catchPhrase();
    const periodo = `${faker.date.future({ years: 1 }).getFullYear()}-Q${faker.number.int({ min: 1, max: 4 })}`;
    const descripcion = faker.lorem.sentence();
    const meta = faker.number.int({ min: 50, max: 500 });

    await user.type(screen.getByPlaceholderText("Identificador del plan"), identificador);
    await user.type(screen.getByPlaceholderText("Plan Ventas Q1 2025"), nombrePlan);
    await user.type(screen.getByPlaceholderText("ej. 01/01/2025 - 31/03/2025"), periodo);
    await user.type(screen.getByPlaceholderText("Se espera que...."), descripcion);
    await waitFor(() => expect(mockedGetVendedores).toHaveBeenCalled());
    await selectVendedor(user, vendedor.nombre);
    await user.type(screen.getByPlaceholderText("Cuota en monto ($)"), String(meta));

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreatePlanVenta).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Error al crear plan de venta", {
        description: errorDetail,
      })
    );
    expect(screen.getByPlaceholderText("Identificador del plan")).toHaveValue(
      identificador
    );
  });

  it.each([
    {
      title: "cuando el backend no envía detail",
      rejection: () => new Error(""),
    },
    {
      title: "cuando el backend envía detail vacío",
      rejection: () => Object.assign(new Error("fallo"), { detail: "   " }),
    },
  ])(
    "muestra el mensaje de error genérico $title",
    async ({ rejection }) => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => expect(mockedGetVendedores).toHaveBeenCalled());
      const vendedores = await mockedGetVendedores.mock.results[0]!.value;
      const vendedor = vendedores.data[1];
      const identificador = faker.string.alphanumeric({ length: 8 }).toUpperCase();
      const nombrePlan = faker.company.catchPhrase();
      const periodo = `${faker.date.future({ years: 1 }).getFullYear()}-Q${faker.number.int({
        min: 1,
        max: 4,
      })}`;
      const descripcion = faker.lorem.sentence();
      const meta = faker.number.int({ min: 50, max: 500 });

      mockedCreatePlanVenta.mockRejectedValue(rejection());

      await user.type(
        screen.getByPlaceholderText("Identificador del plan"),
        identificador
      );
      await user.type(
        screen.getByPlaceholderText("Plan Ventas Q1 2025"),
        nombrePlan
      );
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

      await waitFor(() => expect(mockedCreatePlanVenta).toHaveBeenCalled());
      await waitFor(() =>
        expect(mockedToast.error).toHaveBeenCalledWith(
          "Error al crear plan de venta",
          {
            description: "Ocurrió un error al crear el plan de venta.",
          }
        )
      );
    }
  );
});
