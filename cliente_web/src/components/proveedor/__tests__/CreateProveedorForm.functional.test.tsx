import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

vi.mock("@/services/proveedores.service", () => ({
  createProveedor: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { CreateProveedorForm } from "@/components/proveedor/CreateProveedorForm";
import { createProveedor } from "@/services/proveedores.service";
import { toast } from "sonner";

const mockedCreateProveedor = vi.mocked(createProveedor);
const mockedToast = vi.mocked(toast);

const fillBaseForm = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText("Nombre"), faker.company.name());
  await user.type(
    screen.getByPlaceholderText("Id tax"),
    faker.string.alphanumeric({ length: 10 })
  );
  await user.type(
    screen.getByPlaceholderText("Dirección"),
    faker.location.streetAddress()
  );
  await user.type(screen.getByPlaceholderText("Teléfono"), faker.phone.number());
  await user.type(screen.getByPlaceholderText("Correo"), faker.internet.email());
  await user.type(
    screen.getByPlaceholderText("Contacto"),
    faker.person.fullName()
  );
  return user;
};

const renderComponent = () => {
  const queryClient = new QueryClient();
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <CreateProveedorForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  const formElement = utils.container.querySelector("form");
  formElement?.setAttribute("novalidate", "true");
  return { onOpenChange, ...utils };
};

describe("CreateProveedorForm - Functional", () => {
  beforeEach(() => {
    mockedCreateProveedor.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    faker.seed(802);
  });

  it("muestra feedback de error cuando la API falla", async () => {
    const { onOpenChange } = renderComponent();
    const user = await fillBaseForm();

    const errorMessage = faker.lorem.sentence();
    mockedCreateProveedor.mockRejectedValue(new Error(errorMessage));

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(mockedCreateProveedor).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Error al crear proveedor", {
        description: errorMessage,
      })
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /crear/i })).not.toBeDisabled();
  });
});
