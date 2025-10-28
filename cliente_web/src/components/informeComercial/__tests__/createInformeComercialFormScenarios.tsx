import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faker } from "@faker-js/faker";
import { beforeEach, expect, it, vi } from "vitest";

import { CreateInformeComercialForm } from "@/components/informeComercial/CreateInformeComercialForm";
import { createInformeComercial } from "@/services/informesComerciales.service";
import { toast } from "sonner";

vi.mock("@/services/informesComerciales.service", () => ({
  createInformeComercial: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedCreateInformeComercial = vi.mocked(createInformeComercial);
const mockedToast = vi.mocked(toast);

const renderForm = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <CreateInformeComercialForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  utils.container.querySelector("form")?.setAttribute("novalidate", "true");
  return { onOpenChange, ...utils };
};

const fillNombre = async (user: ReturnType<typeof userEvent.setup>, nombre: string) => {
  const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
  await user.clear(nombreInput);
  await user.type(nombreInput, nombre);
};

const submitForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /crear/i }));
};

const buildInformeResponse = () => ({
  id: faker.string.uuid(),
  nombre: faker.commerce.productName(),
  fecha: faker.date.recent().toISOString(),
  ventasTotales: faker.number.float({ min: 1000, max: 150000, fractionDigits: 2 }),
  unidadesVendidas: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
});

const resetMocks = (seed: number) => {
  vi.clearAllMocks();
  faker.seed(seed);
  mockedCreateInformeComercial.mockReset();
  mockedToast.success.mockReset();
  mockedToast.error.mockReset();
};

export const runCreateInformeComercialUnitSuite = () => {
  beforeEach(() => resetMocks(702));

  it("muestra mensaje de error cuando el campo nombre está vacío", async () => {
    const user = userEvent.setup();
    renderForm();

    await submitForm(user);

    expect(
      await screen.findByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeInTheDocument();
    expect(mockedCreateInformeComercial).not.toHaveBeenCalled();
  });

  it("muestra mensaje de error cuando el nombre es muy corto", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillNombre(user, "X");
    await submitForm(user);

    expect(
      await screen.findByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeInTheDocument();
    expect(mockedCreateInformeComercial).not.toHaveBeenCalled();
  });

  it("cierra el formulario cuando se presiona cancelar", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderForm();

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockedCreateInformeComercial).not.toHaveBeenCalled();
  });

  it("muestra indicadores después de crear el informe exitosamente", async () => {
    const user = userEvent.setup();
    const respuesta = buildInformeResponse();
    mockedCreateInformeComercial.mockResolvedValue(respuesta);
    renderForm();

    await fillNombre(user, respuesta.nombre);
    await submitForm(user);

    await waitFor(() => {
      expect(mockedCreateInformeComercial).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: respuesta.nombre }),
        expect.anything()
      );
    });

    expect(await screen.findByText("Indicadores Clave")).toBeInTheDocument();
    expect(screen.getByText("Ventas Totales")).toBeInTheDocument();
    expect(screen.getByText("Unidades Vendidas")).toBeInTheDocument();
    const formattedValues = screen.getAllByText(/\d{1,3}(\.\d{3})*,\d{2}/);
    expect(formattedValues.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /cerrar/i })).toBeInTheDocument();
  });

  it("muestra toast de éxito después de crear el informe", async () => {
    const user = userEvent.setup();
    const respuesta = buildInformeResponse();
    mockedCreateInformeComercial.mockResolvedValue(respuesta);
    renderForm();

    await fillNombre(user, respuesta.nombre);
    await submitForm(user);

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith(
        "Informe comercial creado exitosamente"
      );
    });
  });

  it("muestra toast de error cuando la creación falla", async () => {
    const user = userEvent.setup();
    const nombre = faker.commerce.productName();
    const errorMessage = "Error de conexión";
    mockedCreateInformeComercial.mockRejectedValue(new Error(errorMessage));
    renderForm();

    await fillNombre(user, nombre);
    await submitForm(user);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Error al crear informe comercial",
        expect.objectContaining({ description: errorMessage })
      );
    });
  });

  it("deshabilita el botón de crear mientras está enviando", async () => {
    const user = userEvent.setup();
    const nombre = faker.commerce.productName();
    mockedCreateInformeComercial.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );
    renderForm();

    await fillNombre(user, nombre);
    const createButton = screen.getByRole("button", { name: /crear/i });
    await user.click(createButton);

    expect(await screen.findByText("Creando...")).toBeInTheDocument();
    expect(createButton).toBeDisabled();
  });

  it("resetea el formulario al cerrar después de crear", async () => {
    const user = userEvent.setup();
    const respuesta = buildInformeResponse();
    mockedCreateInformeComercial.mockResolvedValue(respuesta);
    const { onOpenChange } = renderForm();

    await fillNombre(user, respuesta.nombre);
    await submitForm(user);

    await waitFor(() => expect(mockedCreateInformeComercial).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /cerrar/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByPlaceholderText("ej. IC-2025-Q1")).toHaveValue("");
  });
};

export const runCreateInformeComercialFunctionalSuite = () => {
  beforeEach(() => resetMocks(705));

  it("permite ingresar un nombre válido y crear el informe", async () => {
    const user = userEvent.setup();
    const respuesta = buildInformeResponse();
    mockedCreateInformeComercial.mockResolvedValue(respuesta);
    renderForm();

    await fillNombre(user, respuesta.nombre);
    await submitForm(user);

    await waitFor(() => {
      expect(mockedCreateInformeComercial).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: respuesta.nombre }),
        expect.anything()
      );
      expect(mockedToast.success).toHaveBeenCalledWith(
        "Informe comercial creado exitosamente"
      );
    });

    expect(await screen.findByText("Indicadores Clave")).toBeInTheDocument();
  });

  it("previene la creación cuando el nombre tiene solo 1 carácter", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillNombre(user, "A");
    await submitForm(user);

    expect(
      await screen.findByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeInTheDocument();
    expect(mockedCreateInformeComercial).not.toHaveBeenCalled();
  });

  it("acepta un nombre en el límite inferior de caracteres (2)", async () => {
    const user = userEvent.setup();
    const respuesta = buildInformeResponse();
    respuesta.nombre = "AB";
    mockedCreateInformeComercial.mockResolvedValue(respuesta);
    renderForm();

    await fillNombre(user, respuesta.nombre);
    await submitForm(user);

    await waitFor(() => {
      expect(mockedCreateInformeComercial).toHaveBeenCalled();
    });
  });

  it("muestra mensaje de error del servidor con formato adecuado", async () => {
    const user = userEvent.setup();
    const nombre = faker.commerce.productName();
    const serverError = {
      detail: "Error interno del servidor: no se pudo calcular los indicadores",
      message: "Server Error",
    };
    mockedCreateInformeComercial.mockRejectedValue(serverError);
    renderForm();

    await fillNombre(user, nombre);
    await submitForm(user);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Error al crear informe comercial",
        expect.objectContaining({ description: serverError.detail })
      );
    });
  });

  it("permite reintentar la creación después de un error", async () => {
    const user = userEvent.setup();
    const respuesta = buildInformeResponse();
    mockedCreateInformeComercial.mockRejectedValueOnce(new Error("Error de red"));
    mockedCreateInformeComercial.mockResolvedValueOnce(respuesta);
    renderForm();

    await fillNombre(user, respuesta.nombre);
    await submitForm(user);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalled();
    });

    await submitForm(user);

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalled();
      expect(screen.getByText("Indicadores Clave")).toBeInTheDocument();
    });
  });

  it("formatea correctamente los valores monetarios con dos decimales", async () => {
    const user = userEvent.setup();
    const respuesta = buildInformeResponse();
    respuesta.ventasTotales = 1234567.89;
    respuesta.unidadesVendidas = 98765.43;
    mockedCreateInformeComercial.mockResolvedValue(respuesta);
    renderForm();

    await fillNombre(user, respuesta.nombre);
    await submitForm(user);

    await waitFor(() => expect(mockedToast.success).toHaveBeenCalled());
    expect(screen.getByText(/1\.234\.567,89/)).toBeInTheDocument();
    expect(screen.getByText(/98\.765,43/)).toBeInTheDocument();
  });
};
