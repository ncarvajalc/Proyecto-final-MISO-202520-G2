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

const setup = () => {
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
  return { onOpenChange, queryClient, ...utils };
};

describe("CreateInformeComercialForm - Integration", () => {
  beforeEach(() => {
    mockedCreateInformeComercial.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    faker.seed(704);
  });

  it("envía la información y muestra indicadores tras éxito", async () => {
    const user = userEvent.setup();
    setup();

    const nombre = faker.commerce.productName();
    const responseData = {
      id: faker.string.uuid(),
      nombre,
      fecha: faker.date.recent().toISOString(),
      ventasTotales: 125000.5,
      unidadesVendidas: 450.75,
    };

    mockedCreateInformeComercial.mockResolvedValue(responseData);

    // Fill out the form
    await user.type(screen.getByPlaceholderText("ej. IC-2025-Q1"), nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    // Verify the service was called
    await waitFor(() =>
      expect(mockedCreateInformeComercial).toHaveBeenCalledTimes(1)
    );
    expect(mockedCreateInformeComercial).toHaveBeenCalledWith(
      expect.objectContaining({ nombre }),
      expect.anything()
    );

    // Verify success toast
    await waitFor(() =>
      expect(mockedToast.success).toHaveBeenCalledWith(
        "Informe comercial creado exitosamente"
      )
    );

    // Verify indicators are displayed
    expect(await screen.findByText("Indicadores Clave")).toBeInTheDocument();
    expect(screen.getByText("Ventas Totales")).toBeInTheDocument();
    expect(screen.getByText("Unidades Vendidas")).toBeInTheDocument();

    // Verify formatted values
    expect(screen.getByText(/125\.000,50/)).toBeInTheDocument();
    expect(screen.getByText(/450,75/)).toBeInTheDocument();
  });

  it("maneja errores del servicio correctamente", async () => {
    const user = userEvent.setup();
    setup();

    const nombre = faker.commerce.productName();
    const errorDetail = "No se pudo conectar con el servidor";

    mockedCreateInformeComercial.mockRejectedValue({
      detail: errorDetail,
      message: "Network Error",
    });

    // Fill out the form
    await user.type(screen.getByPlaceholderText("ej. IC-2025-Q1"), nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    // Verify the service was called
    await waitFor(() =>
      expect(mockedCreateInformeComercial).toHaveBeenCalledTimes(1)
    );

    // Verify error toast
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Error al crear informe comercial",
        expect.objectContaining({
          description: errorDetail,
        })
      )
    );

    // Verify indicators are NOT displayed
    expect(screen.queryByText("Indicadores Clave")).not.toBeInTheDocument();
  });

  it("resetea el formulario al cerrar después de crear exitosamente", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = setup();

    const nombre = faker.commerce.productName();
    const responseData = {
      id: faker.string.uuid(),
      nombre,
      fecha: faker.date.recent().toISOString(),
      ventasTotales: 10000.0,
      unidadesVendidas: 100.0,
    };

    mockedCreateInformeComercial.mockResolvedValue(responseData);

    // Fill and submit form
    await user.type(screen.getByPlaceholderText("ej. IC-2025-Q1"), nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    // Wait for indicators to show
    await waitFor(() => {
      expect(screen.getByText("Indicadores Clave")).toBeInTheDocument();
    });

    // Close the dialog
    await user.click(screen.getByRole("button", { name: /cerrar/i }));

    // Verify onOpenChange was called with false
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("cierra el formulario al presionar cancelar sin crear", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = setup();

    const nombre = faker.commerce.productName();
    await user.type(screen.getByPlaceholderText("ej. IC-2025-Q1"), nombre);

    // Click cancel
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    // Verify onOpenChange was called with false
    expect(onOpenChange).toHaveBeenCalledWith(false);

    // Verify service was NOT called
    expect(mockedCreateInformeComercial).not.toHaveBeenCalled();
  });
});
