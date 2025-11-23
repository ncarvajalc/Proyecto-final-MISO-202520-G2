import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  type APIRequestContext,
  type Download,
  type Locator,
  type Page,
} from "@playwright/test";

import type { BulkUploadResponse } from "../../src/types/proveedor";
import {
  API_GATEWAY_URL,
  CSV_HEADERS,
  ITEMS_PER_PAGE,
  buildCsvFromPayloads,
  buildSupplierPayload,
  createProveedoresApi,
  ensureRowVisible,
  fetchSupplierList,
  goToPage,
  gotoProveedores,
  loginAsAdmin,
  trackProveedoresRequests,
  waitForListResponse,
} from "./utils/proveedores";
import type { SupplierPayload } from "./utils/proveedores";

const BULK_UPLOAD_ENDPOINT = `${API_GATEWAY_URL}/proveedores/bulk-upload`;
const CSV_MIME_TYPE = "text/csv";

const assertDialogFocusTrap = async (page: Page) => {
  const isFocusInside = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return false;
    const active = document.activeElement;
    return !!active && dialog.contains(active);
  });
  expect(isFocusInside).toBeTruthy();
};

const cycleDialogFocusWithKeyboard = async (page: Page) => {
  await page.keyboard.press("Tab");
  const after = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return null;
    const active = document.activeElement;
    return active && dialog.contains(active);
  });
  expect(after).toBeTruthy();
  await page.keyboard.press("Shift+Tab");
  const final = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return null;
    const active = document.activeElement;
    return active && dialog.contains(active);
  });
  expect(final).toBeTruthy();
};

const readDownload = async (download: Download) => {
  const stream = await download.createReadStream();
  if (!stream) {
    throw new Error("Unable to read download stream");
  }
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
};

const attachCsvFile = async (
  input: Locator,
  payloads: SupplierPayload[],
  options: { filename?: string; mimeType?: string; rawCsv?: string } = {}
) => {
  const csv = options.rawCsv ?? buildCsvFromPayloads(payloads);
  const filename = options.filename ?? "bulk-proveedores.csv";
  const mimeType = options.mimeType ?? CSV_MIME_TYPE;
  await input.setInputFiles({
    name: filename,
    mimeType,
    buffer: Buffer.from(csv, "utf-8"),
  });
  return { csv, filename, mimeType };
};

const waitForBulkUploadResponse = (page: Page) =>
  page.waitForResponse(
    (response) =>
      response.url().startsWith(BULK_UPLOAD_ENDPOINT) &&
      response.request().method() === "POST"
  );

// TODO: Restore bulk provider e2e coverage when backend services are reachable.
test.skip(true, "TODO: Restore bulk provider e2e when backend is accessible.");
test.describe.serial("HUP-002 Registro masivo de proveedores", () => {
  let adminToken: string;
  let proveedoresApi: APIRequestContext;
  let storagePayload: { user: unknown; permissions: string[] };

  test.beforeAll(async () => {
    faker.seed(202510);
    const auth = await loginAsAdmin();
    adminToken = auth.token;
    storagePayload = auth.storagePayload;
    proveedoresApi = await createProveedoresApi(adminToken);
  });

  test.afterAll(async () => {
    await proveedoresApi?.dispose();
  });

  test.beforeEach(async ({ page }) => {
    if (!adminToken) {
      throw new Error("Authentication bootstrap failed");
    }

    await page.addInitScript(
      ([token, payload]) => {
        localStorage.setItem("auth_token", token as string);
        localStorage.setItem("user_data", JSON.stringify(payload));
      },
      [adminToken, storagePayload]
    );
  });

  test("Abre el modal de carga masiva con focus inicial y estado de controles", async ({
    page,
  }) => {
    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForListResponse(page, 1);
    await gotoProveedores(page);
    await initialResponse;

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    await expect(dialog).toBeVisible();

    await assertDialogFocusTrap(page);
    await cycleDialogFocusWithKeyboard(page);

    await expect(
      dialog.getByText(
        "Cargue un archivo csv con la información de los proveedores que desee cargar.",
        { exact: false }
      )
    ).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "1. Descargar plantilla" })).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "2. Subir plantilla" })).toBeVisible();

    const fileInput = dialog.locator("input[type='file'][accept='.csv']");
    await expect(fileInput).toHaveAttribute("accept", ".csv");
    const submitButton = dialog.locator("button[type='submit']");
    await expect(submitButton).toBeDisabled();
    await expect(dialog.getByText("Archivo seleccionado", { exact: false })).toHaveCount(0);

    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Descarga la plantilla CSV y notifica al usuario", async ({ page }) => {
    const initialResponse = waitForListResponse(page, 1);
    await gotoProveedores(page);
    await initialResponse;

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });

    const downloadPromise = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Descargar plantilla" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("plantilla_proveedores.csv");

    const csvContent = await readDownload(download);
    const rows = csvContent.trim().split(/\r?\n/);
    expect(rows[0].split(",")).toEqual(CSV_HEADERS);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const row of rows.slice(1)) {
      expect(row.split(",").length).toBe(CSV_HEADERS.length);
    }

    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Plantilla descargada" })
      .first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Revisa tu carpeta de descargas");
  });

  test("Rechaza archivos que no sean CSV sin emitir solicitudes", async ({ page }) => {
    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForListResponse(page, 1);
    await gotoProveedores(page);
    await initialResponse;

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });

    await attachCsvFile(
      dialog.locator("input[type='file'][accept='.csv']"),
      [buildSupplierPayload("Archivo Invalido")],
      { filename: "malicioso.txt", mimeType: "text/plain" }
    );

    const errorToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Archivo inválido" })
      .first();
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText("Solo se permiten archivos CSV");

    await expect(dialog.getByText("Archivo seleccionado", { exact: false })).toHaveCount(0);
    await expect(dialog.locator("button[type='submit']")).toBeDisabled();

    expect(
      tracker.getCount("POST", ({ request }) =>
        request.url().startsWith(BULK_UPLOAD_ENDPOINT)
      )
    ).toBe(0);
    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Impide enviar sin archivo seleccionado", async ({ page }) => {
    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForListResponse(page, 1);
    await gotoProveedores(page);
    await initialResponse;

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });

    const submitButton = dialog.locator("button[type='submit']");
    await expect(submitButton).toBeDisabled();

    expect(
      tracker.getCount("POST", ({ request }) =>
        request.url().startsWith(BULK_UPLOAD_ENDPOINT)
      )
    ).toBe(0);
    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Cancelar restablece el estado y no emite solicitudes", async ({ page }) => {
    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForListResponse(page, 1);
    await gotoProveedores(page);
    await initialResponse;

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });

    await attachCsvFile(dialog.locator("input[type='file'][accept='.csv']"), [
      buildSupplierPayload("CSV Cancel"),
    ]);

    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const reopened = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    await expect(reopened.getByText("Archivo seleccionado", { exact: false })).toHaveCount(0);
    await expect(reopened.locator("button[type='submit']")).toBeDisabled();

    expect(
      tracker.getCount("POST", ({ request }) =>
        request.url().startsWith(BULK_UPLOAD_ENDPOINT)
      )
    ).toBe(0);
    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Carga masiva exitosa sin observaciones (backend real)", async ({ page }) => {
    const tracker = trackProveedoresRequests(page);
    const beforeSnapshot = await fetchSupplierList(proveedoresApi, {
      page: 1,
      limit: ITEMS_PER_PAGE,
    });

    const initialResponse = waitForListResponse(page, 1);
    await gotoProveedores(page);
    await initialResponse;

    const payload = buildSupplierPayload("CSV Success", {
      nombre: `CSV Success ${Date.now()}`,
      estado: "Activo",
    });

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    await attachCsvFile(dialog.locator("input[type='file'][accept='.csv']"), [payload], {
      filename: "bulk-success.csv",
    });

    const bulkResponsePromise = waitForBulkUploadResponse(page);
    await dialog.locator("button[type='submit']").click();

    const bulkResponse = await bulkResponsePromise;
    expect(bulkResponse.ok()).toBeTruthy();
    const bulkJson = (await bulkResponse.json()) as BulkUploadResponse;

    expect(bulkJson.success).toBeTruthy();
    expect(bulkJson.summary.failed).toBe(0);
    expect(bulkJson.summary.succeeded).toBeGreaterThanOrEqual(1);

    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Carga masiva exitosa" })
      .first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("proveedores creados, 0 con errores");

    const created = bulkJson.createdSuppliers ?? [];
    expect(created.length).toBeGreaterThan(0);

    const afterTotal = beforeSnapshot.total + created.length;
    const lastPage = Math.max(1, Math.ceil(afterTotal / ITEMS_PER_PAGE));

<<<<<<< HEAD
    await goToPage(page, 1, lastPage);
=======
    let currentPage = 1;
    currentPage = await goToPage(page, currentPage, lastPage);
>>>>>>> main

    for (const supplier of created) {
      await ensureRowVisible(page, supplier.nombre);
    }

    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Carga masiva con observaciones conserva errores del backend", async ({ page }) => {
    const tracker = trackProveedoresRequests(page);
    const beforeSnapshot = await fetchSupplierList(proveedoresApi, {
      page: 1,
      limit: ITEMS_PER_PAGE,
    });

    const initialResponse = waitForListResponse(page, 1);
    await gotoProveedores(page);
    await initialResponse;

    const validPayload = buildSupplierPayload("CSV Parcial", {
      nombre: `CSV Parcial ${Date.now()}`,
    });
    const invalidPayload = buildSupplierPayload("CSV Parcial", {
      correo: "correo-invalido",
      nombre: `CSV Parcial Error ${Date.now()}`,
    });

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    await attachCsvFile(dialog.locator("input[type='file'][accept='.csv']"), [
      validPayload,
      invalidPayload,
    ]);

    const bulkResponsePromise = waitForBulkUploadResponse(page);
    await dialog.locator("button[type='submit']").click();

    const bulkResponse = await bulkResponsePromise;
    expect(bulkResponse.status()).toBe(201);
    const bulkJson = (await bulkResponse.json()) as BulkUploadResponse;

    expect(bulkJson.summary.failed).toBeGreaterThan(0);
    expect(bulkJson.summary.succeeded).toBeGreaterThan(0);

    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Carga masiva con observaciones" })
      .first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(
      `${bulkJson.summary.succeeded} proveedores creados y ${bulkJson.summary.failed} con errores.`
    );

    const created = bulkJson.createdSuppliers ?? [];
    expect(created.length).toBe(bulkJson.summary.succeeded);

    const afterTotal = beforeSnapshot.total + created.length;
    const lastPage = Math.max(1, Math.ceil(afterTotal / ITEMS_PER_PAGE));

<<<<<<< HEAD
    await goToPage(page, 1, lastPage);
=======
    let currentPage = 1;
    currentPage = await goToPage(page, currentPage, lastPage);
>>>>>>> main
    for (const supplier of created) {
      await ensureRowVisible(page, supplier.nombre);
    }

    await expect(
      page.getByRole("row", { name: new RegExp(invalidPayload.nombre) })
    ).toHaveCount(0);

    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Muestra errores del backend y preserva el archivo seleccionado", async ({
    page,
  }) => {
    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForListResponse(page, 1);
    await gotoProveedores(page);
    await initialResponse;

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });

    const malformedCsv = "nombre,correo\nSoloNombre";
    const { filename } = await attachCsvFile(
      dialog.locator("input[type='file'][accept='.csv']"),
      [],
      { filename: "bulk-error.csv", rawCsv: malformedCsv }
    );

    const bulkResponsePromise = waitForBulkUploadResponse(page);
    await dialog.locator("button[type='submit']").click();

    const bulkResponse = await bulkResponsePromise;
    expect(bulkResponse.status()).toBe(400);

    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Error en carga masiva" })
      .first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("encabezados obligatorios");

    await expect(dialog).toBeVisible();
    await expect(dialog.locator("button[type='submit']")).not.toBeDisabled();
    await expect(
      dialog.getByText("Archivo seleccionado", { exact: false })
    ).toContainText(filename);

    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Normaliza estados y certificados devueltos por el backend", async ({
    page,
  }) => {
    const tracker = trackProveedoresRequests(page);
    const beforeSnapshot = await fetchSupplierList(proveedoresApi, {
      page: 1,
      limit: ITEMS_PER_PAGE,
    });

    const initialResponse = waitForListResponse(page, 1);
    await gotoProveedores(page);
    await initialResponse;

    const certificationIssued = faker.date.past({ years: 1 });
    const certificationExpiry = faker.date.future({ years: 1, refDate: certificationIssued });
    const payload = buildSupplierPayload("CSV Alias", {
      nombre: `CSV Alias ${Date.now()}`,
      estado: "Activo",
      certificado: {
        nombre: faker.company.buzzPhrase(),
        cuerpoCertificador: faker.company.name(),
        fechaCertificacion: certificationIssued.toISOString().slice(0, 10),
        fechaVencimiento: certificationExpiry.toISOString().slice(0, 10),
        urlDocumento: faker.internet.url(),
      },
    });

    const aliasedRow = {
      ...payload,
      estado: "inactive" as unknown as SupplierPayload["estado"],
    };

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    const { filename } = await attachCsvFile(
      dialog.locator("input[type='file'][accept='.csv']"),
      [aliasedRow],
      { filename: "bulk-alias.csv" }
    );

    const bulkResponsePromise = waitForBulkUploadResponse(page);
    await dialog.locator("button[type='submit']").click();

    const bulkResponse = await bulkResponsePromise;
    expect(bulkResponse.ok()).toBeTruthy();
    const bulkJson = (await bulkResponse.json()) as BulkUploadResponse;

    expect(bulkJson.file.filename).toBe(filename);
    expect(bulkJson.summary.failed).toBe(0);
    expect(bulkJson.createdSuppliers[0]?.estado).toBe("Inactivo");

    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Carga masiva exitosa" })
      .first();
    await expect(toast).toBeVisible();

    const created = bulkJson.createdSuppliers ?? [];
    const afterTotal = beforeSnapshot.total + created.length;
    const lastPage = Math.max(1, Math.ceil(afterTotal / ITEMS_PER_PAGE));

<<<<<<< HEAD
    await goToPage(page, 1, lastPage);
=======
    let currentPage = 1;
    currentPage = await goToPage(page, currentPage, lastPage);
>>>>>>> main

    await ensureRowVisible(page, payload.nombre);
    const row = page.getByRole("row", { name: new RegExp(payload.nombre) });
    await expect(row).toContainText("Inactivo");

    tracker.assertAllAuthorized();
    tracker.stop();
  });
});
