import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const vendedoresResponse = {
  data: [
    {
      id: "vend-1",
      nombre: "Laura Pérez",
      correo: "laura.perez@example.com",
      fechaContratacion: "2024-01-15",
      planDeVenta: null,
    },
    {
      id: "vend-2",
      nombre: "Carlos Gómez",
      correo: "carlos.gomez@example.com",
      fechaContratacion: "2023-12-01",
      planDeVenta: null,
    },
  ],
  total: 2,
  page: 1,
  limit: 100,
  totalPages: 1,
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
    mockedGetVendedores.mockResolvedValue(vendedoresResponse);
  });

  it("notifica al usuario cuando el backend responde con un error", async () => {
    const user = userEvent.setup();
    renderComponent();

    mockedCreatePlanVenta.mockRejectedValue(
      Object.assign(new Error("Backend error"), { detail: "Capacidad superada" })
    );

    await user.type(
      screen.getByPlaceholderText("Identificador del plan"),
      "PV-2025-Q1"
    );
    await user.type(
      screen.getByPlaceholderText("Plan Ventas Q1 2025"),
      "Plan Q1"
    );
    await user.type(
      screen.getByPlaceholderText("ej. 01/01/2025 - 31/03/2025"),
      "2025-Q1"
    );
    await user.type(
      screen.getByPlaceholderText("Se espera que...."),
      "Plan del primer trimestre"
    );
    await waitFor(() => expect(mockedGetVendedores).toHaveBeenCalled());
    await selectVendedor(user, "Laura Pérez");
    await user.type(screen.getByPlaceholderText("Cuota en monto ($)"), "150");

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreatePlanVenta).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Error al crear plan de venta", {
        description: "Capacidad superada",
      })
    );
    expect(screen.getByPlaceholderText("Identificador del plan")).toHaveValue(
      "PV-2025-Q1"
    );
  });

  it("muestra el mensaje de error genérico cuando no hay detalle específico", async () => {
    const user = userEvent.setup();
    renderComponent();

    mockedCreatePlanVenta.mockRejectedValue(new Error("Identificador duplicado"));

    await user.type(
      screen.getByPlaceholderText("Identificador del plan"),
      "PV-2025-Q2"
    );
    await user.type(
      screen.getByPlaceholderText("Plan Ventas Q1 2025"),
      "Plan Q2"
    );
    await user.type(
      screen.getByPlaceholderText("ej. 01/01/2025 - 31/03/2025"),
      "2025-Q2"
    );
    await user.type(
      screen.getByPlaceholderText("Se espera que...."),
      "Plan del segundo trimestre"
    );
    await waitFor(() => expect(mockedGetVendedores).toHaveBeenCalled());
    await selectVendedor(user, "Carlos Gómez");
    await user.type(screen.getByPlaceholderText("Cuota en monto ($)"), "200");

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreatePlanVenta).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Error al crear plan de venta", {
        description: "Identificador duplicado",
      })
    );
  });
});
