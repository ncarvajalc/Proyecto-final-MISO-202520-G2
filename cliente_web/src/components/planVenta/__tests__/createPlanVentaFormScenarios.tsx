import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faker } from "@faker-js/faker";
import { beforeEach, expect, it, vi } from "vitest";

import { CreatePlanVentaForm } from "@/components/planVenta/CreatePlanVentaForm";
import { createPlanVenta } from "@/services/planesVenta.service";
import { getVendedores } from "@/services/vendedores.service";
import { toast } from "sonner";

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

const mockedCreatePlanVenta = vi.mocked(createPlanVenta);
const mockedGetVendedores = vi.mocked(getVendedores);
const mockedToast = vi.mocked(toast);

type PlanVentaCampos = {
  identificador: string;
  nombre: string;
  periodo: string;
  descripcion: string;
  meta: number;
};

type VendedorResumen = {
  id: string;
  nombre: string;
};

const buildVendedoresResponse = () => {
  const vendedor: VendedorResumen = {
    id: faker.string.uuid(),
    nombre: faker.person.fullName(),
  };
  return {
    data: [
      {
        ...vendedor,
        correo: faker.internet.email(),
        fechaContratacion: faker.date.past().toISOString().split("T")[0],
        planDeVenta: null,
      },
    ],
    total: 1,
    page: 1,
    limit: 100,
    totalPages: 1,
  };
};

const buildPlanVentaCampos = (): PlanVentaCampos => ({
  identificador: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
  nombre: faker.company.buzzPhrase(),
  periodo: `${faker.date
    .future({ years: 1 })
    .getFullYear()}-Q${faker.number.int({ min: 1, max: 4 })}`,
  descripcion: faker.lorem.sentence(),
  meta: faker.number.int({ min: 100, max: 500 }),
});

const renderForm = () => {
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

const fillCommonFields = async (
  user: ReturnType<typeof userEvent.setup>,
  campos: PlanVentaCampos
) => {
  await user.type(screen.getByPlaceholderText("Identificador del plan"), campos.identificador);
  await user.type(screen.getByPlaceholderText("Plan Ventas Q1 2025"), campos.nombre);
  await user.type(
    screen.getByPlaceholderText("ej. 01/01/2025 - 31/03/2025"),
    campos.periodo
  );
  await user.type(screen.getByPlaceholderText("Se espera que...."), campos.descripcion);
  await user.type(screen.getByPlaceholderText("Cuota en monto ($)"), String(campos.meta));
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

const submitForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /crear/i }));
};

const resetPlanVentaMocks = (seed: number) => {
  vi.clearAllMocks();
  faker.seed(seed);
  mockedGetVendedores.mockResolvedValue(buildVendedoresResponse());
};

export const runCreatePlanVentaUnitSuite = () => {
  beforeEach(() => resetPlanVentaMocks(701));

  it("muestra mensajes de error cuando los campos requeridos están vacíos", async () => {
    const user = userEvent.setup();
    renderForm();

    await submitForm(user);

    expect(
      await screen.findByText("El identificador es requerido.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeInTheDocument();
    expect(await screen.findByText("El periodo es requerido.")).toBeInTheDocument();
    expect(await screen.findByText("La descripción es requerida.")).toBeInTheDocument();
    expect(await screen.findByText("El vendedor es requerido.")).toBeInTheDocument();
    expect(await screen.findByText("La meta es requerida.")).toBeInTheDocument();
    expect(mockedCreatePlanVenta).not.toHaveBeenCalled();
  });

  it("cierra el formulario cuando se presiona cancelar", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderForm();

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockedCreatePlanVenta).not.toHaveBeenCalled();
  });
};

export const runCreatePlanVentaIntegrationSuite = () => {
  beforeEach(() => {
    resetPlanVentaMocks(703);
    mockedCreatePlanVenta.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
  });

  it("envía la información y resetea el formulario tras éxito", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderForm();

    await waitFor(() => expect(mockedGetVendedores).toHaveBeenCalled());
    const vendedoresResponse = await mockedGetVendedores.mock.results[0]!.value;
    const vendedor = vendedoresResponse.data[0]!;
    const campos = buildPlanVentaCampos();

    mockedCreatePlanVenta.mockResolvedValue({
      id: faker.string.uuid(),
      identificador: campos.identificador,
      nombre: campos.nombre,
      descripcion: campos.descripcion,
      periodo: campos.periodo,
      meta: campos.meta,
      vendedorId: vendedor.id,
      vendedorNombre: vendedor.nombre,
      unidadesVendidas: faker.number.int({ min: 0, max: 20 }),
    });

    await fillCommonFields(user, campos);
    await selectVendedor(user, vendedor.nombre);
    await submitForm(user);

    await waitFor(() => expect(mockedCreatePlanVenta).toHaveBeenCalledTimes(1));
    expect(mockedCreatePlanVenta).toHaveBeenCalledWith({
      identificador: campos.identificador,
      nombre: campos.nombre,
      descripcion: campos.descripcion,
      periodo: campos.periodo,
      meta: campos.meta,
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
};

export const runCreatePlanVentaFunctionalSuite = () => {
  beforeEach(() => {
    resetPlanVentaMocks(702);
    mockedCreatePlanVenta.mockReset();
    mockedToast.error.mockReset();
  });

  it("muestra feedback de error cuando la API falla", async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() => expect(mockedGetVendedores).toHaveBeenCalled());
    const vendedoresResponse = await mockedGetVendedores.mock.results[0]!.value;
    const vendedor = vendedoresResponse.data[0]!;
    const campos = buildPlanVentaCampos();
    const errorMessage = faker.lorem.sentence();

    mockedCreatePlanVenta.mockRejectedValue(new Error(errorMessage));

    await fillCommonFields(user, campos);
    await selectVendedor(user, vendedor.nombre);
    await submitForm(user);

    await waitFor(() => expect(mockedCreatePlanVenta).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Error al crear plan de venta", {
        description: "Ocurrió un error al crear el plan de venta.",
      })
    );
  });
};

export const runCreatePlanVentaAcceptanceSuite = () => {
  beforeEach(() => {
    resetPlanVentaMocks(704);
    mockedCreatePlanVenta.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
  });

  it("notifica al usuario cuando el backend responde con un detail específico", async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() => expect(mockedGetVendedores).toHaveBeenCalled());
    const vendedoresResponse = await mockedGetVendedores.mock.results[0]!.value;
    const vendedor = vendedoresResponse.data[0]!;
    const campos = buildPlanVentaCampos();
    const errorDetail = faker.lorem.sentence();
    mockedCreatePlanVenta.mockRejectedValue(
      Object.assign(new Error("fallo"), { detail: `  ${errorDetail}  ` })
    );

    await fillCommonFields(user, campos);
    await selectVendedor(user, vendedor.nombre);
    await submitForm(user);

    await waitFor(() => expect(mockedCreatePlanVenta).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Error al crear plan de venta", {
        description: errorDetail,
      })
    );
    expect(screen.getByPlaceholderText("Identificador del plan")).toHaveValue(
      campos.identificador
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
  ])("muestra el mensaje de error genérico %s", async ({ rejection }) => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() => expect(mockedGetVendedores).toHaveBeenCalled());
    const vendedoresResponse = await mockedGetVendedores.mock.results[0]!.value;
    const vendedor = vendedoresResponse.data[0]!;
    const campos = buildPlanVentaCampos();

    mockedCreatePlanVenta.mockRejectedValue(rejection());

    await fillCommonFields(user, campos);
    await selectVendedor(user, vendedor.nombre);
    await submitForm(user);

    await waitFor(() => expect(mockedCreatePlanVenta).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Error al crear plan de venta",
        { description: "Ocurrió un error al crear el plan de venta." }
      )
    );
  });
};
