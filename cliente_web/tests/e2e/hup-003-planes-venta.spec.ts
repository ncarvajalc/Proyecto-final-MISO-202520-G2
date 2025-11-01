import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_GATEWAY_URL,
  loginAsAdmin,
  buildPlanVentaPayload,
  createSalesforceApi,
  gotoPlanesVenta,
  listPlanesVenta,
  seedPlanVenta,
  seedPlanesVenta,
  seedVendedor,
  trackPlanesRequests,
  waitForCreatePlanResponse,
  waitForPlanesListResponse,
  waitForToastWithText,
  expectPlanRowVisible,
} from "./utils/planesVenta";
import type {
  PlanVentaListResponse,
  PlanVentaPayload,
  PlanVentaResponse,
  VendedorResponse,
} from "./utils/planesVenta";

const ITEMS_PER_PAGE = 5;
const SEED_PREFIX = `HUP003-${Date.now()}`;

const fillCreatePlanForm = async (
  page: Page,
  data: PlanVentaPayload,
  vendedor: VendedorResponse
) => {
  await page.getByPlaceholder("Identificador del plan").fill(data.identificador);
  await page.getByPlaceholder("Plan Ventas Q1 2025").fill(data.nombre);
  await page
    .getByPlaceholder("ej. 01/01/2025 - 31/03/2025")
    .fill(data.periodo);
  await page.getByPlaceholder("Se espera que....").fill(data.descripcion);
  const combobox = page.getByRole("combobox", { name: /vendedor/i });
  await combobox.click();
  await page.getByRole("option", { name: vendedor.nombre }).click();
  await page
    .getByPlaceholder("Cuota en monto ($)")
    .fill(String(data.meta));
};

const getCreateDialog = (page: Page) =>
  page.getByRole("dialog", { name: /crear plan de venta/i });

const openCreateDialog = async (page: Page) => {
  await page.getByRole("button", { name: "Nuevo Plan de Venta" }).click();
  const dialog = getCreateDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
};

test.describe.serial("HUP-003 Gestión de Planes de venta", () => {
  let adminToken: string;
  let storagePayload: { user: unknown; permissions: string[] };
  let salesforceApi: APIRequestContext;
  let vendedores: VendedorResponse[] = [];

  test.beforeAll(async () => {
    const auth = await loginAsAdmin();
    adminToken = auth.token;
    storagePayload = auth.storagePayload;

    salesforceApi = await createSalesforceApi(adminToken);

    const vendedorPrincipal = await seedVendedor(
      salesforceApi,
      `${SEED_PREFIX}-VEN-A`
    );
    const vendedorSecundario = await seedVendedor(
      salesforceApi,
      `${SEED_PREFIX}-VEN-B`
    );

    vendedores = [vendedorPrincipal, vendedorSecundario];

    const basePlansPayload = Array.from({ length: 6 }).map((_, index) => {
      const targetVendor = index % 2 === 0 ? vendedorPrincipal : vendedorSecundario;
      return {
        vendedorId: targetVendor.id,
        identificador: `${SEED_PREFIX}-BASE-${index + 1}`,
        periodo: `${SEED_PREFIX}-PER-${index + 1}`,
        nombre: `Plan base ${index + 1}`,
        descripcion: `Plan base generado para ${targetVendor.nombre}`,
        meta: 150 + index * 10,
      } satisfies Partial<PlanVentaPayload> & { vendedorId: string };
    });

    await seedPlanesVenta(salesforceApi, basePlansPayload);
  });

  test.afterAll(async () => {
    await salesforceApi?.dispose();
  });

  test.beforeEach(async ({ page }, testInfo) => {
    if (
      testInfo.title.startsWith("Autenticación") ||
      testInfo.title.includes("Ruta protegida")
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

  test("Autenticación y navegación hacia Planes de venta", async ({ page }) => {
    const tracker = trackPlanesRequests(page);
    await page.goto("./login");

    await page.getByLabel("Correo").fill(ADMIN_EMAIL);
    await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);

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

    await page
      .getByRole("link", { name: "Gestión comercial", exact: true })
      .click();
    await expect(page).toHaveURL(/\/comercial$/);

    const listResponsePromise = waitForPlanesListResponse(page);
    await page
      .getByRole("link", { name: "Planes de venta", exact: true })
      .click();
    await listResponsePromise;

    await expect(page).toHaveURL(/\/comercial\/planes-venta$/);
    await expect(page.getByRole("heading", { name: "Planes de Venta" })).toBeVisible();

    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Ruta protegida sin token redirige a login", async ({ page }) => {
    await page.goto("./comercial/planes-venta");
    await page.waitForURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  });

  test("Ruta protegida con sesión inválida redirige a login", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("auth_token", "token-invalido");
      localStorage.removeItem("user_data");
    });

    await page.goto("./comercial/planes-venta");
    await page.waitForURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  });

  test("Listado refleja la respuesta del backend", async ({ page }) => {
    const apiResponse = await listPlanesVenta(salesforceApi, {
      page: 1,
      limit: ITEMS_PER_PAGE,
    });
    expect(apiResponse.ok()).toBeTruthy();

    const apiJson = (await apiResponse.json()) as PlanVentaListResponse;
    expect(apiJson.data.length).toBeGreaterThan(0);

    const listResponsePromise = waitForPlanesListResponse(
      page,
      (response) => response.url().includes("page=1")
    );
    await gotoPlanesVenta(page, {
      token: adminToken,
      storagePayload,
      forceReload: true,
    });
    await listResponsePromise;

    await expect(page.locator("table tbody tr")).toHaveCount(
      apiJson.data.length
    );

    for (const plan of apiJson.data) {
      const row = page.locator("table tbody tr", {
        hasText: plan.identificador,
      });
      await expect(row).toBeVisible();
      await expect(row).toContainText(plan.nombre);
      const vendedorLabel =
        plan.vendedorNombre ?? plan.vendedor_nombre ?? plan.vendedorId;
      if (vendedorLabel) {
        await expect(row).toContainText(vendedorLabel);
      }
      await expect(row).toContainText(plan.periodo);
      await expect(row).toContainText(String(plan.meta));
    }
  });

  test("La paginación actualiza la tabla y botones", async ({ page }) => {
    const primaryVendor = vendedores[0];
    const paginationPrefix = `${SEED_PREFIX}-PAGE-${Date.now()}`;

    await seedPlanesVenta(
      salesforceApi,
      Array.from({ length: ITEMS_PER_PAGE + 2 }).map((_, index) => ({
        vendedorId: primaryVendor.id,
        identificador: `${paginationPrefix}-${index + 1}`,
        periodo: `${paginationPrefix}-PER-${index + 1}`,
        nombre: `Plan paginado ${index + 1}`,
        descripcion: `Plan paginado ${index + 1}`,
        meta: 300 + index,
      }))
    );

    const firstResponsePromise = waitForPlanesListResponse(
      page,
      (response) => response.url().includes("page=1")
    );
    await gotoPlanesVenta(page, {
      token: adminToken,
      storagePayload,
      forceReload: true,
    });
    const firstResponse = await firstResponsePromise;
    const firstJson = (await firstResponse.json()) as PlanVentaListResponse;
    const firstTotalPages = firstJson.totalPages ?? firstJson.total_pages ?? 1;

    expect(firstTotalPages).toBeGreaterThan(1);
    await expect(page.getByRole("button", { name: "Anterior" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeEnabled();

    const nextResponsePromise = waitForPlanesListResponse(
      page,
      (response) => response.url().includes("page=2")
    );
    await page.getByRole("button", { name: "Siguiente" }).click();
    const nextResponse = await nextResponsePromise;
    const nextJson = (await nextResponse.json()) as PlanVentaListResponse;
    const nextTotalPages = nextJson.totalPages ?? nextJson.total_pages ?? 1;

    expect(nextJson.page).toBe(2);
    await expect(
      page.getByText(`Página ${nextJson.page} de ${nextTotalPages}`)
    ).toBeVisible();
    await expectPlanRowVisible(page, nextJson.data[0].identificador);

    const prevResponsePromise = waitForPlanesListResponse(
      page,
      (response) => response.url().includes("page=1")
    );
    await page.getByRole("button", { name: "Anterior" }).click();
    await prevResponsePromise;
    await expect(
      page.getByText(`Página 1 de ${firstTotalPages}`)
    ).toBeVisible();
  });

  test(
    "Las validaciones impiden enviar el formulario vacío",
    async ({ page }) => {
      const tracker = trackPlanesRequests(page);
      await gotoPlanesVenta(page, {
        token: adminToken,
        storagePayload,
        forceReload: true,
      });
      await openCreateDialog(page);

      await page.getByRole("button", { name: "Crear" }).click();

      await expect(
        page.getByText("El identificador es requerido.")
      ).toBeVisible();
      await expect(
        page.getByText("El nombre debe tener al menos 2 caracteres.")
      ).toBeVisible();
      await expect(page.getByText("El periodo es requerido.")).toBeVisible();
      await expect(page.getByText("La descripción es requerida.")).toBeVisible();
      await expect(page.getByText("El vendedor es requerido.")).toBeVisible();
      await expect(page.getByText("La meta es requerida.")).toBeVisible();

      expect(tracker.getCount("POST")).toBe(0);
      tracker.stop();
    }
  );

  test(
    "Meta menor o igual a cero muestra error y mantiene el diálogo abierto",
    async ({ page }) => {
      const tracker = trackPlanesRequests(page);
      const vendedor = vendedores[0];

      await gotoPlanesVenta(page, {
        token: adminToken,
        storagePayload,
        forceReload: true,
      });
      await openCreateDialog(page);

      const payload = buildPlanVentaPayload({ vendedorId: vendedor.id });
      await fillCreatePlanForm(page, payload, vendedor);
      await page.getByPlaceholder("Cuota en monto ($)").fill("-10");

      await page.getByRole("button", { name: "Crear" }).click();
      await waitForToastWithText(
        page,
        "La meta debe ser un número mayor a 0."
      );
      await expect(getCreateDialog(page)).toBeVisible();

      expect(tracker.getCount("POST")).toBe(0);
      tracker.stop();
    }
  );

  test(
    "Meta no numérica muestra error y mantiene el diálogo abierto",
    async ({ page }) => {
      const tracker = trackPlanesRequests(page);
      const vendedor = vendedores[1] ?? vendedores[0];

      await gotoPlanesVenta(page, {
        token: adminToken,
        storagePayload,
        forceReload: true,
      });
      await openCreateDialog(page);

      const payload = buildPlanVentaPayload({ vendedorId: vendedor.id });
      await fillCreatePlanForm(page, payload, vendedor);
      const metaInput = page.getByPlaceholder("Cuota en monto ($)");
      await metaInput.evaluate((element, value) => {
        const input = element as HTMLInputElement;
        input.value = value as string;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }, "abc");

      await page.getByRole("button", { name: "Crear" }).click();
      await expect(
        page.getByText("La meta es requerida.")
      ).toBeVisible();
      await expect(getCreateDialog(page)).toBeVisible();

      expect(tracker.getCount("POST")).toBe(0);
      tracker.stop();
    }
  );

  test(
    "Crea un plan de venta y refresca el listado",
    async ({ page }) => {
      const vendedor = vendedores[0];
      const payload = buildPlanVentaPayload({
        vendedorId: vendedor.id,
        identificador: `${SEED_PREFIX}-UI-${Date.now()}`,
        periodo: `${SEED_PREFIX}-PER-UI-${Date.now()}`,
      });

      await gotoPlanesVenta(page, {
        token: adminToken,
        storagePayload,
        forceReload: true,
      });
      await openCreateDialog(page);
      await fillCreatePlanForm(page, payload, vendedor);

      const createResponsePromise = waitForCreatePlanResponse(page);
      const refetchPromise = waitForPlanesListResponse(
        page,
        (response) => response.request().url().includes("page=1")
      );

      await page.getByRole("button", { name: "Crear" }).click();
      const createResponse = await createResponsePromise;
      expect([200, 201]).toContain(createResponse.status());
      const body = (await createResponse.json()) as PlanVentaResponse;
      expect(body.identificador).toBe(payload.identificador);
      expect(body.unidadesVendidas ?? body.unidades_vendidas).toBe(0);

      await refetchPromise;
      await waitForToastWithText(
        page,
        "Plan de venta creado exitosamente"
      );
      await expect(getCreateDialog(page)).not.toBeVisible();
      await expectPlanRowVisible(page, payload.identificador);

      await openCreateDialog(page);
      await expect(page.getByPlaceholder("Identificador del plan")).toHaveValue(
        ""
      );
      await expect(page.getByPlaceholder("Plan Ventas Q1 2025")).toHaveValue(
        ""
      );
      await page.getByRole("button", { name: "Cancelar" }).click();
    }
  );

  test.describe("Errores del backend al crear planes de venta", () => {
    test(
      "Muestra mensaje y conserva los valores cuando el identificador ya existe",
      async ({ page }) => {
        const vendedor = vendedores[0];
        const existingPlan = await seedPlanVenta(salesforceApi, {
          vendedorId: vendedor.id,
          identificador: `${SEED_PREFIX}-DUP-${Date.now()}`,
          periodo: `${SEED_PREFIX}-PER-DUP-${Date.now()}`,
        });

        const payload = buildPlanVentaPayload({
          vendedorId: vendedor.id,
          identificador: existingPlan.identificador,
          periodo: `${existingPlan.periodo}-ALT`,
        });

        await gotoPlanesVenta(page, {
          token: adminToken,
          storagePayload,
          forceReload: true,
        });
        await openCreateDialog(page);
        await fillCreatePlanForm(page, payload, vendedor);

        const createResponsePromise = waitForCreatePlanResponse(page);
        await page.getByRole("button", { name: "Crear" }).click();
        const response = await createResponsePromise;
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(String(body.detail)).toContain("Identificador");

        await waitForToastWithText(page, "Identificador already exists");
        await expect(getCreateDialog(page)).toBeVisible();
        await expect(
          page.getByPlaceholder("Identificador del plan")
        ).toHaveValue(payload.identificador);
        await expect(page.getByPlaceholder("Plan Ventas Q1 2025")).toHaveValue(
          payload.nombre
        );
        await page.getByRole("button", { name: "Cancelar" }).click();
      }
    );

    test(
      "Muestra mensaje cuando el vendedor ya tiene un plan en el periodo",
      async ({ page }) => {
        const vendedor = vendedores[1] ?? vendedores[0];
        const conflictingPeriod = `${SEED_PREFIX}-PER-CONFLICT-${Date.now()}`;
        await seedPlanVenta(salesforceApi, {
          vendedorId: vendedor.id,
          identificador: `${SEED_PREFIX}-CONFLICT-${Date.now()}`,
          periodo: conflictingPeriod,
        });

        const payload = buildPlanVentaPayload({
          vendedorId: vendedor.id,
          periodo: conflictingPeriod,
          identificador: `${SEED_PREFIX}-CONFLICT-NEW-${Date.now()}`,
        });

        await gotoPlanesVenta(page, {
          token: adminToken,
          storagePayload,
          forceReload: true,
        });
        await openCreateDialog(page);
        await fillCreatePlanForm(page, payload, vendedor);

        const createResponsePromise = waitForCreatePlanResponse(page);
        await page.getByRole("button", { name: "Crear" }).click();
        const response = await createResponsePromise;
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(String(body.detail)).toContain("Salesperson");

        await waitForToastWithText(
          page,
          "Salesperson already has a plan for this period"
        );
        await expect(getCreateDialog(page)).toBeVisible();
        await expect(
          page.getByPlaceholder("Identificador del plan")
        ).toHaveValue(payload.identificador);
        await expect(page.getByPlaceholder("Plan Ventas Q1 2025")).toHaveValue(
          payload.nombre
        );
        await page.getByRole("button", { name: "Cancelar" }).click();
      }
    );
  });
});
