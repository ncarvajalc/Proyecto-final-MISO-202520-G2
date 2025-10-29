import { faker } from "@faker-js/faker";
import {
  expect,
  request,
  type APIRequestContext,
  type Page,
  type Response,
} from "@playwright/test";

export {
  API_GATEWAY_URL,
  loginAsAdmin,
  createProveedoresApi,
} from "./proveedores";

const WAREHOUSE_BASE_URL =
  process.env.WAREHOUSE_BASE_URL ?? "http://localhost:8003";

export type ProductPayload = {
  sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
  activo?: boolean;
  especificaciones?: Array<{ nombre: string; valor: string }>;
};

export type ProductResponse = ProductPayload & {
  id: string;
};

export type WarehousePayload = {
  nombre: string;
  ubicacion?: string | null;
};

export type WarehouseResponse = WarehousePayload & {
  id: string;
};

export type InventoryPayload = {
  warehouse_id: string;
  product_id: string;
  batch_number: string;
  quantity: number;
  storage_type: string;
  zona?: string | null;
  capacity?: number | null;
  expiration_date?: string | null;
};

export type InventoryResponse = InventoryPayload & {
  id: string;
};

export const buildProductPayload = (
  prefix: string,
  overrides: Partial<ProductPayload> = {}
): ProductPayload => {
  const base: ProductPayload = {
    sku: `${prefix}-${faker.string.alphanumeric({ length: 5, casing: "upper" })}`,
    nombre: `${prefix} ${faker.commerce.productName()}`,
    descripcion: faker.commerce.productDescription(),
    precio: faker.number.int({ min: 10000, max: 90000 }),
    activo: true,
    especificaciones: [
      {
        nombre: "Presentación",
        valor: faker.commerce.productMaterial(),
      },
    ],
  };

  return { ...base, ...overrides };
};

const mapProductResponse = (raw: unknown): ProductResponse => {
  const record = raw as Record<string, unknown>;
  const idValue = record.id;
  const sku = record.sku;
  const nombre = record.nombre ?? record.product_name;
  const descripcion = record.descripcion ?? record.description;
  const precioValue = record.precio ?? record.price;
  const activoValue = record.activo ?? record.is_active ?? true;

  if (!idValue) {
    throw new Error("Product response is missing id");
  }

  if (!sku || typeof sku !== "string") {
    throw new Error("Product response is missing sku");
  }

  if (!nombre || typeof nombre !== "string") {
    throw new Error("Product response is missing nombre");
  }

  if (!descripcion || typeof descripcion !== "string") {
    throw new Error("Product response is missing descripcion");
  }

  return {
    id: String(idValue),
    sku,
    nombre,
    descripcion,
    precio: Number(precioValue ?? 0),
    activo: Boolean(activoValue),
    especificaciones: Array.isArray(record.especificaciones)
      ? (record.especificaciones as Array<{ nombre: string; valor: string }>)
      : [],
  };
};

export const createWarehouseApi = async (): Promise<APIRequestContext> => {
  return request.newContext({
    baseURL: WAREHOUSE_BASE_URL,
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  });
};

export const createProductViaApi = async (
  api: APIRequestContext,
  payload: ProductPayload
): Promise<ProductResponse> => {
  const response = await api.post("/productos/", {
    data: {
      sku: payload.sku,
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      precio: payload.precio,
      activo: payload.activo ?? true,
      especificaciones: payload.especificaciones,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to create product (${response.status()}): ${body}`);
  }

  return mapProductResponse(await response.json());
};

export const createWarehouseViaApi = async (
  api: APIRequestContext,
  payload: WarehousePayload
): Promise<WarehouseResponse> => {
  const response = await api.post("/bodegas/", { data: payload });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to create warehouse (${response.status()}): ${body}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  const id = json.id;
  if (!id || typeof id !== "string") {
    throw new Error("Warehouse response missing id");
  }

  return {
    id,
    nombre: (json.nombre as string) ?? payload.nombre,
    ubicacion: (json.ubicacion as string | undefined) ?? payload.ubicacion ?? null,
  };
};

export const deleteWarehouseViaApi = async (
  api: APIRequestContext,
  warehouseId: string
) => {
  const response = await api.delete(`/bodegas/${warehouseId}`);
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to delete warehouse (${response.status()}): ${body}`);
  }
};

export const createInventoryViaApi = async (
  api: APIRequestContext,
  payload: InventoryPayload
): Promise<InventoryResponse> => {
  const response = await api.post("/inventario/", { data: payload });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to create inventory (${response.status()}): ${body}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  const id = json.id;
  if (!id || typeof id !== "string") {
    throw new Error("Inventory response missing id");
  }

  return {
    id,
    warehouse_id:
      (json.warehouse_id as string | undefined) ?? payload.warehouse_id,
    product_id:
      (json.product_id as string | undefined) ?? payload.product_id,
    batch_number:
      (json.batch_number as string | undefined) ?? payload.batch_number,
    quantity: Number(json.quantity ?? payload.quantity ?? 0),
    storage_type:
      (json.storage_type as string | undefined) ?? payload.storage_type,
    zona: (json.zona as string | undefined) ?? payload.zona ?? null,
    capacity: (json.capacity as number | undefined) ?? payload.capacity ?? null,
    expiration_date:
      (json.expiration_date as string | undefined) ?? payload.expiration_date ?? null,
  };
};

export const deleteInventoryViaApi = async (
  api: APIRequestContext,
  inventoryId: string
) => {
  const response = await api.delete(`/inventario/${inventoryId}`);
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to delete inventory (${response.status()}): ${body}`);
  }
};

const isProductosListResponse = (response: Response) => {
  if (response.request().method() !== "GET") {
    return false;
  }
  const url = new URL(response.url());
  return (
    url.pathname.endsWith("/productos/") &&
    url.searchParams.has("page") &&
    url.searchParams.has("limit")
  );
};

export const waitForProductosListResponse = async (
  page: Page,
  predicate?: (response: Response) => boolean
) => {
  return page.waitForResponse((response) => {
    if (!isProductosListResponse(response)) {
      return false;
    }
    return predicate ? predicate(response) : response.ok();
  });
};

export const gotoProductos = async (page: Page) => {
  await page.goto("./catalogos/productos");
};

export const openProductAvailabilityDialog = async (page: Page) => {
  const stockButton = page.getByRole("button", { name: /^Stock$/i });
  await expect(stockButton).toBeVisible();
  await stockButton.click();

  const stockDialog = page.getByRole("dialog", { name: /Consultas de Stock/i });
  await expect(stockDialog).toBeVisible();

  const availabilityButton = stockDialog.getByRole("button", {
    name: /Disponibilidad en bodega/i,
  });
  await expect(availabilityButton).toBeVisible();
  await availabilityButton.click();

  const availabilityDialog = page.getByRole("dialog", {
    name: /Disponibilidad en bodega/i,
  });
  await expect(availabilityDialog).toBeVisible();
  return availabilityDialog;
};

const isProductLocationRequest = (url: URL) =>
  (url.pathname.endsWith("/productos/localizacion/") ||
    url.pathname.endsWith("/productos/localizacion")) &&
  !url.pathname.includes("localizacion-bodega");

export const waitForProductLocationResponse = (
  page: Page,
  _sku: string
) => {
  const responsePromise = page.waitForResponse((response) => {
    if (response.request().method() !== "GET") {
      return false;
    }

    const url = new URL(response.url());
    if (!isProductLocationRequest(url)) {
      return false;
    }

    if (response.status() === 307) {
      return false;
    }

    return true;
  });

  const failurePromise = page
    .waitForEvent("requestfailed", (request) => {
      if (request.method() !== "GET") {
        return false;
      }

      const url = new URL(request.url());
      return isProductLocationRequest(url);
    })
    .then((request) => {
      const failure = request.failure();
      const message = failure?.errorText ?? "unknown error";
      throw new Error(`Product location request failed: ${message}`);
    });

  return Promise.race([responsePromise, failurePromise]);
};
