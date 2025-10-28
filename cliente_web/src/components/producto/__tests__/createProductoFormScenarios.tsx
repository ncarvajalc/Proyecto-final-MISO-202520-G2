import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faker } from "@faker-js/faker";
import { beforeEach, expect, it, vi } from "vitest";

import { CreateProductoForm } from "@/components/producto/CreateProductoForm";
import { createProducto } from "@/services/productos.service";
import { toast } from "sonner";

vi.mock("@/services/productos.service", () => ({
  createProducto: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedCreateProducto = vi.mocked(createProducto);
const mockedToast = vi.mocked(toast);

type ProductoFormData = {
  sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
};

type Especificacion = {
  nombre: string;
  valor: string;
};

const buildProductoBase = (): ProductoFormData => ({
  sku: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
  nombre: faker.commerce.productName(),
  descripcion: faker.commerce.productDescription(),
  precio: faker.number.int({ min: 1000, max: 90000 }),
});

const buildEspecificacion = (): Especificacion => ({
  nombre: faker.commerce.productMaterial(),
  valor: faker.commerce.productAdjective(),
});

const renderForm = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <CreateProductoForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  utils.container.querySelector("form")?.setAttribute("novalidate", "true");
  return { onOpenChange, queryClient, ...utils };
};

const fillProductoCamposBase = async (
  user: ReturnType<typeof userEvent.setup>,
  data: ProductoFormData
) => {
  await user.type(screen.getByPlaceholderText("MED-001"), data.sku);
  await user.type(screen.getByPlaceholderText("Nombre del producto"), data.nombre);
  await user.type(
    screen.getByPlaceholderText("Descripción del producto"),
    data.descripcion
  );
  await user.clear(screen.getByPlaceholderText("5000"));
  await user.type(screen.getByPlaceholderText("5000"), String(data.precio));
};

const addEspecificacion = async (
  user: ReturnType<typeof userEvent.setup>,
  especificacion: Especificacion
) => {
  await user.click(screen.getByRole("button", { name: /agregar/i }));
  const nombres = screen.getAllByPlaceholderText("Nombre");
  const valores = screen.getAllByPlaceholderText("Valor");
  await user.type(nombres[nombres.length - 1]!, especificacion.nombre);
  await user.type(valores[valores.length - 1]!, especificacion.valor);
};

const completarHojaTecnica = async (
  user: ReturnType<typeof userEvent.setup>,
  manualUrl: string,
  instalacionUrl: string
) => {
  await user.type(
    screen.getByPlaceholderText("https://ejemplo.com/manual.pdf"),
    manualUrl
  );
  await user.type(
    screen.getByPlaceholderText("https://ejemplo.com/instalacion.pdf"),
    instalacionUrl
  );
};

const seleccionarCertificacion = async (
  user: ReturnType<typeof userEvent.setup>,
  nombreCertificacion: string
) => {
  const combobox = screen.getByRole("combobox");
  await user.click(combobox);
  const option = await screen.findByRole("option", {
    name: new RegExp(nombreCertificacion, "i"),
  });
  await user.click(option);
};

const enviarFormulario = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /crear/i }));
};

const resetProductoMocks = (seed: number) => {
  mockedCreateProducto.mockReset();
  mockedToast.success.mockReset();
  mockedToast.error.mockReset();
  faker.seed(seed);
};

export const runCreateProductoUnitSuite = () => {
  beforeEach(() => resetProductoMocks(901));

  it("muestra errores cuando los campos requeridos están vacíos", async () => {
    const user = userEvent.setup();
    renderForm();

    await enviarFormulario(user);

    expect(await screen.findByText("El SKU es requerido")).toBeInTheDocument();
    expect(await screen.findByText("El nombre es requerido")).toBeInTheDocument();
    expect(
      await screen.findByText("La descripción es requerida")
    ).toBeInTheDocument();
  });

  it("evita el envío cuando el precio no es válido", async () => {
    const user = userEvent.setup();
    renderForm();

    const data = buildProductoBase();
    await fillProductoCamposBase(user, data);
    await user.clear(screen.getByPlaceholderText("5000"));
    await user.type(screen.getByPlaceholderText("5000"), "0");

    await enviarFormulario(user);

    expect(await screen.findByText("El precio debe ser mayor a 0")).toBeInTheDocument();
    expect(mockedCreateProducto).not.toHaveBeenCalled();
  });
};

export const runCreateProductoIntegrationSuite = () => {
  beforeEach(() => resetProductoMocks(903));

  it("envía los campos mínimos y reinicia el formulario tras éxito", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderForm();

    mockedCreateProducto.mockResolvedValue({ id: faker.string.uuid() });

    const producto = buildProductoBase();
    await fillProductoCamposBase(user, producto);
    await enviarFormulario(user);

    await waitFor(() => expect(mockedCreateProducto).toHaveBeenCalledTimes(1));
    const [payloadEnviado] = mockedCreateProducto.mock.calls[0]!;
    expect(payloadEnviado).toEqual({ ...producto, activo: true });

    await waitFor(() => expect(mockedToast.success).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Nombre del producto")).toHaveValue("")
    );
  });
};

export const runCreateProductoFunctionalSuite = () => {
  beforeEach(() => resetProductoMocks(902));

  it("muestra un mensaje de error cuando la creación falla", async () => {
    const user = userEvent.setup();
    renderForm();

    const data = buildProductoBase();
    const errorMessage = faker.lorem.sentence();

    mockedCreateProducto.mockRejectedValue(new Error(errorMessage));

    await fillProductoCamposBase(user, data);
    await enviarFormulario(user);

    await waitFor(() => expect(mockedCreateProducto).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Error al crear producto", {
        description: errorMessage,
      })
    );
  });
};

export const runCreateProductoAcceptanceSuite = () => {
  beforeEach(() => resetProductoMocks(904));

  it(
    "permite registrar un producto con especificaciones y hoja técnica completa",
    async () => {
      const user = userEvent.setup();
      const { onOpenChange } = renderForm();

      mockedCreateProducto.mockResolvedValue({ id: faker.string.uuid() });

      const producto = buildProductoBase();
      const especificacion = buildEspecificacion();
      const manualUrl = faker.internet.url();
      const instalacionUrl = faker.internet.url();

      await fillProductoCamposBase(user, producto);
      await addEspecificacion(user, especificacion);
      await completarHojaTecnica(user, manualUrl, instalacionUrl);
      await seleccionarCertificacion(user, "INVIMA");
      await enviarFormulario(user);

      await waitFor(() => expect(mockedCreateProducto).toHaveBeenCalledTimes(1));
      const [payload] = mockedCreateProducto.mock.calls[0]!;
      expect(payload).toEqual({
        ...producto,
        activo: true,
        especificaciones: [especificacion],
        hojaTecnica: {
          urlManual: manualUrl,
          urlHojaInstalacion: instalacionUrl,
          certificaciones: ["INVIMA"],
        },
      });

      await waitFor(() => expect(mockedToast.success).toHaveBeenCalled());
      expect(onOpenChange).toHaveBeenCalledWith(false);
    },
    20000
  );
};
