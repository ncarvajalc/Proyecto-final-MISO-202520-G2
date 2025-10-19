import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { faker } from "@faker-js/faker";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { CreateProveedorForm } from "@/components/proveedor/CreateProveedorForm";
import { toast } from "sonner";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});

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

const fillBaseForm = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText("Nombre"), faker.company.name());
  await user.type(screen.getByPlaceholderText("Id tax"), faker.string.alphanumeric({ length: 10 }));
  await user.type(screen.getByPlaceholderText("Dirección"), faker.location.streetAddress());
  await user.type(screen.getByPlaceholderText("Teléfono"), faker.phone.number());
  await user.type(screen.getByPlaceholderText("Correo"), faker.internet.email());
  await user.type(screen.getByPlaceholderText("Contacto"), faker.person.fullName());
  return user;
};

describe("CreateProveedorForm - Functional", () => {
  const mockedToast = vi.mocked(toast);

  it("muestra feedback de error cuando la API falla", async () => {
    faker.seed(802);
    const apiUrl = "http://localhost:4012";
    vi.stubEnv("VITE_API_URL", apiUrl);

    server.use(
      http.post(`${apiUrl}/proveedores`, () =>
        HttpResponse.json({ detail: "Duplicado" }, { status: 409 })
      )
    );

    const { onOpenChange } = renderComponent();
    const user = await fillBaseForm();

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Error al crear proveedor", {
        description: "Duplicado",
      })
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /crear/i })).not.toBeDisabled();
  });
});
