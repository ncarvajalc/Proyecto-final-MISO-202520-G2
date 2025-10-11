import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import { CreateVendedorForm } from "@/components/vendedor/CreateVendedorForm";
import { createVendedor } from "@/services/vendedores.service";

vi.mock("@/services/vendedores.service", () => ({
  createVendedor: vi.fn(),
}));

const renderForm = () => {
  const queryClient = new QueryClient();
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <CreateVendedorForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  utils.container.querySelector("form")?.setAttribute("novalidate", "true");
  return { onOpenChange, ...utils };
};

describe("CreateVendedorForm - Unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createVendedor).mockReset();
    faker.seed(951);
  });

  it("muestra mensajes de error cuando se intenta enviar vacío", async () => {
    renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(
        screen.getByText("El nombre debe tener al menos 2 caracteres.")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Debe ser un correo electrónico válido.")
      ).toBeInTheDocument();
    });
  });

  it("valida el formato del correo electrónico antes de enviar", async () => {
    const { onOpenChange } = renderForm();
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText("Nombre del vendedor"),
      faker.person.fullName()
    );
    const emailInput = screen.getByPlaceholderText("Email");
    await user.type(emailInput, faker.word.sample());

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() =>
      expect(vi.mocked(createVendedor)).not.toHaveBeenCalled()
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
