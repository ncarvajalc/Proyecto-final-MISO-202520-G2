import { faker } from "@faker-js/faker";
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ITEMS_PER_PAGE,
  computePageForIndex,
  createProveedoresApi,
  ensureRowVisible,
  extractJson,
  fetchSupplierList,
  interceptCreateProveedor,
  goToFirstPage,
  goToPage,
  gotoProveedores,
  loginAsAdmin,
  API_GATEWAY_URL,
  seedSuppliers,
  trackProveedoresRequests,
  waitForCreateRequest,
  waitForCreateResponse,
  waitForListResponse,
} from "./utils/proveedores";
import type {
  SupplierListResponse,
  SupplierPayload,
  SupplierResponse,
} from "./utils/proveedores";

const SEED_PREFIX = `HUP001-${Date.now()}`;

const assertDialogFocusTrap = async (page: Page) => {
  const focusInsideDialog = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return false;
    const active = document.activeElement;
    return !!active && dialog.contains(active);
  });

  expect(focusInsideDialog).toBeTruthy();
};

test.describe.serial("HUP-001 Registro individual de proveedor", () => {
  let adminToken: string;
  let proveedoresApi: APIRequestContext;
  let storagePayload: { user: unknown; permissions: string[] };
  const _createdSupplierIds: number[] = [];

  test.beforeAll(async () => {
    const auth = await loginAsAdmin();
    adminToken = auth.token;
    storagePayload = auth.storagePayload;
    proveedoresApi = await createProveedoresApi(adminToken);

    const seeded = await seedSuppliers(proveedoresApi, SEED_PREFIX, 6);
    _createdSupplierIds.push(...seeded);
  });

  test.afterAll(async () => {
    await proveedoresApi?.dispose();
  });

  test.beforeEach(async ({ page }, testInfo) => {
    if (
      testInfo.title.startsWith("Autenticación") ||
      testInfo.title.includes("Sesión inválida")
    ) {
      return;
    }

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

  test("Autenticación y navegación al módulo de proveedores", async ({ page }) => {
    const tracker = trackProveedoresRequests(page);
    await page.goto("./login");

    await page.getByLabel("Correo").fill(ADMIN_EMAIL);
    await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);

    const loginRequestPromise = page.waitForRequest(
      (request) =>
        request.url().includes("/auth/login") && request.method() === "POST"
    );
    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/auth/login") &&
        response.request().method() === "POST"
    );

    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await loginRequestPromise;
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.ok()).toBeTruthy();

    await page.waitForURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();

    await page
      .getByRole("link", { name: "Gestión de catálogos", exact: true })
      .click();
    await expect(page).toHaveURL(/\/catalogos$/);

    const providersRequestPromise = page.waitForRequest(
      (request) =>
        request.url().startsWith(`${API_GATEWAY_URL}/proveedores`) &&
        request.method() === "GET"
    );

    await page
      .getByRole("link", { name: "Proveedores", exact: true })
      .click();
    await expect(page).toHaveURL(/\/catalogos\/proveedores$/);
    await expect(page.getByRole("heading", { name: "Proveedores" })).toBeVisible();

    const providersRequest = await providersRequestPromise;
    expect(providersRequest.headers()["authorization"]).toMatch(/^Bearer\s.+/);

    const tokenInStorage = await page.evaluate(() => localStorage.getItem("auth_token"));
    expect(tokenInStorage).toBeTruthy();

    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Sesión inválida redirige al formulario de login", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("auth_token", "token-danado");
      localStorage.removeItem("user_data");
    });

    await page.goto("./catalogos/proveedores");
    await page.waitForURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  });

  test("Renderiza secuencia de carga, vacío, error y datos", async ({ page }) => {
    let callCount = 0;
    await page.route("**/proveedores?*", async (route) => {
      const request = route.request();
      if (request.method() !== "GET") {
        await route.continue();
        return;
      }

      callCount += 1;
      if (callCount === 1) {
        await expect(page.getByText("Cargando proveedores...")).toBeVisible();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [],
            total: 0,
            page: 1,
            limit: ITEMS_PER_PAGE,
            totalPages: 0,
          }),
        });
        return;
      }

      if (callCount === 2 || callCount === 3) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ detail: "error forzado" }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("./catalogos/proveedores");
    await expect(page.getByText("No hay proveedores disponibles")).toBeVisible();

    const errorResponsePromise = page.waitForResponse(
      (response) =>
        response.url().startsWith(`${API_GATEWAY_URL}/proveedores`) &&
        response.request().method() === "GET" &&
        response.status() >= 500
    );
    await page.reload();
    await errorResponsePromise;
    await expect(page.getByText("Error al cargar los proveedores")).toBeVisible();

    const successResponsePromise = page.waitForResponse(
      (response) =>
        response.url().startsWith(`${API_GATEWAY_URL}/proveedores`) &&
        response.request().method() === "GET" &&
        response.ok()
    );
    await page.reload();
    await successResponsePromise;
    await expect(page.getByRole("heading", { name: "Proveedores" })).toBeVisible();
    await expect(page.locator("table tbody tr")).toHaveCount(ITEMS_PER_PAGE);

    await page.unroute("**/proveedores?*");
  });

  test("Paginación solicita páginas y revalida el caché", async ({ page }) => {
    const tracker = trackProveedoresRequests(page);
    const firstResponsePromise = waitForListResponse(page, 1);
    await gotoProveedores(page);
    const firstResponse = await firstResponsePromise;
    const firstJson = await extractJson<SupplierListResponse>(firstResponse);

    expect(firstJson.page).toBe(1);
    expect(firstJson.limit).toBe(ITEMS_PER_PAGE);

    await expect(page.getByText(`Página 1 de ${firstJson.totalPages}`)).toBeVisible();
    await expect(page.locator("table tbody tr")).toHaveCount(firstJson.data.length);

    let currentPage = firstJson.page;
    if (firstJson.totalPages > 1) {
      const nextResponsePromise = waitForListResponse(page, currentPage + 1);
      await page.getByRole("button", { name: "Siguiente" }).click();
      const nextResponse = await nextResponsePromise;
      const nextJson = await extractJson<SupplierListResponse>(nextResponse);
      currentPage = nextJson.page;

      await expect(page.getByRole("button", { name: "Anterior" })).toBeEnabled();
      const nextButton = page.getByRole("button", { name: "Siguiente" });
      if (nextJson.page === nextJson.totalPages) {
        await expect(nextButton).toBeDisabled();
      } else {
        await expect(nextButton).toBeEnabled();
      }

      await expect(page.locator("table tbody tr")).toHaveCount(nextJson.data.length);

      const previousResponsePromise = waitForListResponse(page, currentPage - 1);
      await page.getByRole("button", { name: "Anterior" }).click();
      await previousResponsePromise;
      currentPage -= 1;

      const pageOneRequests = tracker.getRequests(
        "GET",
        (entry) => entry.url.searchParams.get("page") === "1"
      );
      expect(pageOneRequests.length).toBeGreaterThanOrEqual(2);
    }

    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Validaciones del formulario y accesibilidad de errores", async ({ page }) => {
    await gotoProveedores(page);

    await page.getByRole("button", { name: "Nuevo proveedor" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute(
      "aria-describedby",
      "create-proveedor-description"
    );
    await assertDialogFocusTrap(page);

    const estadoCombobox = dialog.getByRole("combobox", { name: "Estado" });
    await expect(estadoCombobox).toHaveAttribute("aria-expanded", "false");
    await expect(estadoCombobox).toHaveText("Activo");

    await estadoCombobox.click();
    const estadoList = page.getByRole("listbox");
    await expect(estadoList).toBeVisible();
    await expect(
      estadoList.getByRole("option", { name: "Activo", exact: true })
    ).toBeVisible();
    await expect(
      estadoList.getByRole("option", { name: "Inactivo", exact: true })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(estadoCombobox).toHaveAttribute("aria-expanded", "false");

    await page.getByRole("button", { name: "Crear" }).click();

    const nombreError = page.getByText("El nombre es requerido");
    await expect(nombreError).toBeVisible();
    const nombreErrorId = await nombreError.getAttribute("id");
    expect(nombreErrorId ?? "").toContain("form-item-message");

    const nombreDescribedBy = await page
      .getByRole("textbox", { name: "Nombre", exact: true })
      .getAttribute("aria-describedby");
    expect(nombreDescribedBy?.split(" ")).toContain(nombreErrorId ?? "");

    await expect(page.getByText("El Tax ID es requerido")).toBeVisible();
    await expect(page.getByText("La dirección es requerida")).toBeVisible();
    await expect(page.getByText("El teléfono es requerido")).toBeVisible();
    await expect(
      page.getByText("Debe ser un correo electrónico válido")
    ).toBeVisible();
    await expect(page.getByText("El contacto es requerido")).toBeVisible();

    await page.locator('input[name="correo"]').fill("correo-no-valido");
    await page.locator('input[name="nombre"]').fill("Proveedor inválido");
    await page.locator('input[name="idTax"]').fill("999");
    await page.locator('input[name="direccion"]').fill("Calle 1");
    await page.locator('input[name="telefono"]').fill("1234567");
    await page.locator('input[name="contacto"]').fill("Contacto");

    await page.getByRole("button", { name: "Crear" }).click();
    await expect(page.getByText("Debe ser un correo electrónico válido")).toBeVisible();

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("Registro individual sin certificado dispara refetch autorizado", async ({ page }) => {
    const tracker = trackProveedoresRequests(page);
    await gotoProveedores(page);

    const interceptor = await interceptCreateProveedor(page, proveedoresApi);

    try {
      await page.getByRole("button", { name: "Nuevo proveedor" }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      const supplierName = `${SEED_PREFIX} Único sin certificado`;
      const createRequestPromise = waitForCreateRequest(page);
      const createResponsePromise = waitForCreateResponse(page);
      const refetchPromise = waitForListResponse(page, 1);

      await page.getByLabel("Nombre", { exact: true }).fill(supplierName);
      await page
        .getByLabel("Id tax")
        .fill(faker.string.numeric({ length: 10 }));
      await page.getByLabel("Dirección").fill(faker.location.streetAddress());
      await page
        .getByLabel("Teléfono")
        .fill(faker.phone.number({ style: "international" }));
      await page
        .getByLabel("Correo")
        .fill(
          faker.internet.email({ firstName: "sin", lastName: "cert" }).toLowerCase()
        );
      await page.getByLabel("Contacto").fill(faker.person.fullName());

      const submitButton = dialog.locator('button[type="submit"]');
      await submitButton.click();

      const createRequest = await createRequestPromise;
      expect(createRequest.headers()["authorization"]).toMatch(/^Bearer\s.+/);
      const payload = createRequest.postDataJSON() as SupplierPayload;
      expect(payload.certificado).toBeNull();
      expect(Object.keys(payload).sort()).toEqual(
        [
          "nombre",
          "id_tax",
          "direccion",
          "telefono",
          "correo",
          "contacto",
          "estado",
          "certificado",
        ].sort()
      );

      const createResponse = await createResponsePromise;
      expect(createResponse.ok()).toBeTruthy();
      const created = await extractJson<SupplierResponse>(createResponse);
      _createdSupplierIds.push(created.id);

      await refetchPromise;

      await expect(page.getByText("Proveedor creado exitosamente")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Crear proveedor" })).not.toBeVisible();

      tracker.assertAllAuthorized();
      expect(
        tracker.getRequests("GET", (entry) => entry.url.searchParams.get("page") === "1")
          .length
      ).toBeGreaterThanOrEqual(2);

      const refetchJson = await fetchSupplierList(proveedoresApi, {
        page: 1,
        limit: 100,
      });
      const persistedIndex = refetchJson.data.findIndex((item) => item.id === created.id);
      expect(persistedIndex).toBeGreaterThanOrEqual(0);
      const persisted = refetchJson.data[persistedIndex];
      expect(Object.keys(persisted).sort()).toEqual(
        [
          "id",
          "nombre",
          "id_tax",
          "direccion",
          "telefono",
          "correo",
          "contacto",
          "estado",
          "certificado",
        ].sort()
      );
      expect(persisted.certificado).toBeNull();
      expect(persisted.nombre).toBe(supplierName);

      const targetPage = computePageForIndex(persistedIndex, ITEMS_PER_PAGE);
      let currentPage = await goToFirstPage(page, 1);
      if (targetPage > currentPage) {
        currentPage = await goToPage(page, currentPage, targetPage);
      }
      await ensureRowVisible(page, supplierName);
    } finally {
      await interceptor.dispose();
    }

    tracker.stop();
  });

  test("Registro con certificado persiste campos y estado", async ({ page }) => {
    const tracker = trackProveedoresRequests(page);
    await gotoProveedores(page);

    const interceptor = await interceptCreateProveedor(page, proveedoresApi);

    try {
      await page.getByRole("button", { name: "Nuevo proveedor" }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      const supplierName = `${SEED_PREFIX} Único con certificado`;
      const certificacionBaseDate = faker.date.past({ years: 1 });
      const certificacionExpiryDate = faker.date.future({
        years: 1,
        refDate: certificacionBaseDate,
      });
      const certificacion = {
        nombre: faker.company.buzzPhrase(),
        cuerpoCertificador: faker.company.name(),
        fechaCertificacion: certificacionBaseDate.toISOString().slice(0, 10),
        fechaVencimiento: certificacionExpiryDate.toISOString().slice(0, 10),
        urlDocumento: faker.internet.url(),
      };

      const createRequestPromise = waitForCreateRequest(page);
      const createResponsePromise = waitForCreateResponse(page);
      const refetchPromise = waitForListResponse(page, 1);

      await page.getByLabel("Nombre", { exact: true }).fill(supplierName);
      await page
        .getByLabel("Id tax")
        .fill(faker.string.numeric({ length: 10 }));
      await page.getByLabel("Dirección").fill(faker.location.streetAddress());
      await page
        .getByLabel("Teléfono")
        .fill(faker.phone.number({ style: "international" }));
      await page
        .getByLabel("Correo")
        .fill(
          faker.internet.email({ firstName: "con", lastName: "cert" }).toLowerCase()
        );
      await page.getByLabel("Contacto").fill(faker.person.fullName());

      const estadoCombobox = dialog.getByRole("combobox", { name: "Estado" });
      await estadoCombobox.click();
      await page.getByRole("option", { name: "Inactivo", exact: true }).click();
      await expect(estadoCombobox).toHaveText("Inactivo");

      await page.getByLabel("Nombre certificado").fill(certificacion.nombre);
      await page
        .getByLabel("Cuerpo certificador")
        .fill(certificacion.cuerpoCertificador);
      await page
        .getByLabel("Fecha de certificación")
        .fill(certificacion.fechaCertificacion);
      await page
        .getByLabel("Fecha de vencimiento")
        .fill(certificacion.fechaVencimiento);
      await page
        .getByLabel("URL del documento")
        .fill(certificacion.urlDocumento);

      const submitButton = dialog.locator('button[type="submit"]');
      await submitButton.click();

      const createRequest = await createRequestPromise;
      expect(createRequest.headers()["authorization"]).toMatch(/^Bearer\s.+/);
      const payload = createRequest.postDataJSON() as SupplierPayload;
      expect(payload.certificado).toEqual(certificacion);
      expect(payload.estado).toBe("Inactivo");
      expect(Object.keys(payload.certificado ?? {}).sort()).toEqual(
        [
          "nombre",
          "cuerpoCertificador",
          "fechaCertificacion",
          "fechaVencimiento",
          "urlDocumento",
        ].sort()
      );

      const createResponse = await createResponsePromise;
      expect(createResponse.ok()).toBeTruthy();
      const created = await extractJson<SupplierResponse>(createResponse);
      _createdSupplierIds.push(created.id);

      await refetchPromise;

      await expect(page.getByText("Proveedor creado exitosamente")).toBeVisible();

      tracker.assertAllAuthorized();
      expect(
        tracker.getRequests("GET", (entry) => entry.url.searchParams.get("page") === "1")
          .length
      ).toBeGreaterThanOrEqual(2);

      const refetchJson = await fetchSupplierList(proveedoresApi, {
        page: 1,
        limit: 100,
      });
      const persistedIndex = refetchJson.data.findIndex((item) => item.id === created.id);
      expect(persistedIndex).toBeGreaterThanOrEqual(0);
      const persisted = refetchJson.data[persistedIndex];
      expect(Object.keys(persisted).sort()).toEqual(
        [
          "id",
          "nombre",
          "id_tax",
          "direccion",
          "telefono",
          "correo",
          "contacto",
          "estado",
          "certificado",
        ].sort()
      );
      expect(persisted.estado).toBe("Inactivo");
      expect(persisted.certificado).not.toBeNull();
      expect(Object.keys(persisted.certificado ?? {}).sort()).toEqual(
        [
          "nombre",
          "cuerpoCertificador",
          "fechaCertificacion",
          "fechaVencimiento",
          "urlDocumento",
        ].sort()
      );
      expect(persisted.certificado).toMatchObject(certificacion);

      const targetPage = computePageForIndex(persistedIndex, ITEMS_PER_PAGE);
      let currentPage = await goToFirstPage(page, 1);
      if (targetPage > currentPage) {
        currentPage = await goToPage(page, currentPage, targetPage);
      }
      await ensureRowVisible(page, supplierName);
      await expect(
        page
          .locator("table tbody tr", { hasText: supplierName })
          .getByText("Inactivo")
      ).toBeVisible();
    } finally {
      await interceptor.dispose();
    }

    tracker.stop();
  });

  test("Muestra error sin refetch ante fallo 500", async ({ page }) => {
    const tracker = trackProveedoresRequests(page);
    await gotoProveedores(page);

    let interceptedAuthorization: string | undefined;
    await page.route("**/proveedores", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        interceptedAuthorization = request.headers()["authorization"];
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Fallo controlado" }),
        });
        return;
      }

      await route.continue();
    });

    await page.getByRole("button", { name: "Nuevo proveedor" }).click();

    await page
      .getByLabel("Nombre", { exact: true })
      .fill(`${SEED_PREFIX} Error proveedor`);
    await page.getByLabel("Id tax").fill(faker.string.numeric({ length: 10 }));
    await page.getByLabel("Dirección").fill(faker.location.streetAddress());
    await page
      .getByLabel("Teléfono")
      .fill(faker.phone.number({ style: "international" }));
    await page
      .getByLabel("Correo")
      .fill(faker.internet.email({ firstName: "error", lastName: "proveedor" }).toLowerCase());
    await page.getByLabel("Contacto").fill(faker.person.fullName());

    const initialGetCount = tracker.getCount("GET");

    await page.getByRole("button", { name: "Crear" }).click();
    await expect(page.getByText("Error al crear proveedor")).toBeVisible();
    await expect(page.getByText("Fallo controlado")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Crear proveedor" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Crear" })).toHaveText("Crear");

    expect(tracker.getCount("GET")).toBe(initialGetCount);
    expect(interceptedAuthorization).toMatch(/^Bearer\s.+/);

    tracker.assertAllAuthorized();
    tracker.stop();
    await page.unroute("**/proveedores");
  });
});
