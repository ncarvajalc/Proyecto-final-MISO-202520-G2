import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
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

const mockedCreatePlanVenta = vi.mocked(createPlanVenta);

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

describe("CreatePlanVentaForm - Unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra mensajes de error cuando los campos requeridos están vacíos", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /crear/i }));

    expect(
      await screen.findByText("El identificador es requerido.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("El periodo es requerido.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("La descripción es requerida.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("El vendedor es requerido.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("La meta es requerida.")
    ).toBeInTheDocument();
    expect(mockedCreatePlanVenta).not.toHaveBeenCalled();
  });

  it("cierra el formulario cuando se presiona cancelar", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderForm();

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockedCreatePlanVenta).not.toHaveBeenCalled();
  });
});
