import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faker } from "@faker-js/faker";
import { beforeEach, expect, it, vi } from "vitest";

import { CreateVendedorForm } from "@/components/vendedor/CreateVendedorForm";
import { createVendedor } from "@/services/vendedores.service";
import type { Vendedor } from "@/types/vendedor";
import { toast } from "sonner";

vi.mock("@/services/vendedores.service", () => ({
  createVendedor: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedCreateVendedor = vi.mocked(createVendedor);
const mockedToast = vi.mocked(toast);

type VendedorFormInput = {
  nombre: string;
  correo: string;
};

type RenderOptions = {
  queryClient?: QueryClient;
};

const renderForm = ({ queryClient = new QueryClient() }: RenderOptions = {}) => {
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <CreateVendedorForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  utils.container.querySelector("form")?.setAttribute("novalidate", "true");
  return { onOpenChange, queryClient, ...utils };
};

const buildVendedorDraft = (): Vendedor => ({
  id: faker.string.uuid(),
  nombre: faker.person.fullName(),
  correo: faker.internet.email(),
  fechaContratacion: faker.date.past().toISOString().split("T")[0],
  planDeVenta: null,
});

const fillForm = async (user: ReturnType<typeof userEvent.setup>, draft: VendedorFormInput) => {
  await user.type(screen.getByPlaceholderText("Nombre del vendedor"), draft.nombre);
  await user.type(screen.getByPlaceholderText("Email"), draft.correo);
};

const submitForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /crear/i }));
};

const resetMocks = (seed: number) => {
  mockedCreateVendedor.mockReset();
  mockedToast.success.mockReset();
  mockedToast.error.mockReset();
  faker.seed(seed);
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

export const runCreateVendedorIntegrationSuite = () => {
  beforeEach(() => resetMocks(953));

  it("envía la información correcta y resetea el formulario tras éxito", async () => {
    const { onOpenChange } = renderForm();
    const user = userEvent.setup();
    const vendedorCreado = buildVendedorDraft();

    mockedCreateVendedor.mockResolvedValue(vendedorCreado);

    await fillForm(user, vendedorCreado);
    await submitForm(user);

    await waitFor(() => expect(mockedCreateVendedor).toHaveBeenCalledTimes(1));
    expect(mockedCreateVendedor).toHaveBeenCalledWith(
      {
        nombre: vendedorCreado.nombre,
        correo: vendedorCreado.correo,
      },
      expect.anything()
    );

    await waitFor(() =>
      expect(mockedToast.success).toHaveBeenCalledWith(
        "Vendedor creado exitosamente",
        expect.objectContaining({
          description: "El vendedor ha sido registrado en el sistema.",
        })
      )
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Nombre del vendedor")).toHaveValue("")
    );
  });
};

export const runCreateVendedorFunctionalSuite = () => {
  beforeEach(() => resetMocks(952));

  it("muestra feedback cuando la API devuelve un error", async () => {
    const { onOpenChange } = renderForm();
    const user = userEvent.setup();
    const draft = buildVendedorDraft();
    const errorMessage = faker.lorem.sentence();

    mockedCreateVendedor.mockRejectedValue({ detail: errorMessage });

    await fillForm(user, draft);
    await submitForm(user);

    await waitFor(() => expect(mockedCreateVendedor).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Error al crear vendedor",
        expect.objectContaining({ description: errorMessage })
      )
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /crear/i })).not.toBeDisabled();
  });
};

export const runCreateVendedorAcceptanceSuite = () => {
  beforeEach(() => resetMocks(954));

  it("permite registrar un vendedor y muestra estados intermedios", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { onOpenChange } = renderForm({ queryClient });
    const user = userEvent.setup();
    const draft = buildVendedorDraft();
    const deferredPromise = createDeferred<Vendedor>();

    mockedCreateVendedor.mockImplementation(() => deferredPromise.promise);

    await fillForm(user, draft);
    const submitButton = screen.getByRole("button", { name: /crear/i });
    await user.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(submitButton).toHaveTextContent(/creando/i);

    deferredPromise.resolve(draft);

    await waitFor(() => expect(mockedCreateVendedor).toHaveBeenCalled());
    await waitFor(() => expect(mockedToast.success).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["vendedores"] });
  });
};
