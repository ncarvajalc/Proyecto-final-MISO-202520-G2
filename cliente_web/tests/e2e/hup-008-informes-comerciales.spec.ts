import {
  test,
  expect,
  type APIRequestContext,
  type Page,
  type Locator,
} from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_GATEWAY_URL,
  loginAsAdmin,
  createSalesforceApi,
  gotoInformesComerciales,
  waitForInformesListResponse,
  waitForCreateInformeResponse,
  expectInformeRowVisible,
  trackInformesRequests,
  createInformeViaApi,
  type InformeComercialPayload,
  type InformeComercialResponse,
} from "./utils/informesComerciales";

const ITEMS_PER_PAGE = 5;
const SEED_PREFIX = `HUP008-${Date.now()}`;

const fillCreateInformeForm = async (
  page: Page,
  data: InformeComercialPayload
) => {
  await page.getByPlaceholder("ej. IC-2025-Q1").fill(data.nombre);
};

const getCreateDialog = (page: Page) =>
  page.getByRole("dialog", { name: /informe comercial/i });

const openCreateDialog = async (page: Page) => {
  await page.getByRole("button", { name: "Crear Informe Comercial" }).click();
  const dialog = getCreateDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
};

const performLogin = async (page: Page) => {
  await page.goto("./login");

  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);

  const loginRequestPromise = page.waitForRequest(
    (request) =>
      request.url().startsWith(`${API_GATEWAY_URL}/auth/login`) &&
      request.method() === "POST"
  );

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().startsWith(`${API_GATEWAY_URL}/auth/login`) &&
      response.request().method() === "POST"
  );

  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await loginRequestPromise;
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBeTruthy();

  await page.waitForURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
};

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

const escapeRegex = (value: string) =>
  value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&").replace(/\s+/g, "\\s*");

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/\u00a0/g, " ");

const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/\u00a0/g, " ");

const expectIndicatorValue = async (
  dialog: Locator,
  label: string,
  formattedValue: string
) => {
  const labelLocator = dialog.getByText(label, { exact: true });
  const valueLocator = labelLocator.locator("xpath=following-sibling::p[1]");
  await expect(valueLocator).toHaveText(
    new RegExp(escapeRegex(formattedValue), "i")
  );
};

// TODO: Restore informes comerciales e2e tests after stabilizing external dependencies.
test.skip(
  true,
  "TODO: Restore informes comerciales e2e once dependencies are ready."
);
test.describe.serial("HUP-008 Generación de informes comerciales", () => {
  let adminToken: string;
  let storagePayload: { user: unknown; permissions: string[] };
  let salesforceApi: APIRequestContext;
  const seededInformes: InformeComercialResponse[] = [];

  const getSeededInformesOrdered = () =>
    [...seededInformes].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

  test.beforeAll(async () => {
    const auth = await loginAsAdmin();
    adminToken = auth.token;
    storagePayload = auth.storagePayload;

    salesforceApi = await createSalesforceApi(adminToken);

    for (let index = 0; index < ITEMS_PER_PAGE + 2; index += 1) {
      const informe = await createInformeViaApi(salesforceApi, {
        nombre: `${SEED_PREFIX}-SEED-${index}`,
      });
      seededInformes.push(informe);
    }
  });

  test.afterAll(async () => {
    if (salesforceApi) {
      await salesforceApi.dispose();
    }
  });

  test.beforeEach(async ({ page }, testInfo) => {
    if (!adminToken || !storagePayload) {
      throw new Error("Authentication bootstrap failed");
    }

    const title = testInfo.title;

    if (
      title.includes("Autenticación") ||
      title.includes("sin token") ||
      title.includes("sesión inválida")
    ) {
      return;
    }

    await ensureAuthStorage(page, adminToken, storagePayload);
  });

  test("Autenticación y navegación hacia Informes comerciales", async ({
    page,
  }) => {
    const tracker = trackInformesRequests(page);

    try {
      await performLogin(page);

      await page
        .getByRole("link", { name: "Gestión comercial", exact: true })
        .click();
      await expect(page).toHaveURL(/\/comercial$/);

      const listResponsePromise = waitForInformesListResponse(
        page,
        (response) =>
          (response.headers()["content-type"] ?? "").includes(
            "application/json"
          )
      );
      await page
        .getByRole("link", { name: "Informes comerciales", exact: true })
        .click();
      const listResponse = await listResponsePromise;
      expect(listResponse.ok()).toBeTruthy();

      await expect(page).toHaveURL(/\/comercial\/informes-comerciales$/);
      await expect(
        page.getByRole("heading", { name: "Informes Comerciales" })
      ).toBeVisible();

      const [mostRecent] = getSeededInformesOrdered();
      await expectInformeRowVisible(page, mostRecent.nombre);

      tracker.assertAllAuthorized();
    } finally {
      tracker.stop();
    }
  });

  test("Ruta protegida sin token redirige a login", async ({ page }) => {
    await page.goto("./comercial/informes-comerciales");
    await page.waitForURL(/\/login$/);
    await expect(
      page.getByRole("button", { name: "Iniciar sesión" })
    ).toBeVisible();
  });

  test("Ruta protegida con sesión inválida redirige a login", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("auth_token", "token-invalido");
      localStorage.removeItem("user_data");
    });

    await page.goto("./comercial/informes-comerciales");
    await page.waitForURL(/\/login$/);
    await expect(
      page.getByRole("button", { name: "Iniciar sesión" })
    ).toBeVisible();
  });

  test("Listado muestra informes recientes en orden descendente", async ({
    page,
  }) => {
    const listResponsePromise = waitForInformesListResponse(page, (response) =>
      (response.headers()["content-type"] ?? "").includes("application/json")
    );

    await gotoInformesComerciales(page, {
      token: adminToken,
      storagePayload,
    });
    await listResponsePromise;

    const ordered = getSeededInformesOrdered();
    const firstRow = page.getByRole("row").nth(1);
    const secondRow = page.getByRole("row").nth(2);

    await expect(firstRow).toContainText(ordered[0].nombre);
    await expect(secondRow).toContainText(ordered[1].nombre);
  });

  test("La paginación permite navegar entre páginas", async ({ page }) => {
    const ordered = getSeededInformesOrdered();
    expect(ordered.length).toBeGreaterThan(ITEMS_PER_PAGE);

    const listResponsePromise = waitForInformesListResponse(page, (response) =>
      (response.headers()["content-type"] ?? "").includes("application/json")
    );
    await gotoInformesComerciales(page, { token: adminToken, storagePayload });
    await listResponsePromise;

    await expect(page.getByRole("button", { name: "Anterior" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeEnabled();

    const nextResponsePromise = waitForInformesListResponse(page, (response) =>
      response.url().includes("page=2")
    );
    await page.getByRole("button", { name: "Siguiente" }).click();
    await nextResponsePromise;

    const secondPageRow = page.getByRole("row").nth(1);
    await expect(secondPageRow).toContainText(ordered[ITEMS_PER_PAGE].nombre);
    await expect(page.getByText(/Página 2/)).toBeVisible();

    const prevResponsePromise = waitForInformesListResponse(page, (response) =>
      response.url().includes("page=1")
    );
    await page.getByRole("button", { name: "Anterior" }).click();
    await prevResponsePromise;

    const firstPageRow = page.getByRole("row").nth(1);
    await expect(firstPageRow).toContainText(ordered[0].nombre);
  });

  test("Las validaciones impiden enviar el formulario vacío", async ({
    page,
  }) => {
    const tracker = trackInformesRequests(page);

    const listResponsePromise = waitForInformesListResponse(page, (response) =>
      (response.headers()["content-type"] ?? "").includes("application/json")
    );
    await gotoInformesComerciales(page, { token: adminToken, storagePayload });
    await listResponsePromise;

    await openCreateDialog(page);
    await page.getByRole("button", { name: "Crear" }).click();

    await expect(
      page.getByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeVisible();

    expect(tracker.getCount("POST")).toBe(0);
    tracker.stop();
  });

  test("Creación exitosa muestra indicadores y actualiza la tabla", async ({
    page,
  }) => {
    const listResponsePromise = waitForInformesListResponse(page, (response) =>
      (response.headers()["content-type"] ?? "").includes("application/json")
    );
    await gotoInformesComerciales(page, { token: adminToken, storagePayload });
    await listResponsePromise;

    const dialog = await openCreateDialog(page);

    const payload: InformeComercialPayload = {
      nombre: `${SEED_PREFIX}-UI-${Date.now()}`,
    };
    await fillCreateInformeForm(page, payload);

    const createResponsePromise = waitForCreateInformeResponse(
      page,
      (response) => response.status() === 201
    );
    const refetchPromise = waitForInformesListResponse(
      page,
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("page=1")
    );

    await page.getByRole("button", { name: "Crear" }).click();
    const createResponse = await createResponsePromise;
    const createdJson = (await createResponse.json()) as Record<
      string,
      unknown
    >;

    const ventasTotales = Number(
      createdJson.ventasTotales ?? createdJson.ventas_totales ?? 0
    );
    const unidadesVendidas = Number(
      createdJson.unidadesVendidas ?? createdJson.unidades_vendidas ?? 0
    );

    await expect(dialog.getByText("Indicadores Clave")).toBeVisible();
    await expectIndicatorValue(
      dialog,
      "Ventas Totales",
      formatCurrency(ventasTotales)
    );
    await expectIndicatorValue(
      dialog,
      "Unidades Vendidas",
      formatNumber(unidadesVendidas)
    );

    await dialog.getByRole("button", { name: "Cerrar" }).click();
    await refetchPromise;

    await expect(getCreateDialog(page)).not.toBeVisible();
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow).toContainText(payload.nombre);

    await openCreateDialog(page);
    await expect(page.getByPlaceholder("ej. IC-2025-Q1")).toHaveValue("");
    await page.getByRole("button", { name: "Cancelar" }).click();
  });
});
