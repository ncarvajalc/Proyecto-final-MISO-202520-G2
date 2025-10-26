import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

vi.mock("@/services/productos.service", () => ({
  createProducto: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { CreateProductoForm } from "@/components/producto/CreateProductoForm";
import { createProducto } from "@/services/productos.service";
import { toast } from "sonner";

const mockedCreateProducto = vi.mocked(createProducto);
const mockedToast = vi.mocked(toast);

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
  const formElement = utils.container.querySelector("form");
  formElement?.setAttribute("novalidate", "true");
  return { onOpenChange, ...utils };
};

describe("CreateProductoForm - Acceptance", () => {
  beforeEach(() => {
    mockedCreateProducto.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    faker.seed(904);
  });

  it(
    "permite registrar un producto con especificaciones y hoja técnica completa",
    async () => {
      const user = userEvent.setup();
      const { onOpenChange } = renderForm();

      mockedCreateProducto.mockResolvedValue({ id: faker.string.uuid() });

      const producto = {
        sku: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
        nombre: faker.commerce.productName(),
        descripcion: faker.commerce.productDescription(),
        precio: faker.number.int({ min: 1000, max: 90000 }),
      };
      const especificacion = {
        nombre: faker.commerce.productMaterial(),
        valor: faker.commerce.productAdjective(),
      };
      const manualUrl = faker.internet.url();
      const instalacionUrl = faker.internet.url();

      await user.type(screen.getByPlaceholderText("MED-001"), producto.sku);
      await user.type(
        screen.getByPlaceholderText("Nombre del producto"),
        producto.nombre
      );
      await user.type(
        screen.getByPlaceholderText("Descripción del producto"),
        producto.descripcion
      );
      await user.clear(screen.getByPlaceholderText("5000"));
      await user.type(
        screen.getByPlaceholderText("5000"),
        String(producto.precio)
      );

      await user.click(screen.getByRole("button", { name: /agregar/i }));
      const [nombreEspecificacion] = screen.getAllByPlaceholderText("Nombre");
      const [valorEspecificacion] = screen.getAllByPlaceholderText("Valor");
      await user.type(nombreEspecificacion, especificacion.nombre);
      await user.type(valorEspecificacion, especificacion.valor);

      await user.type(
        screen.getByPlaceholderText("https://ejemplo.com/manual.pdf"),
        manualUrl
      );
      await user.type(
        screen.getByPlaceholderText("https://ejemplo.com/instalacion.pdf"),
        instalacionUrl
      );

      const certCombobox = screen.getByRole("combobox");
      await user.click(certCombobox);
      const options = await screen.findAllByRole("option", { name: /invima/i });
      await user.click(options[0]);

      await user.click(screen.getByRole("button", { name: /crear/i }));

      await waitFor(() => expect(mockedCreateProducto).toHaveBeenCalledTimes(1));
      const [payload] = mockedCreateProducto.mock.calls[0];
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
});
