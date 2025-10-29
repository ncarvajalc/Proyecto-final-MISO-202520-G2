import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

import {
  buildProductPayload,
  createInventoryViaApi,
  createProductViaApi,
  createWarehouseApi,
  createWarehouseViaApi,
  deleteInventoryViaApi,
  deleteWarehouseViaApi,
  gotoProductos,
  openProductAvailabilityDialog,
  waitForProductLocationResponse,
  waitForProductosListResponse,
  type InventoryResponse,
  type ProductResponse,
  type WarehouseResponse,
  loginAsAdmin,
  createProveedoresApi,
} from "./utils/productos";

import { waitForToastWithText } from "./utils/routes";

const ensureAuthStorage = async (
  page: Page,
  token: string,
  payload: { user: unknown; permissions: string[] }
) => {
  await page.addInitScript(
    ([storedToken, storedPayload]) => {
      localStorage.setItem("auth_token", storedToken as string);
      localStorage.setItem("user_data", JSON.stringify(storedPayload));
    },
    [token, payload]
  );
};

const ZONE_CODE = "Z1-07";
const SEED_PREFIX = `HUP010-${Date.now().toString(36).toUpperCase()}`;

test.describe.serial("HUP-010 Localización de productos", () => {
  let adminToken: string;
  let storagePayload: { user: unknown; permissions: string[] };
  let purchasesApi: APIRequestContext;
  let warehouseApi: APIRequestContext;
  let warehouse: WarehouseResponse;
  let productWithStock: ProductResponse;
  let productWithoutStock: ProductResponse;
  let inventoryRecord: InventoryResponse;

  test.beforeAll(async () => {
    const auth = await loginAsAdmin();
    adminToken = auth.token;
    storagePayload = auth.storagePayload;

    purchasesApi = await createProveedoresApi(adminToken);
    warehouseApi = await createWarehouseApi();

    warehouse = await createWarehouseViaApi(warehouseApi, {
      nombre: `${SEED_PREFIX}-Bodega Principal`,
      ubicacion: "Bogotá",
    });

    productWithStock = await createProductViaApi(
      purchasesApi,
      buildProductPayload(`${SEED_PREFIX}-STOCK`)
    );

    productWithoutStock = await createProductViaApi(
      purchasesApi,
      buildProductPayload(`${SEED_PREFIX}-NO-STOCK`)
    );

    inventoryRecord = await createInventoryViaApi(warehouseApi, {
      warehouse_id: warehouse.id,
      product_id: productWithStock.sku,
      batch_number: `${SEED_PREFIX}-BATCH-001`,
      quantity: 42,
      storage_type: "general",
      zona: ZONE_CODE,
    });
  });

  test.afterAll(async () => {
    if (warehouseApi) {
      if (inventoryRecord) {
        await deleteInventoryViaApi(warehouseApi, inventoryRecord.id);
      }
      if (warehouse) {
        await deleteWarehouseViaApi(warehouseApi, warehouse.id);
      }
      await warehouseApi.dispose();
    }

    if (purchasesApi) {
      await purchasesApi.dispose();
    }
  });

  test.beforeEach(async ({ page }) => {
    if (!adminToken) {
      throw new Error("Authentication bootstrap failed");
    }

    await ensureAuthStorage(page, adminToken, storagePayload);
  });

  test("Localiza un producto disponible y muestra la bodega correspondiente", async ({
    page,
  }) => {
    const listResponsePromise = waitForProductosListResponse(page);
    await gotoProductos(page);
    await listResponsePromise;

    const dialog = await openProductAvailabilityDialog(page);
    const consultarButton = dialog.getByRole("button", { name: "Consultar" });
    await expect(consultarButton).toBeDisabled();

    await dialog.getByLabel("SKU").click();
    await page
      .getByRole("option", {
        name: new RegExp(productWithStock.sku, "i"),
      })
      .click();

    await expect(consultarButton).toBeEnabled();

    const locationResponsePromise = waitForProductLocationResponse(
      page,
      productWithStock.sku
    );
    await consultarButton.click();

    const locationResponse = await locationResponsePromise;
    expect(locationResponse.ok()).toBeTruthy();

    await waitForToastWithText(
      page,
      `Producto localizado en ${warehouse.nombre}, zona ${ZONE_CODE}`
    );

    await expect(
      dialog.getByText("Su producto se encuentra en la bodega:")
    ).toBeVisible();
    await expect(dialog.getByText(warehouse.nombre)).toBeVisible();
    await expect(dialog.getByText(ZONE_CODE)).toBeVisible();

    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await dialog.waitFor({ state: "hidden" });
  });

  test("Informa cuando un producto no tiene disponibilidad en ninguna bodega", async ({
    page,
  }) => {
    const listResponsePromise = waitForProductosListResponse(page);
    await gotoProductos(page);
    await listResponsePromise;

    const dialog = await openProductAvailabilityDialog(page);

    await dialog.getByLabel("SKU").click();
    await page
      .getByRole("option", {
        name: new RegExp(productWithoutStock.sku, "i"),
      })
      .click();

    const consultarButton = dialog.getByRole("button", { name: "Consultar" });

    const locationResponsePromise = waitForProductLocationResponse(
      page,
      productWithoutStock.sku
    );
    await consultarButton.click();
    const locationResponse = await locationResponsePromise;
    expect(locationResponse.ok()).toBeTruthy();

    await waitForToastWithText(page, "Producto no localizado en ninguna bodega");

    await expect(
      dialog.getByText("Producto no localizado en ninguna bodega")
    ).toBeVisible();

    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await dialog.waitFor({ state: "hidden" });
  });
});
