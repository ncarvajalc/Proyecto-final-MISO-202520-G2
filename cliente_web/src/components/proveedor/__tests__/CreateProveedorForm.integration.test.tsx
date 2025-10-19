import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, afterAll, afterEach, describe, expect, it, vi } from "vitest";
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

describe("CreateProveedorForm - Integration", () => {
  const mockedToast = vi.mocked(toast);

  it("envía la información normalizada y gestiona el éxito end-to-end", async () => {
    faker.seed(803);
    const apiUrl = "http://localhost:4013";
    vi.stubEnv("VITE_API_URL", apiUrl);

    const capturedPayloads: unknown[] = [];
    server.use(
      http.post(`${apiUrl}/proveedores`, async ({ request }) => {
        const body = await request.json();
        capturedPayloads.push(body);
        return HttpResponse.json({ id: faker.number.int({ min: 1, max: 999 }), ...body }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    const { onOpenChange } = renderComponent();

    const payload = {
      nombre: faker.company.name(),
      id_tax: faker.string.alphanumeric({ length: 10 }),
      direccion: faker.location.streetAddress(),
      telefono: faker.phone.number(),
      correo: faker.internet.email(),
      contacto: faker.person.fullName(),
      estado: "Activo" as const,
      certificado: null,
    };

    await user.type(screen.getByPlaceholderText("Nombre"), payload.nombre);
    await user.type(screen.getByPlaceholderText("Id tax"), payload.id_tax);
    await user.type(screen.getByPlaceholderText("Dirección"), payload.direccion);
    await user.type(screen.getByPlaceholderText("Teléfono"), payload.telefono);
    await user.type(screen.getByPlaceholderText("Correo"), payload.correo);
    await user.type(screen.getByPlaceholderText("Contacto"), payload.contacto);

    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => expect(capturedPayloads).toHaveLength(1));
    expect(capturedPayloads[0]).toEqual(payload);

    await waitFor(() => expect(mockedToast.success).toHaveBeenCalledWith("Proveedor creado exitosamente"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.getByPlaceholderText("Nombre")).toHaveValue(""));
  });
});
