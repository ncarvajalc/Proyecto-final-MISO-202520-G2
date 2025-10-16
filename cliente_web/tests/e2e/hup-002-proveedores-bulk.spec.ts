import {
  expect,
  test,
  type APIRequestContext,
  type Download,
  type Locator,
  type Page,
  type Request,
  type Route,
} from "@playwright/test";
import { faker } from "@faker-js/faker";
import type { BulkUploadResponse, BulkUploadRow } from "../../src/types/proveedor";
import {
  buildCsvFromPayloads,
  buildSupplierPayload,
  createProveedoresApi,
  CSV_HEADERS,
  ensureRowVisible,
  gotoProveedores,
  ITEMS_PER_PAGE,
  loginAsAdmin,
  API_GATEWAY_URL,
  seedSuppliers,
  trackProveedoresRequests,
  waitForAnyListResponse,
  waitForListResponse,
} from "./utils/proveedores";
import type {
  SupplierListResponse,
  SupplierPayload,
  SupplierResponse,
} from "./utils/proveedores";

const SEED_PREFIX = `HUP002-${Date.now()}`;
const BULK_UPLOAD_ENDPOINT = `${API_GATEWAY_URL}/proveedores/bulk-upload`;
const REAL_SMOKE_FLAG = process.env.E2E_RUN_SMOKE_BULK === "true";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

const createDeferred = <T = void>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

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

const readDownload = async (download: Download): Promise<string> => {
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

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const parseCsvContent = (content: string): {
  headers: string[];
  records: Record<string, string>[];
} => {
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n").filter((line) => line.length > 0);
  if (lines.length === 0) {
    return { headers: [], records: [] };
  }
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => parseCsvLine(line));
  const mapped = rows.map((values) => {
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] ?? "";
    });
    return record;
  });

  return { headers, records: mapped };
};

const toBulkUploadRow = (record: Record<string, string>): BulkUploadRow => {
  const certificadoNombre = record["certificadoNombre"] ?? "";
  const certificadoCuerpo = record["certificadoCuerpo"] ?? "";
  const certificadoFechaCertificacion =
    record["certificadoFechaCertificacion"] ?? "";
  const certificadoFechaVencimiento =
    record["certificadoFechaVencimiento"] ?? "";
  const certificadoUrl = record["certificadoUrl"] ?? "";
  const hasCertificado =
    !!certificadoNombre ||
    !!certificadoCuerpo ||
    !!certificadoFechaCertificacion ||
    !!certificadoFechaVencimiento ||
    !!certificadoUrl;

  return {
    nombre: record["nombre"] ?? "",
    id_tax: record["id_tax"] ?? "",
    direccion: record["direccion"] ?? "",
    telefono: record["telefono"] ?? "",
    correo: record["correo"] ?? "",
    contacto: record["contacto"] ?? "",
    estado: record["estado"] ?? "",
    certificado: hasCertificado
      ? {
          nombre: certificadoNombre,
          cuerpoCertificador: certificadoCuerpo,
          fechaCertificacion: certificadoFechaCertificacion,
          fechaVencimiento: certificadoFechaVencimiento,
          urlDocumento: certificadoUrl,
        }
      : null,
  };
};

type ParsedMultipartCsv = {
  filename: string;
  contentType: string;
  content: string;
  headers: string[];
  records: Record<string, string>[];
  rows: BulkUploadRow[];
};

const parseMultipartCsv = (request: Request): ParsedMultipartCsv => {
  const headers = request.headers();
  const contentType = headers["content-type"] ?? "";
  expect(contentType).toContain("multipart/form-data");
  const boundaryMatch = contentType.match(/boundary="?([^";]+)"?/);
  expect(boundaryMatch).toBeTruthy();
  const boundary = boundaryMatch![1];
  const buffer = request.postDataBuffer();
  expect(buffer).toBeTruthy();
  const raw = buffer!.toString("utf-8");
  const delimiter = `--${boundary}`;
  const parts = raw.split(delimiter);
  for (const part of parts) {
    if (!part.includes("name=\"file\"")) continue;
    const trimmedPart = part.replace(/^\r?\n/, "").replace(/\r?\n--\s*$/, "");
    const [headersPart, ...bodyParts] = trimmedPart.split(/\r?\n\r?\n/);
    if (!headersPart || bodyParts.length === 0) continue;
    const bodyPart = bodyParts.join("\r\n\r\n");
    const filenameMatch = headersPart.match(/filename=\"([^\"]*)\"/);
    const fileContentTypeMatch = headersPart.match(/Content-Type:\s*([^\r\n]+)/i);
    const filename = (filenameMatch?.[1] ?? "uploaded.csv").trim() || "uploaded.csv";
    const fileContentType = (fileContentTypeMatch?.[1] ?? "text/csv").trim();
    const cleaned = bodyPart
      .replace(new RegExp(`\r?\n${delimiter}--?\s*$`), "")
      .replace(/\r?\n--$/, "")
      .replace(/\r?\n$/, "");
    const normalized = cleaned.replace(/\r\n/g, "\n");
    const { headers: csvHeaders, records } = parseCsvContent(normalized);
    const rows = records.map(toBulkUploadRow);
    return {
      filename,
      contentType: fileContentType,
      content: normalized,
      headers: csvHeaders,
      records,
      rows,
    };
  }
  throw new Error("File part not found in multipart payload");
};

const attachCsvFile = async (
  input: Locator,
  payloads: SupplierPayload[],
  options: { filename?: string; mimeType?: string } = {}
) => {
  const csv = buildCsvFromPayloads(payloads);
  const filename = options.filename ?? "bulk-proveedores.csv";
  const mimeType = options.mimeType ?? "text/csv";
  await input.setInputFiles({
    name: filename,
    mimeType,
    buffer: Buffer.from(csv, "utf-8"),
  });
  return { csv, filename, mimeType };
};

type ListRouteController = {
  getCalls: () => Request[];
  dispose: () => Promise<void>;
};

const fulfillList = async (
  data: SupplierResponse[],
  pageNumber = 1
) => {
  const responsePayload: SupplierListResponse = {
    data,
    total: data.length,
    page: pageNumber,
    limit: ITEMS_PER_PAGE,
    totalPages: Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE)),
  };

  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(responsePayload),
  } satisfies Parameters<Route["fulfill"]>[0];
};

const setupSupplierListStub = async (
  page: Page,
  resolver: (request: Request) => SupplierResponse[] | Promise<SupplierResponse[]>
): Promise<ListRouteController> => {
  const calls: Request[] = [];
  const handler = async (route: Route) => {
    const request = route.request();
    if (request.method() !== "GET") {
      await route.continue();
      return;
    }
    calls.push(request);
    const data = await resolver(request);
    await route.fulfill(await fulfillList(data));
  };

  await page.route("**/proveedores?*", handler);

  return {
    getCalls: () => [...calls],
    dispose: async () => {
      await page.unroute("**/proveedores?*", handler);
    },
  };
};

type BulkUploadResponder = (args: {
  request: Request;
  csv: ParsedMultipartCsv;
  respond: (payload: Parameters<Route["fulfill"]>[0]) => Promise<void>;
}) => Promise<void> | void;

const setupBulkUploadInterceptor = async (
  page: Page,
  responder: BulkUploadResponder
) => {
  const deferred = createDeferred<void>();
  const requestCaptured = createDeferred<void>();
  let released = false;
  const handler = async (route: Route) => {
    const request = route.request();
    if (request.method() !== "POST") {
      await route.continue();
      return;
    }
    const parsed = parseMultipartCsv(request);
    requestCaptured.resolve();
    await responder({
      request,
      csv: parsed,
      respond: async (payload) => {
        await deferred.promise;
        await route.fulfill(payload);
      },
    });
  };

  await page.route("**/proveedores/bulk-upload", handler);

  return {
    allowFulfill: () => {
      if (!released) {
        released = true;
        deferred.resolve();
      }
    },
    waitForRequest: () => requestCaptured.promise,
    dispose: async () => {
      await page.unroute("**/proveedores/bulk-upload", handler);
    },
  };
};

test.describe.serial("HUP-002 Registro masivo de proveedores", () => {
  let adminToken: string;
  let proveedoresApi: APIRequestContext;
  let storagePayload: { user: unknown; permissions: string[] };
  const seededSupplierIds: number[] = [];
  let listStub: ListRouteController | null = null;

  test.beforeAll(async () => {
    faker.seed(202509);
    const auth = await loginAsAdmin();
    adminToken = auth.token;
    storagePayload = auth.storagePayload;
    proveedoresApi = await createProveedoresApi(adminToken);
    const seeded = await seedSuppliers(proveedoresApi, SEED_PREFIX, 3);
    seededSupplierIds.push(...seeded);
  });

  test.afterAll(async () => {
    await proveedoresApi?.dispose();
  });

  test.afterEach(async () => {
    if (listStub) {
      await listStub.dispose();
      listStub = null;
    }
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

  test("Abre el modal de carga masiva con focus inicial y estado de controles", async ({ page }) => {
    let currentData: SupplierResponse[] = [];
    listStub = await setupSupplierListStub(page, () => currentData);

    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForAnyListResponse(page);
    await gotoProveedores(page);
    await initialResponse;

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    await expect(dialog).toBeVisible();

    await assertDialogFocusTrap(page);
    await cycleDialogFocusWithKeyboard(page);

    await expect(
      dialog.getByText(
        "Cargue un archivo csv con la información de los proveedores que desee cargar. Descargue la plantilla y súbala con los datos llenos.",
        { exact: false }
      )
    ).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "1. Descargar plantilla" })).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "2. Subir plantilla" })).toBeVisible();

    const fileInput = dialog.locator('input[type="file"][accept=".csv"]');
    await expect(fileInput).toHaveAttribute("accept", ".csv");
    const submitButton = dialog.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
    await expect(dialog.getByText("Archivo seleccionado", { exact: false })).toHaveCount(0);

    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Descarga la plantilla CSV y notifica al usuario", async ({ page }) => {
    let currentData: SupplierResponse[] = [];
    listStub = await setupSupplierListStub(page, () => currentData);

    await gotoProveedores(page);
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
      .locator('[data-sonner-toast]')
      .filter({ hasText: "Plantilla descargada" })
      .first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Revisa tu carpeta de descargas");
  });

  test("Rechaza archivos que no sean CSV sin emitir solicitudes", async ({ page }) => {
    let currentData: SupplierResponse[] = [];
    listStub = await setupSupplierListStub(page, () => currentData);

    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForAnyListResponse(page);
    await gotoProveedores(page);
    await initialResponse;
    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });

    await attachCsvFile(
      dialog.locator('input[type="file"][accept=".csv"]'),
      [buildSupplierPayload("Archivo Invalido")],
      { filename: "malicioso.txt", mimeType: "text/plain" }
    );

    const errorToast = page
      .locator('[data-sonner-toast]')
      .filter({ hasText: "Archivo inválido" })
      .first();
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText("Solo se permiten archivos CSV");

    await expect(dialog.getByText("Archivo seleccionado", { exact: false })).toHaveCount(0);
    await expect(dialog.locator('button[type="submit"]')).toBeDisabled();

    expect(
      tracker.getCount("POST", ({ request }) =>
        request.url().startsWith(BULK_UPLOAD_ENDPOINT)
      )
    ).toBe(0);
    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Impide enviar sin archivo seleccionado", async ({ page }) => {
    let currentData: SupplierResponse[] = [];
    listStub = await setupSupplierListStub(page, () => currentData);

    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForAnyListResponse(page);
    await gotoProveedores(page);
    await initialResponse;
    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });

    const submitButton = dialog.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();

    expect(
      tracker.getCount("POST", ({ request }) =>
        request.url().startsWith(BULK_UPLOAD_ENDPOINT)
      )
    ).toBe(0);
    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Carga masiva exitosa sin observaciones (mock backend)", async ({ page }) => {
    const existing: SupplierResponse[] = Array.from({ length: 2 }, (_, index) => ({
      id: seededSupplierIds[index] ?? index + 1,
      ...buildSupplierPayload(`${SEED_PREFIX}-seed-${index + 1}`),
    }));
    let currentData = [...existing];

    listStub = await setupSupplierListStub(page, () => currentData);

    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForAnyListResponse(page);
    await gotoProveedores(page);
    await initialResponse;

    const newSuppliers: SupplierPayload[] = [
      buildSupplierPayload("CSV Success", {
        nombre: "Proveedor CSV Exitoso",
        correo: "csv-exitoso@example.com",
      }),
    ];
    const expectedCsv = buildCsvFromPayloads(newSuppliers).replace(/\r\n/g, "\n");

    let lastResponse: BulkUploadResponse | null = null;
    const interceptor = await setupBulkUploadInterceptor(page, async ({ request, csv, respond }) => {
      expect(request.method()).toBe("POST");
      expect(request.headers()["authorization"]).toMatch(/^Bearer\s.+/);
      expect(csv.filename).toMatch(/\.csv$/);
      expect(csv.contentType).toBe("text/csv");
      expect(csv.headers).toEqual(CSV_HEADERS);
      expect(csv.content.trim()).toBe(expectedCsv.trim());
      expect(csv.rows).toHaveLength(newSuppliers.length);
      csv.rows.forEach((row, index) => {
        expect(row.nombre).toBe(newSuppliers[index].nombre);
        expect(row.id_tax).toBe(newSuppliers[index].id_tax);
      });
      expect(csv.records[0]["estado"]).toBe(newSuppliers[0].estado);

      const summary = {
        totalRows: newSuppliers.length,
        processedRows: newSuppliers.length,
        succeeded: newSuppliers.length,
        failed: 0,
      };
      const created: SupplierResponse[] = newSuppliers.map((supplier, index) => ({
        id: 9000 + index,
        ...supplier,
      }));
      currentData = [...created, ...existing];

      const response: BulkUploadResponse = {
        success: true,
        message: `${newSuppliers.length} proveedores creados exitosamente`,
        file: {
          filename: csv.filename,
          contentType: csv.contentType,
          rows: csv.rows,
        },
        summary,
        errors: [],
        createdSuppliers: created,
      };

      lastResponse = response;
      await respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    });

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    const fileInput = dialog.locator('input[type="file"][accept=".csv"]');
    const { filename: attachedFilename } = await attachCsvFile(fileInput, newSuppliers, {
      filename: "bulk-success.csv",
    });

    await expect(dialog.getByText("Archivo seleccionado", { exact: false })).toContainText(
      attachedFilename
    );

    const cancelButton = dialog.getByRole("button", { name: "Cancelar" });
    const submitButton = dialog.locator('button[type="submit"]');
    const initialListCalls = listStub?.getCalls().length ?? 0;

    await submitButton.click();
    await expect(submitButton).toBeDisabled();
    await expect(cancelButton).toBeDisabled();

    await interceptor.waitForRequest();
    interceptor.allowFulfill();
    await expect
      .poll(() => lastResponse, {
        message: "bulk upload should provide a response payload",
      })
      .not.toBeNull();

    const json = lastResponse!;
    expect(json.summary.processedRows).toBe(json.summary.succeeded + json.summary.failed);
    expect(json.summary.processedRows).toBe(newSuppliers.length);
    expect(json.errors).toHaveLength(0);

    const successToast = page
      .locator('[data-sonner-toast]')
      .filter({ hasText: "Carga masiva exitosa" })
      .first();
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText(
      `${newSuppliers.length} proveedores creados exitosamente`
    );

    await expect(dialog).toBeHidden();

    await expect
      .poll(() => listStub?.getCalls().length ?? 0, {
        message: "should trigger proveedores refetch",
      })
      .toBeGreaterThan(initialListCalls);

    await ensureRowVisible(page, "Proveedor CSV Exitoso");

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const reopenDialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    await expect(reopenDialog.getByText("Archivo seleccionado", { exact: false })).toHaveCount(0);
    await expect(reopenDialog.getByRole("button", { name: "Crear" })).toBeDisabled();

    tracker.assertAllAuthorized();
    await interceptor.dispose();
    tracker.stop();
  });


  test("Carga masiva con observaciones y resumen consistente", async ({ page }) => {
    const base: SupplierResponse[] = Array.from({ length: 1 }, (_, index) => ({
      id: seededSupplierIds[index] ?? index + 100,
      ...buildSupplierPayload(`${SEED_PREFIX}-partial-${index + 1}`),
    }));
    let currentData = [...base];

    listStub = await setupSupplierListStub(page, () => currentData);

    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForAnyListResponse(page);
    await gotoProveedores(page);
    await initialResponse;

    const successPayload = buildSupplierPayload("CSV Parcial", {
      nombre: "Proveedor Parcial",
      correo: "parcial@example.com",
    });
    const failingPayload = buildSupplierPayload("CSV Fallo", {
      nombre: "Proveedor Fallido",
      correo: "fallo@example.com",
    });
    const csvPayloads = [successPayload, failingPayload];
    const expectedCsv = buildCsvFromPayloads(csvPayloads).replace(/\r\n/g, "\n");

    let lastResponse: BulkUploadResponse | null = null;
    const interceptor = await setupBulkUploadInterceptor(page, async ({ csv, respond }) => {
      expect(csv.contentType).toBe("text/csv");
      expect(csv.headers).toEqual(CSV_HEADERS);
      expect(csv.content.trim()).toBe(expectedCsv.trim());
      expect(csv.rows).toHaveLength(csvPayloads.length);

      const summary = {
        totalRows: csvPayloads.length,
        processedRows: csvPayloads.length,
        succeeded: 1,
        failed: 1,
      };
      const created: SupplierResponse[] = [{ id: 8100, ...successPayload }];
      currentData = [...created, ...base];

      const response: BulkUploadResponse = {
        success: true,
        message: "Carga completada con observaciones",
        file: {
          filename: csv.filename,
          contentType: csv.contentType,
          rows: csv.rows,
        },
        summary,
        errors: [
          {
            rowNumber: 2,
            errors: [{ loc: ["correo"], msg: "Correo inválido", type: "value_error" }],
            rawData: null,
          },
        ],
        createdSuppliers: created,
      };

      lastResponse = response;
      await respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    });

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    const fileInput = dialog.locator('input[type="file"][accept=".csv"]');
    await attachCsvFile(fileInput, csvPayloads, { filename: "bulk-partial.csv" });

    const submitButton = dialog.locator('button[type="submit"]');
    const initialListCalls = listStub?.getCalls().length ?? 0;
    await submitButton.click();

    await interceptor.waitForRequest();
    interceptor.allowFulfill();

    await expect
      .poll(() => lastResponse, {
        message: "bulk upload should provide partial response",
      })
      .not.toBeNull();

    const json = lastResponse!;
    expect(json.summary.processedRows).toBe(json.summary.succeeded + json.summary.failed);
    expect(json.summary.failed).toBe(1);
    expect(json.summary.succeeded).toBe(1);

    const toast = page
      .locator('[data-sonner-toast]')
      .filter({ hasText: "Carga masiva con observaciones" })
      .first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("1 proveedores creados y 1 con errores.");

    await expect
      .poll(() => listStub?.getCalls().length ?? 0, {
        message: "should refetch proveedores after partial upload",
      })
      .toBeGreaterThan(initialListCalls);
    await ensureRowVisible(page, "Proveedor Parcial");
    await expect(page.getByRole("row", { name: /Proveedor Fallido/ })).toHaveCount(0);

    tracker.assertAllAuthorized();
    await interceptor.dispose();
    tracker.stop();
  });


  test("Muestra errores del backend y preserva el archivo seleccionado", async ({ page }) => {
    const base: SupplierResponse[] = [];
    listStub = await setupSupplierListStub(page, () => base);

    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForAnyListResponse(page);
    await gotoProveedores(page);
    await initialResponse;

    const csvPayloads = [
      buildSupplierPayload("CSV Error", {
        nombre: "Proveedor Error",
        correo: "error@example.com",
      }),
    ];

    let responded = false;
    const interceptor = await setupBulkUploadInterceptor(page, async ({ respond }) => {
      responded = true;
      await respond({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Archivo corrupto" }),
      });
    });

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    const fileInput = dialog.locator('input[type="file"][accept=".csv"]');
    const { filename: attachedFilename } = await attachCsvFile(fileInput, csvPayloads, {
      filename: "bulk-error.csv",
    });

    const submitButton = dialog.getByRole("button", { name: "Crear" });

    await submitButton.click();
    await interceptor.waitForRequest();
    interceptor.allowFulfill();

    await expect
      .poll(() => responded, {
        message: "bulk upload error response should resolve",
      })
      .toBeTruthy();

    const toast = page
      .locator('[data-sonner-toast]')
      .filter({ hasText: "Error en carga masiva" })
      .first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Archivo corrupto");

    await expect(dialog).toBeVisible();
    await expect(submitButton).not.toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Cancelar" })).not.toBeDisabled();
    await expect(dialog.getByText("Archivo seleccionado", { exact: false })).toContainText(
      attachedFilename
    );

    tracker.assertAllAuthorized();
    await interceptor.dispose();
    tracker.stop();
  });


  test("Cancelar restablece el estado y no emite solicitudes", async ({ page }) => {
    let currentData: SupplierResponse[] = [];
    listStub = await setupSupplierListStub(page, () => currentData);

    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForAnyListResponse(page);
    await gotoProveedores(page);
    await initialResponse;
    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });

    const fileInput = dialog.locator('input[type="file"][accept=".csv"]');
    await attachCsvFile(fileInput, [buildSupplierPayload("CSV Cancel")], {
      filename: "bulk-cancel.csv",
    });

    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const reopened = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    await expect(reopened.getByText("Archivo seleccionado", { exact: false })).toHaveCount(0);
    await expect(reopened.locator('button[type="submit"]')).toBeDisabled();

    expect(
      tracker.getCount("POST", ({ request }) =>
        request.url().startsWith(BULK_UPLOAD_ENDPOINT)
      )
    ).toBe(0);
    tracker.assertAllAuthorized();
    tracker.stop();
  });


  test("Normaliza estados y certificados devueltos por el backend", async ({ page }) => {
    let currentData: SupplierResponse[] = [];
    listStub = await setupSupplierListStub(page, () => currentData);

    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForAnyListResponse(page);
    await gotoProveedores(page);
    await initialResponse;

    const aliasedPayload = buildSupplierPayload("CSV Alias", {
      estado: "Activo",
      certificado: {
        nombre: "Cert Salud",
        cuerpoCertificador: "FDA",
        fechaCertificacion: "2024-01-01",
        fechaVencimiento: "2025-01-01",
        urlDocumento: "https://example.com/cert.pdf",
      },
    });
    const csvPayload = { ...aliasedPayload, estado: "inactive" as unknown as SupplierPayload["estado"] };
    const expectedCsv = buildCsvFromPayloads([csvPayload]).replace(/\r\n/g, "\n");

    let lastResponse: BulkUploadResponse | null = null;
    const interceptor = await setupBulkUploadInterceptor(page, async ({ csv, respond }) => {
      expect(csv.contentType).toBe("text/csv");
      expect(csv.headers).toEqual(CSV_HEADERS);
      expect(csv.content.trim()).toBe(expectedCsv.trim());
      expect(csv.rows[0].estado).toBe("inactive");

      const summary = {
        totalRows: 1,
        processedRows: 1,
        succeeded: 1,
        failed: 0,
      };
      const normalized: SupplierResponse = {
        id: 9991,
        ...aliasedPayload,
        estado: "Inactivo",
      };
      currentData = [normalized];

      const response: BulkUploadResponse = {
        success: true,
        message: "Normalización exitosa",
        file: {
          filename: csv.filename,
          contentType: csv.contentType,
          rows: csv.rows,
        },
        summary,
        errors: [],
        createdSuppliers: [normalized],
      };

      lastResponse = response;
      await respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    });

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    const fileInput = dialog.locator('input[type="file"][accept=".csv"]');
    const { filename: attachedFilename } = await attachCsvFile(fileInput, [csvPayload], {
      filename: "bulk-alias.csv",
    });

    const submitButton = dialog.locator('button[type="submit"]');
    const initialListCalls = listStub?.getCalls().length ?? 0;
    await submitButton.click();

    await interceptor.waitForRequest();
    interceptor.allowFulfill();

    await expect
      .poll(() => lastResponse, {
        message: "bulk upload should provide normalization response",
      })
      .not.toBeNull();

    const json = lastResponse!;
    expect(json.file?.filename).toBe(attachedFilename);
    expect(json.file?.contentType).toBe("text/csv");
    expect(json.file?.rows?.[0]?.estado).toBe("inactive");

    await expect
      .poll(() => listStub?.getCalls().length ?? 0, {
        message: "should refetch proveedores after normalization",
      })
      .toBeGreaterThan(initialListCalls);

    await ensureRowVisible(page, aliasedPayload.nombre);
    const row = page.getByRole("row", { name: new RegExp(aliasedPayload.nombre) });
    await expect(row).toContainText("Inactivo");

    tracker.assertAllAuthorized();
    await interceptor.dispose();
    tracker.stop();
  });


});


const runSmokeSuite = (callback: () => void) => {
  if (REAL_SMOKE_FLAG) {
    test.describe.serial("HUP-002 Smoke real", callback);
  } else {
    test.describe.skip("HUP-002 Smoke real", callback);
  }
};

runSmokeSuite(() => {
  let adminToken: string;
  let storagePayload: { user: unknown; permissions: string[] };
  let proveedoresApi: APIRequestContext;

  test.beforeAll(async () => {
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
      test.skip();
    }
    await page.addInitScript(
      ([token, payload]) => {
        localStorage.setItem("auth_token", token as string);
        localStorage.setItem("user_data", JSON.stringify(payload));
      },
      [adminToken, storagePayload]
    );
  });

  test("Carga masiva real contra backend", async ({ page }) => {
    const tracker = trackProveedoresRequests(page);
    const initialResponse = waitForAnyListResponse(page);
    await gotoProveedores(page);
    await initialResponse;

    const payload = buildSupplierPayload("CSV Real", {
      nombre: `CSV Real ${Date.now()}`,
      estado: "Activo",
    });

    await page.getByRole("button", { name: "Carga masiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Carga masiva proveedores" });
    const fileInput = dialog.locator('input[type="file"][accept=".csv"]');
    await attachCsvFile(fileInput, [payload], { filename: "bulk-real.csv" });

    const listRefetchPromise = waitForListResponse(page, 1);

    const submitButton = dialog.locator('button[type="submit"]');
    await submitButton.click();

    const refetch = await listRefetchPromise;
    await refetch.finished();

    await ensureRowVisible(page, payload.nombre);

    tracker.assertAllAuthorized();
    tracker.stop();
  });
});
