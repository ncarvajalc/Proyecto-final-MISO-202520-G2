import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

vi.mock("@/services/informesComerciales.service", () => ({
  createInformeComercial: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { CreateInformeComercialForm } from "@/components/informeComercial/CreateInformeComercialForm";
import { createInformeComercial } from "@/services/informesComerciales.service";
import { toast } from "sonner";

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

describe("CreateInformeComercialForm - Unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(702);
  });

  it("muestra mensaje de error cuando el campo nombre está vacío", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /crear/i }));

    expect(
      await screen.findByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeInTheDocument();
    expect(mockedCreateInformeComercial).not.toHaveBeenCalled();
  });

  it("muestra mensaje de error cuando el nombre es muy corto", async () => {
    const user = userEvent.setup();
    renderForm();

    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    await user.type(nombreInput, "X");
    await user.click(screen.getByRole("button", { name: /crear/i }));

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
    const nombre = faker.commerce.productName();
    const responseData = {
      id: faker.string.uuid(),
      nombre,
      fecha: faker.date.recent().toISOString(),
      ventasTotales: 50000.75,
      unidadesVendidas: 250.5,
    };

    mockedCreateInformeComercial.mockResolvedValue(responseData);
    renderForm();

    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    await user.type(nombreInput, nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(mockedCreateInformeComercial).toHaveBeenCalled();
      expect(mockedCreateInformeComercial).toHaveBeenCalledWith(
        expect.objectContaining({ nombre }),
        expect.anything()
      );
    });

    // Verify indicators are displayed
    expect(await screen.findByText("Indicadores Clave")).toBeInTheDocument();
    expect(screen.getByText("Ventas Totales")).toBeInTheDocument();
    expect(screen.getByText("Unidades Vendidas")).toBeInTheDocument();

    // Verify formatted values are displayed (COP currency format)
    expect(screen.getByText(/50\.000,75/)).toBeInTheDocument(); // Currency format
    expect(screen.getByText(/250,50/)).toBeInTheDocument(); // Number format

    // Verify Cerrar button is shown
    expect(screen.getByRole("button", { name: /cerrar/i })).toBeInTheDocument();
  });

  it("muestra toast de éxito después de crear el informe", async () => {
    const user = userEvent.setup();
    const nombre = faker.commerce.productName();
    const responseData = {
      id: faker.string.uuid(),
      nombre,
      fecha: faker.date.recent().toISOString(),
      ventasTotales: 10000.0,
      unidadesVendidas: 100.0,
    };

    mockedCreateInformeComercial.mockResolvedValue(responseData);
    renderForm();

    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    await user.type(nombreInput, nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

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

    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    await user.type(nombreInput, nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Error al crear informe comercial",
        expect.objectContaining({
          description: errorMessage,
        })
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

    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    await user.type(nombreInput, nombre);

    const createButton = screen.getByRole("button", { name: /crear/i });
    await user.click(createButton);

    expect(await screen.findByText("Creando...")).toBeInTheDocument();
    expect(createButton).toBeDisabled();
  });

  it("resetea el formulario al cerrar después de crear", async () => {
    const user = userEvent.setup();
    const nombre = faker.commerce.productName();
    const responseData = {
      id: faker.string.uuid(),
      nombre,
      fecha: faker.date.recent().toISOString(),
      ventasTotales: 10000.0,
      unidadesVendidas: 100.0,
    };

    mockedCreateInformeComercial.mockResolvedValue(responseData);
    const { onOpenChange } = renderForm();

    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    await user.type(nombreInput, nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    // Wait for indicators to show
    await waitFor(() => {
      expect(screen.getByText("Indicadores Clave")).toBeInTheDocument();
    });

    // Close the dialog
    await user.click(screen.getByRole("button", { name: /cerrar/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
