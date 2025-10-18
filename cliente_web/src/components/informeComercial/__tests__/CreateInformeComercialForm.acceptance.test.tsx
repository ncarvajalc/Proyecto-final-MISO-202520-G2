import React from "react";
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

const renderComponent = () => {
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

describe("CreateInformeComercialForm - Acceptance", () => {
  beforeEach(() => {
    mockedCreateInformeComercial.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    faker.seed(706);
  });

  it("completa el flujo end-to-end de creación de informe comercial con éxito", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderComponent();

    const nombre = faker.commerce.productName();
    const responseData = {
      id: faker.string.uuid(),
      nombre,
      fecha: faker.date.recent().toISOString(),
      ventasTotales: 150000.75,
      unidadesVendidas: 550.25,
    };

    mockedCreateInformeComercial.mockResolvedValue(responseData);

    // User opens the form and sees the title
    expect(screen.getByText("Informe Comercial")).toBeInTheDocument();

    // User fills the nombre field
    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    expect(nombreInput).toBeInTheDocument();
    await user.type(nombreInput, nombre);

    // User submits the form
    const crearButton = screen.getByRole("button", { name: /crear/i });
    await user.click(crearButton);

    // System creates the report
    await waitFor(() => {
      expect(mockedCreateInformeComercial).toHaveBeenCalled();
      expect(mockedCreateInformeComercial).toHaveBeenCalledWith(
        expect.objectContaining({ nombre }),
        expect.anything()
      );
    });

    // System shows success notification
    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith(
        "Informe comercial creado exitosamente"
      );
    });

    // System displays the indicators
    expect(await screen.findByText("Indicadores Clave")).toBeInTheDocument();
    expect(screen.getByText("Ventas Totales")).toBeInTheDocument();
    expect(screen.getByText("Unidades Vendidas")).toBeInTheDocument();

    // System displays formatted values
    expect(screen.getByText(/150\.000,75/)).toBeInTheDocument();
    expect(screen.getByText(/550,25/)).toBeInTheDocument();

    // User closes the dialog
    const cerrarButton = screen.getByRole("button", { name: /cerrar/i });
    await user.click(cerrarButton);

    // System closes the dialog
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("notifica al usuario cuando el backend responde con un detail específico", async () => {
    const user = userEvent.setup();
    renderComponent();

    const nombre = faker.commerce.productName();
    const errorDetail =
      "No se pudo calcular los indicadores: base de datos no disponible";

    mockedCreateInformeComercial.mockRejectedValue(
      Object.assign(new Error("Server Error"), { detail: errorDetail })
    );

    // User fills the form
    await user.type(screen.getByPlaceholderText("ej. IC-2025-Q1"), nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    // System attempts to create the report
    await waitFor(() => {
      expect(mockedCreateInformeComercial).toHaveBeenCalled();
      expect(mockedCreateInformeComercial).toHaveBeenCalledWith(
        expect.objectContaining({ nombre }),
        expect.anything()
      );
    });

    // System shows error notification with specific detail
    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Error al crear informe comercial",
        expect.objectContaining({
          description: errorDetail,
        })
      );
    });

    // Form remains open with data preserved
    expect(screen.getByPlaceholderText("ej. IC-2025-Q1")).toHaveValue(nombre);
  });

  it("muestra el mensaje del error genérico cuando el backend no envía detail", async () => {
    const user = userEvent.setup();
    renderComponent();

    const nombre = faker.commerce.productName();
    mockedCreateInformeComercial.mockRejectedValue(new Error("Network Error"));

    // User fills the form
    await user.type(screen.getByPlaceholderText("ej. IC-2025-Q1"), nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    // System attempts to create the report
    await waitFor(() => {
      expect(mockedCreateInformeComercial).toHaveBeenCalled();
      expect(mockedCreateInformeComercial).toHaveBeenCalledWith(
        expect.objectContaining({ nombre }),
        expect.anything()
      );
    });

    // System shows error notification with generic message
    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Error al crear informe comercial",
        expect.objectContaining({
          description: "Network Error",
        })
      );
    });
  });

  it("valida que el nombre sea requerido antes de enviar", async () => {
    const user = userEvent.setup();
    renderComponent();

    // User tries to submit without filling the form
    await user.click(screen.getByRole("button", { name: /crear/i }));

    // System prevents submission and shows validation error
    expect(
      await screen.findByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeInTheDocument();
    expect(mockedCreateInformeComercial).not.toHaveBeenCalled();
  });

  it("permite al usuario cancelar la creación", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderComponent();

    const nombre = faker.commerce.productName();

    // User starts filling the form
    await user.type(screen.getByPlaceholderText("ej. IC-2025-Q1"), nombre);

    // User decides to cancel
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    // System closes the dialog without creating
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockedCreateInformeComercial).not.toHaveBeenCalled();
  });

  it("muestra indicadores con ceros cuando el backend retorna valores cero", async () => {
    const user = userEvent.setup();
    renderComponent();

    const nombre = faker.commerce.productName();
    const responseData = {
      id: faker.string.uuid(),
      nombre,
      fecha: faker.date.recent().toISOString(),
      ventasTotales: 0,
      unidadesVendidas: 0,
    };

    mockedCreateInformeComercial.mockResolvedValue(responseData);

    // User creates a report
    await user.type(screen.getByPlaceholderText("ej. IC-2025-Q1"), nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    // System displays indicators with zero values
    await waitFor(() => {
      expect(screen.getByText("Indicadores Clave")).toBeInTheDocument();
    });

    // Verify formatted zeros are displayed (0,00)
    const formattedZeros = screen.getAllByText(/0,00/);
    expect(formattedZeros.length).toBeGreaterThanOrEqual(2);
  });

  it("deshabilita el botón de crear mientras está procesando la solicitud", async () => {
    const user = userEvent.setup();
    renderComponent();

    const nombre = faker.commerce.productName();

    // Mock a slow response
    mockedCreateInformeComercial.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 2000))
    );

    // User submits the form
    await user.type(screen.getByPlaceholderText("ej. IC-2025-Q1"), nombre);
    const crearButton = screen.getByRole("button", { name: /crear/i });
    await user.click(crearButton);

    // System shows loading state
    expect(await screen.findByText("Creando...")).toBeInTheDocument();
    expect(crearButton).toBeDisabled();

    // Cancel button is also disabled during creation
    const cancelarButton = screen.getByRole("button", { name: /cancelar/i });
    expect(cancelarButton).toBeDisabled();
  });
});
