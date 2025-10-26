import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

vi.mock("@/services/informesComerciales.service", () => ({
  createInformeComercial: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { CreateInformeComercialForm } from "@/components/informeComercial/CreateInformeComercialForm";
import { createInformeComercial } from "@/services/informesComerciales.service";
import { toast } from "sonner";

const mockedCreateInformeComercial = vi.mocked(createInformeComercial);
const mockedToast = vi.mocked(toast);

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <CreateInformeComercialForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  utils.container.querySelector("form")?.setAttribute("novalidate", "true");
  return { onOpenChange, ...utils };
};

describe("CreateInformeComercialForm - Functional", () => {
  beforeEach(() => {
    mockedCreateInformeComercial.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    faker.seed(705);
  });

  it("permite ingresar un nombre válido y crear el informe", async () => {
    const user = userEvent.setup();
    setup();

    const nombre = faker.commerce.productName();
    const responseData = {
      id: faker.string.uuid(),
      nombre,
      fecha: faker.date.recent().toISOString(),
      ventasTotales: 75000.25,
      unidadesVendidas: 350.5,
    };

    mockedCreateInformeComercial.mockResolvedValue(responseData);

    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    await user.type(nombreInput, nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(mockedCreateInformeComercial).toHaveBeenCalled();
      expect(mockedCreateInformeComercial).toHaveBeenCalledWith(
        expect.objectContaining({ nombre }),
        expect.anything()
      );
      expect(mockedToast.success).toHaveBeenCalledWith(
        "Informe comercial creado exitosamente"
      );
    });

    // Verify indicators are displayed
    expect(await screen.findByText("Indicadores Clave")).toBeInTheDocument();
    expect(screen.getByText("Ventas Totales")).toBeInTheDocument();
    expect(screen.getByText("Unidades Vendidas")).toBeInTheDocument();
  });

  it("previene la creación cuando el nombre tiene solo 1 carácter", async () => {
    const user = userEvent.setup();
    setup();

    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    await user.type(nombreInput, "A");
    await user.click(screen.getByRole("button", { name: /crear/i }));

    expect(
      await screen.findByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeInTheDocument();
    expect(mockedCreateInformeComercial).not.toHaveBeenCalled();
  });

  it("acepta un nombre en el límite inferior de caracteres (2)", async () => {
    const user = userEvent.setup();
    setup();

    const nombre = "AB"; // Exactly 2 characters
    const responseData = {
      id: faker.string.uuid(),
      nombre,
      fecha: faker.date.recent().toISOString(),
      ventasTotales: 10000.0,
      unidadesVendidas: 100.0,
    };

    mockedCreateInformeComercial.mockResolvedValue(responseData);

    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    await user.type(nombreInput, nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(mockedCreateInformeComercial).toHaveBeenCalled();
      expect(mockedCreateInformeComercial).toHaveBeenCalledWith(
        expect.objectContaining({ nombre }),
        expect.anything()
      );
    });
  });

  it("muestra mensaje de error del servidor con formato adecuado", async () => {
    const user = userEvent.setup();
    setup();

    const nombre = faker.commerce.productName();
    const serverError = {
      detail: "Error interno del servidor: no se pudo calcular los indicadores",
      message: "Server Error",
    };

    mockedCreateInformeComercial.mockRejectedValue(serverError);

    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    await user.type(nombreInput, nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Error al crear informe comercial",
        expect.objectContaining({
          description: serverError.detail,
        })
      );
    });
  });

  it("permite reintentar la creación después de un error", async () => {
    const user = userEvent.setup();
    setup();

    const nombre = faker.commerce.productName();
    const successData = {
      id: faker.string.uuid(),
      nombre,
      fecha: faker.date.recent().toISOString(),
      ventasTotales: 50000.0,
      unidadesVendidas: 200.0,
    };

    // First attempt: error
    mockedCreateInformeComercial.mockRejectedValueOnce(
      new Error("Error de red")
    );

    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    await user.type(nombreInput, nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalled();
    });

    // Second attempt: success
    mockedCreateInformeComercial.mockResolvedValueOnce(successData);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalled();
      expect(screen.getByText("Indicadores Clave")).toBeInTheDocument();
    });
  });

  it("formatea correctamente los valores monetarios con dos decimales", async () => {
    const user = userEvent.setup();
    setup();

    const nombre = faker.commerce.productName();
    const responseData = {
      id: faker.string.uuid(),
      nombre,
      fecha: faker.date.recent().toISOString(),
      ventasTotales: 1234567.89,
      unidadesVendidas: 98765.43,
    };

    mockedCreateInformeComercial.mockResolvedValue(responseData);

    const nombreInput = screen.getByPlaceholderText("ej. IC-2025-Q1");
    await user.type(nombreInput, nombre);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(screen.getByText("Indicadores Clave")).toBeInTheDocument();
    });

    // Verify formatted numbers are displayed (COP format: 1.234.567,89)
    expect(screen.getByText(/1\.234\.567,89/)).toBeInTheDocument();
    expect(screen.getByText(/98\.765,43/)).toBeInTheDocument();
  });
});
