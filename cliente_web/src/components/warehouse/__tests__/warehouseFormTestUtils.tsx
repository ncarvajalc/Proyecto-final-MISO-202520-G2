import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";

import { ProductLocationForm } from "@/components/warehouse/ProductLocationForm";
import { ProductWarehouseLocationForm } from "@/components/warehouse/ProductWarehouseLocationForm";
import { getProductos } from "@/services/productos.service";
import {
  getBodegas,
  getProductLocation,
  getProductLocationInWarehouse,
} from "@/services/warehouse.service";
import { toast } from "sonner";

import { renderWithQueryClient } from "../../../../tests/test-utils";

vi.mock("@/services/productos.service", () => ({
  getProductos: vi.fn(),
}));

vi.mock("@/services/warehouse.service", () => ({
  getBodegas: vi.fn(),
  getProductLocation: vi.fn(),
  getProductLocationInWarehouse: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

const mockGetProductos = vi.mocked(getProductos);
const mockGetBodegas = vi.mocked(getBodegas);
const mockGetProductLocation = vi.mocked(getProductLocation);
const mockGetProductLocationInWarehouse = vi.mocked(getProductLocationInWarehouse);
const mockToast = vi.mocked(toast);

function buildProduct() {
  return {
    id: faker.string.uuid(),
    sku: faker.string.alphanumeric(6).toUpperCase(),
    nombre: faker.commerce.productName(),
    descripcion: faker.commerce.productDescription(),
    precio: Number(faker.commerce.price({ min: 100, max: 1000 })),
  };
}

function prepareCommonMocks(product: ReturnType<typeof buildProduct>) {
  mockGetProductos.mockResolvedValue({
    data: [
      {
        id: product.id,
        sku: product.sku,
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio: product.precio,
        activo: true,
      },
    ],
    total: 1,
    page: 1,
    limit: 1000,
    totalPages: 1,
  });
}

export function createProductWarehouseFormTestContext(seed = 42) {
  const state = {
    product: buildProduct(),
    warehouse: { id: faker.string.uuid(), nombre: faker.company.name() },
  };

  const initialize = () => {
    beforeEach(() => {
      vi.clearAllMocks();
      faker.seed(seed);

      state.product = buildProduct();
      state.warehouse = { id: faker.string.uuid(), nombre: faker.company.name() };

      prepareCommonMocks(state.product);
      mockGetBodegas.mockResolvedValue([state.warehouse]);
    });
  };

  const renderForm = (
    options?: { onOpenChange?: (open: boolean) => void }
  ) =>
    renderWithQueryClient(
      <ProductWarehouseLocationForm
        open={true}
        onOpenChange={options?.onOpenChange ?? vi.fn()}
      />
    );

  const getProduct = () => state.product;
  const getWarehouse = () => state.warehouse;

  const chooseOptions = async (user: ReturnType<typeof userEvent.setup>) => {
    const product = getProduct();
    const warehouse = getWarehouse();

    await user.click(await screen.findByRole("combobox", { name: "SKU" }));
    await user.click(await screen.findByText(`${product.sku} - ${product.nombre}`));
    await user.click(await screen.findByRole("combobox", { name: "Bodega" }));
    await user.click(await screen.findByText(warehouse.nombre));
  };

  return {
    initialize,
    renderForm,
    chooseOptions,
    getProduct,
    getWarehouse,
    mocks: {
      getProductos: mockGetProductos,
      getBodegas: mockGetBodegas,
      getProductLocation: mockGetProductLocationInWarehouse,
      toast: mockToast,
    },
  };
}

export function createProductLocationFormTestContext(seed = 9) {
  const state = {
    product: buildProduct(),
  };

  const initialize = () => {
    beforeEach(() => {
      vi.clearAllMocks();
      faker.seed(seed);

      state.product = buildProduct();

      prepareCommonMocks(state.product);
    });
  };

  const renderForm = (
    options?: { onOpenChange?: (open: boolean) => void }
  ) =>
    renderWithQueryClient(
      <ProductLocationForm
        open={true}
        onOpenChange={options?.onOpenChange ?? vi.fn()}
      />
    );

  const getProduct = () => state.product;

  const selectProduct = async (user: ReturnType<typeof userEvent.setup>) => {
    const product = getProduct();
    await user.click(await screen.findByRole("combobox"));
    await user.click(await screen.findByText(`${product.sku} - ${product.nombre}`));
  };

  return {
    initialize,
    renderForm,
    selectProduct,
    getProduct,
    mocks: {
      getProductos: mockGetProductos,
      getProductLocation: mockGetProductLocation,
      toast: mockToast,
    },
  };
}
