import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/planesVenta.service", () => ({
  createPlanVenta: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { CreatePlanVentaForm } from "@/components/planVenta/CreatePlanVentaForm";
import { createPlanVenta } from "@/services/planesVenta.service";
import { toast } from "sonner";

const mockedCreatePlanVenta = vi.mocked(createPlanVenta);
const mockedToast = vi.mocked(toast);

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

describe("CreatePlanVentaForm - Functional", () => {
  beforeEach(() => {
    mockedCreatePlanVenta.mockReset();
    mockedToast.error.mockReset();
  });

  it("muestra un error cuando la meta no es un número válido", async () => {
    const user = userEvent.setup();
    setup();

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
    await user.type(screen.getByPlaceholderText("Id del vendedor"), "vend-1");
    await user.type(screen.getByPlaceholderText("Cuota en monto ($)"), "-5");

    await user.click(screen.getByRole("button", { name: /crear/i }));

    expect(mockedCreatePlanVenta).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Meta inválida", {
        description: "La meta debe ser un número mayor a 0.",
      })
    );
  });
});
