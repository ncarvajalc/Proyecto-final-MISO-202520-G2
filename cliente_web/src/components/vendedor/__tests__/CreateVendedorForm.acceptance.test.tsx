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
import type { Vendedor } from "@/types/vendedor";
import { toast } from "sonner";

const mockedCreateVendedor = vi.mocked(createVendedor);
const mockedToast = vi.mocked(toast);

const renderForm = () => {
  const queryClient = new QueryClient();
  vi.spyOn(queryClient, "invalidateQueries");
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <CreateVendedorForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  utils.container.querySelector("form")?.setAttribute("novalidate", "true");
  return { onOpenChange, queryClient, ...utils };
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("CreateVendedorForm - Acceptance", () => {
  beforeEach(() => {
    mockedCreateVendedor.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    faker.seed(954);
  });

  it("permite registrar un vendedor y muestra estados intermedios", async () => {
    const user = userEvent.setup();
    const { onOpenChange, queryClient } = renderForm();

    const deferredPromise = deferred<Vendedor>();
    mockedCreateVendedor.mockImplementation(() => deferredPromise.promise);

    const nombre = faker.person.fullName();
    const correo = faker.internet.email();
    const fechaContratacion = faker.date.past().toISOString().split("T")[0];
    const vendedorId = faker.string.uuid();

    await user.type(screen.getByPlaceholderText("Nombre del vendedor"), nombre);
    await user.type(screen.getByPlaceholderText("Email"), correo);

    const submitButton = screen.getByRole("button", { name: /crear/i });
    await user.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(submitButton).toHaveTextContent(/creando/i);

    deferredPromise.resolve({
      id: vendedorId,
      nombre,
      correo,
      fechaContratacion,
      planDeVenta: null,
    });

    await waitFor(() => expect(mockedCreateVendedor).toHaveBeenCalled());
    await waitFor(() => expect(mockedToast.success).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["vendedores"],
    });
  });
});
