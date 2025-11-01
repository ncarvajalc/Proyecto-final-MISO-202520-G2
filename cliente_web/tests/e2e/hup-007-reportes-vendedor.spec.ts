import {
  test,
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from "@playwright/test";

import {
  loginAsAdmin,
  createSalesforceApi,
  gotoVendedores,
  waitForVendorListResponse,
  waitForVendedorDetalleResponse,
  waitForToastWithText,
  trackVendedoresRequests,
  seedVendedor,
  seedPlanVenta,
  deleteVendedorViaApi,
  findVendorPageViaApi,
  getVendedorDetalleViaApi,
  mapBackendVendedorDetalle,
  type VendedorResponse,
  type VendedorDetalle,
} from "./utils/vendedores";

const ITEMS_PER_PAGE = 5;
const SEED_PREFIX = `HUP007-${Date.now()}`;

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
  value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

const locateVendorRow = (page: Page, vendor: VendedorResponse) =>
  page
    .getByRole("row")
    .filter({ hasText: new RegExp(escapeRegex(vendor.correo), "i") })
    .first();

const navigateToVendorPage = async (
  page: Page,
  targetPage: number
) => {
  if (targetPage <= 1) {
    return;
  }

  let currentPage = 1;
  while (currentPage < targetPage) {
    const responsePromise = waitForVendorListResponse(
      page,
      (response) =>
        (response.headers()["content-type"] ?? "").includes("application/json")
    );
    await page.getByRole("button", { name: "Siguiente" }).click();
    await responsePromise;
    currentPage += 1;
  }
};

const openReporteModal = async (
  page: Page,
  vendor: VendedorResponse,
  vendorPage: number
): Promise<{ modal: Locator; detail: VendedorDetalle }> => {
  await navigateToVendorPage(page, vendorPage);

  const row = locateVendorRow(page, vendor);
  await expect(row).toBeVisible();

  const detailResponsePromise = waitForVendedorDetalleResponse(page, vendor.id);
  await row.getByRole("button", { name: /Ver asignaciones/i }).click();
  const detailResponse = await detailResponsePromise;
  expect(detailResponse.ok()).toBeTruthy();

  const detailPayload = mapBackendVendedorDetalle(await detailResponse.json());
  const modal = page.getByRole("dialog", { name: /Reporte Vendedor/i });
  await expect(modal).toBeVisible();

  return { modal, detail: detailPayload };
};

// TODO: Restore sales report e2e scenarios when API authentication succeeds in tests.
test.skip(true, "TODO: Restore sales report e2e when backend auth works in CI.");
test.describe.serial("HUP-007 Consulta de reportes de vendedor", () => {
  let adminToken: string;
  let storagePayload: { user: unknown; permissions: string[] };
  let salesforceApi: APIRequestContext;
  let vendorWithPlan: VendedorResponse;
  let vendorWithPlanPage = 1;
  let vendorWithoutPlan: VendedorResponse;
  let vendorWithoutPlanPage = 1;
  const vendorsToCleanup: string[] = [];

  const ensureVendorPage = async (vendor: VendedorResponse) => {
    const { page: vendorPage } = await findVendorPageViaApi(salesforceApi, vendor.id, {
      limit: ITEMS_PER_PAGE,
    });
    return vendorPage;
  };

  test.beforeAll(async () => {
    const auth = await loginAsAdmin();
    adminToken = auth.token;
    storagePayload = auth.storagePayload;

    salesforceApi = await createSalesforceApi(adminToken);

    vendorWithPlan = await seedVendedor(salesforceApi, `${SEED_PREFIX}-PLAN`);
    vendorsToCleanup.push(vendorWithPlan.id);

    await seedPlanVenta(salesforceApi, {
      vendedorId: vendorWithPlan.id,
      identificador: `${SEED_PREFIX}-PLAN-001`,
      nombre: "Plan trimestral HUP-007",
      descripcion: "Plan de ventas para pruebas e2e",
      periodo: `${new Date().getFullYear()}-Q1`,
      meta: 150,
    });

    const detail = await getVendedorDetalleViaApi(salesforceApi, vendorWithPlan.id);
    expect(detail.planDeVenta).not.toBeNull();

    vendorWithoutPlan = await seedVendedor(
      salesforceApi,
      `${SEED_PREFIX}-SIN-PLAN`
    );
    vendorsToCleanup.push(vendorWithoutPlan.id);

    vendorWithPlanPage = await ensureVendorPage(vendorWithPlan);
    vendorWithoutPlanPage = await ensureVendorPage(vendorWithoutPlan);
  });

  test.afterAll(async () => {
    if (salesforceApi) {
      for (const vendorId of vendorsToCleanup) {
        await deleteVendedorViaApi(salesforceApi, vendorId);
      }
      await salesforceApi.dispose();
    }
  });

  test.beforeEach(async ({ page }) => {
    if (!adminToken) {
      throw new Error("Authentication bootstrap failed");
    }

    await ensureAuthStorage(page, adminToken, storagePayload);
  });

  test("Muestra el detalle del plan de venta con indicadores y cumplimiento", async ({ page }) => {
    const tracker = trackVendedoresRequests(page);

    try {
      const listResponsePromise = waitForVendorListResponse(
        page,
        (response) =>
          (response.headers()["content-type"] ?? "").includes("application/json")
      );
      await gotoVendedores(page);
      await listResponsePromise;

      const { modal, detail } = await openReporteModal(
        page,
        vendorWithPlan,
        vendorWithPlanPage
      );

      await expect(modal.getByText(vendorWithPlan.id)).toBeVisible();
      await expect(modal.getByText(vendorWithPlan.nombre)).toBeVisible();
      await expect(modal.getByText(vendorWithPlan.correo)).toBeVisible();

      expect(detail.planDeVenta).not.toBeNull();
      const plan = detail.planDeVenta!;

      await expect(modal.getByText(plan.identificador)).toBeVisible();
      await expect(
        modal.locator('label:has-text("Unidades Vendidas") + p').first()
      ).toHaveText(String(plan.unidadesVendidas ?? 0));
      await expect(
        modal.locator('label:has-text("Meta") + p').first()
      ).toHaveText(String(plan.meta));

      const cumplimiento = plan.meta
        ? ((plan.unidadesVendidas ?? 0) / plan.meta) * 100
        : 0;
      await expect(
        modal.locator('label:has-text("Cumplimiento de plan") + p').first()
      ).toHaveText(new RegExp(`${cumplimiento.toFixed(2)}\\s*%`));

      tracker.assertAllAuthorized();
    } finally {
      tracker.stop();
    }
  });

  test("Muestra mensaje cuando el vendedor no tiene plan de venta asignado", async ({ page }) => {
    const tracker = trackVendedoresRequests(page);

    try {
      const listResponsePromise = waitForVendorListResponse(
        page,
        (response) =>
          (response.headers()["content-type"] ?? "").includes("application/json")
      );
      await gotoVendedores(page);
      await listResponsePromise;

      await navigateToVendorPage(page, vendorWithoutPlanPage);

      const row = locateVendorRow(page, vendorWithoutPlan);
      await expect(row).toBeVisible();

      const detailResponsePromise = waitForVendedorDetalleResponse(
        page,
        vendorWithoutPlan.id
      );
      await row.getByRole("button", { name: /Ver asignaciones/i }).click();
      const detailResponse = await detailResponsePromise;
      expect(detailResponse.ok()).toBeTruthy();
      const detail = mapBackendVendedorDetalle(await detailResponse.json());

      const modal = page.getByRole("dialog", { name: /Reporte Vendedor/i });
      await expect(modal).toBeVisible();
      await expect(
        modal.getByText(/Este vendedor no tiene un plan de venta asignado/i)
      ).toBeVisible();
      await expect(modal.locator("text=Indicadores Clave")).toHaveCount(0);

      expect(detail.planDeVenta).toBeNull();

      tracker.assertAllAuthorized();
    } finally {
      tracker.stop();
    }
  });

  test("Calcula cumplimiento en 0% cuando no hay unidades vendidas", async ({ page }) => {
    const tracker = trackVendedoresRequests(page);

    try {
      const listResponsePromise = waitForVendorListResponse(
        page,
        (response) =>
          (response.headers()["content-type"] ?? "").includes("application/json")
      );
      await gotoVendedores(page);
      await listResponsePromise;

      const { modal, detail } = await openReporteModal(
        page,
        vendorWithPlan,
        vendorWithPlanPage
      );

      const plan = detail.planDeVenta;
      expect(plan).not.toBeNull();

      await expect(
        modal.locator('label:has-text("Unidades Vendidas") + p').first()
      ).toHaveText(String(plan!.unidadesVendidas ?? 0));
      await expect(
        modal.locator('label:has-text("Cumplimiento de plan") + p').first()
      ).toHaveText(/0\.00\s*%/);

      tracker.assertAllAuthorized();
    } finally {
      tracker.stop();
    }
  });

  test("Muestra notificación de error cuando falla la consulta del reporte", async ({ page }) => {
    const vendor = await seedVendedor(salesforceApi, `${SEED_PREFIX}-ERROR`);

    const { page: vendorPage } = await findVendorPageViaApi(salesforceApi, vendor.id, {
      limit: ITEMS_PER_PAGE,
    });

    const tracker = trackVendedoresRequests(page);

    try {
      const listResponsePromise = waitForVendorListResponse(
        page,
        (response) =>
          (response.headers()["content-type"] ?? "").includes("application/json")
      );
      await gotoVendedores(page);
      await listResponsePromise;

      await navigateToVendorPage(page, vendorPage);
      const row = locateVendorRow(page, vendor);
      await expect(row).toBeVisible();

      await deleteVendedorViaApi(salesforceApi, vendor.id);

      const detailResponsePromise = waitForVendedorDetalleResponse(page, vendor.id);
      await row.getByRole("button", { name: /Ver asignaciones/i }).click();
      const detailResponse = await detailResponsePromise;
      expect(detailResponse.ok()).toBeFalsy();
      expect(detailResponse.status()).toBe(404);

      await waitForToastWithText(
        page,
        "No se pudo cargar la información del vendedor"
      );
      await expect(page.getByRole("dialog", { name: /Reporte Vendedor/i })).toHaveCount(0);
      await expect(row.getByRole("button", { name: /Ver asignaciones/i })).toBeEnabled();

      tracker.assertAllAuthorized();
    } finally {
      tracker.stop();
    }
  });
});
