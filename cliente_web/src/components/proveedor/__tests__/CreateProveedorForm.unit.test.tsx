import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import { CreateProveedorForm } from "@/components/proveedor/CreateProveedorForm";
import { createProveedor } from "@/services/proveedores.service";

vi.mock("@/services/proveedores.service", () => ({
  createProveedor: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderForm = () => {
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

describe("CreateProveedorForm - Unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createProveedor).mockReset();
    faker.seed(801);
  });

  it("muestra mensajes de error cuando los campos requeridos están vacíos", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(screen.getByText("El nombre es requerido")).toBeInTheDocument();
      expect(screen.getByText("El Tax ID es requerido")).toBeInTheDocument();
      expect(screen.getByText("La dirección es requerida")).toBeInTheDocument();
      expect(screen.getByText("El teléfono es requerido")).toBeInTheDocument();
      expect(
        screen.getByText("Debe ser un correo electrónico válido")
      ).toBeInTheDocument();
      expect(screen.getByText("El contacto es requerido")).toBeInTheDocument();
    });
  });

  it("valida el formato del correo electrónico", async () => {
    const user = userEvent.setup();
    renderForm();

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
    await user.type(
      screen.getByPlaceholderText("Correo"),
      faker.word.sample()
    );
    await user.type(
      screen.getByPlaceholderText("Contacto"),
      faker.person.fullName()
    );

    await user.click(screen.getByRole("button", { name: /crear/i }));

    expect(vi.mocked(createProveedor)).not.toHaveBeenCalled();
  });
});
