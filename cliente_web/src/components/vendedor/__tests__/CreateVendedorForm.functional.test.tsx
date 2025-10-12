import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

vi.mock("@/services/vendedores.service", () => ({
  createVendedor: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { CreateVendedorForm } from "@/components/vendedor/CreateVendedorForm";
import { createVendedor } from "@/services/vendedores.service";
import { toast } from "sonner";

const mockedCreateVendedor = vi.mocked(createVendedor);
const mockedToast = vi.mocked(toast);

const renderComponent = () => {
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

const fillForm = async () => {
  const user = userEvent.setup();
  await user.type(
    screen.getByPlaceholderText("Nombre del vendedor"),
    faker.person.fullName()
  );
  await user.type(
    screen.getByPlaceholderText("Email"),
    faker.internet.email()
  );
  return user;
};

describe("CreateVendedorForm - Functional", () => {
  beforeEach(() => {
    mockedCreateVendedor.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    faker.seed(952);
  });

  it("muestra feedback cuando la API devuelve un error", async () => {
    const { onOpenChange } = renderComponent();
    const user = await fillForm();

    const errorMessage = faker.lorem.sentence();
    mockedCreateVendedor.mockRejectedValue({
      detail: errorMessage,
    });

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreateVendedor).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Error al crear vendedor",
        expect.objectContaining({
          description: errorMessage,
        })
      )
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /crear/i })).not.toBeDisabled();
  });
});
