import { faker } from "@faker-js/faker";
import { test, expect, type Page } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_GATEWAY_URL,
  loginAsAdmin,
  buildVendedorPayload,
  buildPlanVentaPayload,
  buildPlanVentaResponse,
  gotoPlanesVenta,
  interceptVendedoresList,
  interceptPlanesList,
  interceptCreatePlanVenta,
  waitForPlanesListResponse,
  waitForCreatePlanResponse,
  expectPlanRowVisible,
  trackPlanesRequests,
  waitForToastWithText,
} from "./utils/planesVenta";
import type {
  PlanVentaPayload,
  PlanVentaResponse,
  VendedorResponse,
} from "./utils/planesVenta";

const ITEMS_PER_PAGE = 5;

const buildVendedores = (count = 3): VendedorResponse[] => {
  return Array.from({ length: count }).map(() => ({
    id: faker.string.uuid(),
    ...buildVendedorPayload("VEN"),
    fechaContratacion: faker.date.past().toISOString().split("T")[0],
  }));
};

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

  test.beforeAll(async () => {
    const auth = await loginAsAdmin();
    adminToken = auth.token;
    storagePayload = auth.storagePayload;
  });

  test.beforeEach(async ({ page }, testInfo) => {
    if (
      testInfo.title.includes("Autenticación") ||
      testInfo.title.includes("redirige")
    ) {
      return;
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
    const vendedores = buildVendedores();
    const plan = buildPlanVentaResponse({ vendedorId: vendedores[0].id, vendedorNombre: vendedores[0].nombre });

    await interceptVendedoresList(page, vendedores);
    await interceptPlanesList(page, [
      {
        body: {
          data: [plan],
          total: 1,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        },
      },
    ]);

    const tracker = trackPlanesRequests(page);

    await page.goto("./login");
    await page.getByLabel("Correo").fill(ADMIN_EMAIL);
    await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);

    const loginRequestPromise = page.waitForRequest((request) => {
      return (
        request.url().startsWith(`${API_GATEWAY_URL}/auth/login`) &&
        request.method() === "POST"
      );
    });

    const loginResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().startsWith(`${API_GATEWAY_URL}/auth/login`) &&
        response.request().method() === "POST"
      );
    });

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
    await expectPlanRowVisible(page, plan.identificador);

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

  test("Listado muestra estados de carga, vacío y error", async ({ page }) => {
    const vendedores = buildVendedores();
    await interceptVendedoresList(page, vendedores);
    await interceptPlanesList(page, [
      {
        delayMs: 200,
        once: true,
        body: {
          data: [],
          total: 0,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 0,
        },
      },
      {
        status: 500,
        body: { detail: "Error forzado" },
      },
    ]);

    await gotoPlanesVenta(page, { token: adminToken, storagePayload });
    await expect(page.getByText("Cargando planes de venta...")).toBeVisible();
    await expect(page.getByText("No hay planes de venta disponibles")).toBeVisible();

    const errorResponsePromise = waitForPlanesListResponse(
      page,
      (response) => response.status() === 500
    );
    await page.reload();
    await errorResponsePromise;
    await expect(page.getByText("Error al cargar los planes de venta")).toBeVisible();
  });

  test("La tabla refleja el orden y normalización de datos", async ({ page }) => {
    const vendedores = buildVendedores();
    await interceptVendedoresList(page, vendedores);

    const planConNombre: PlanVentaResponse = {
      ...buildPlanVentaResponse({
        vendedorId: vendedores[0].id,
        vendedorNombre: vendedores[0].nombre,
      }),
    };
    const planSinNombre: PlanVentaResponse = {
      ...buildPlanVentaResponse({ vendedorId: vendedores[1].id }),
      vendedorNombre: null,
    };

    await interceptPlanesList(page, [
      {
        body: {
          data: [planConNombre, planSinNombre],
          total: 2,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 3,
        },
      },
    ]);

    await gotoPlanesVenta(page, { token: adminToken, storagePayload });

    const rows = page.getByRole("row");
    await expect(rows.nth(1)).toContainText(planConNombre.identificador);
    await expect(rows.nth(1)).toContainText(planConNombre.nombre);
    await expect(rows.nth(1)).toContainText(planConNombre.vendedorNombre!);

    await expect(rows.nth(2)).toContainText(planSinNombre.identificador);
    await expect(rows.nth(2)).toContainText(planSinNombre.nombre);
    await expect(rows.nth(2).getByRole("cell").nth(3)).toHaveText(
      planSinNombre.vendedorId
    );

    await expect(page.getByText("Página 1 de 3")).toBeVisible();
  });

  test("La paginación actualiza la tabla y botones", async ({ page }) => {
    const vendedores = buildVendedores();
    await interceptVendedoresList(page, vendedores);

    const pagina1: PlanVentaResponse[] = Array.from({ length: ITEMS_PER_PAGE }).map(
      (_, index) =>
        buildPlanVentaResponse({
          identificador: `PLAN-P1-${index + 1}`,
          vendedorId: vendedores[0].id,
          vendedorNombre: vendedores[0].nombre,
        })
    );
    const pagina2: PlanVentaResponse[] = Array.from({ length: ITEMS_PER_PAGE }).map(
      (_, index) =>
        buildPlanVentaResponse({
          identificador: `PLAN-P2-${index + 1}`,
          vendedorId: vendedores[1].id,
          vendedorNombre: vendedores[1].nombre,
        })
    );

    await interceptPlanesList(page, [
      {
        predicate: ({ page: pageNumber }) => pageNumber === 1,
        body: {
          data: pagina1,
          total: ITEMS_PER_PAGE * 2,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 2,
        },
      },
      {
        predicate: ({ page: pageNumber }) => pageNumber === 2,
        body: {
          data: pagina2,
          total: ITEMS_PER_PAGE * 2,
          page: 2,
          limit: ITEMS_PER_PAGE,
          totalPages: 2,
        },
      },
    ]);

    await gotoPlanesVenta(page, { token: adminToken, storagePayload });
    await expect(page.getByRole("button", { name: "Anterior" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeEnabled();

    const nextResponsePromise = waitForPlanesListResponse(
      page,
      (response) => response.url().includes("page=2")
    );
    await page.getByRole("button", { name: "Siguiente" }).click();
    await nextResponsePromise;

    await expect(page.getByText("Página 2 de 2")).toBeVisible();
    await expect(page.getByRole("button", { name: "Anterior" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    await expectPlanRowVisible(page, pagina2[0].identificador);

    const prevResponsePromise = waitForPlanesListResponse(
      page,
      (response) => response.url().includes("page=1")
    );
    await page.getByRole("button", { name: "Anterior" }).click();
    await prevResponsePromise;
    await expect(page.getByText("Página 1 de 2")).toBeVisible();
  });

  test(
    "Las validaciones impiden enviar el formulario vacío",
    async ({ page }) => {
      const vendedores = buildVendedores();
      await interceptVendedoresList(page, vendedores);
      await interceptPlanesList(page, [
        {
          body: {
            data: [],
            total: 0,
            page: 1,
            limit: ITEMS_PER_PAGE,
            totalPages: 0,
          },
        },
      ]);

      const tracker = trackPlanesRequests(page);
      await gotoPlanesVenta(page, { token: adminToken, storagePayload });
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
      const vendedores = buildVendedores();
      await interceptVendedoresList(page, vendedores);
      await interceptPlanesList(page, [
        {
          body: {
            data: [],
            total: 0,
            page: 1,
            limit: ITEMS_PER_PAGE,
            totalPages: 0,
          },
        },
      ]);

      const tracker = trackPlanesRequests(page);
      await gotoPlanesVenta(page, { token: adminToken, storagePayload });
      await openCreateDialog(page);

      const payload = buildPlanVentaPayload({ vendedorId: vendedores[0].id });
      await fillCreatePlanForm(page, payload, vendedores[0]);
      const metaInput = page.getByPlaceholder("Cuota en monto ($)");
      await metaInput.fill("-10");

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
      const vendedores = buildVendedores();
      await interceptVendedoresList(page, vendedores);
      await interceptPlanesList(page, [
        {
          body: {
            data: [],
            total: 0,
            page: 1,
            limit: ITEMS_PER_PAGE,
            totalPages: 0,
          },
        },
      ]);

      const tracker = trackPlanesRequests(page);
      await gotoPlanesVenta(page, { token: adminToken, storagePayload });
      await openCreateDialog(page);

      const payload = buildPlanVentaPayload({ vendedorId: vendedores[1].id });
      await fillCreatePlanForm(page, payload, vendedores[1]);
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
    "Durante la mutación los controles permanecen bloqueados",
    async ({ page }) => {
      const vendedores = buildVendedores();
      await interceptVendedoresList(page, vendedores);
      await interceptPlanesList(page, [
        {
          body: {
            data: [],
            total: 0,
            page: 1,
            limit: ITEMS_PER_PAGE,
            totalPages: 0,
          },
        },
      ]);

      const nuevoPlan = buildPlanVentaPayload({ vendedorId: vendedores[0].id });
      await interceptCreatePlanVenta(page, [
        {
          status: 201,
          delayMs: 400,
          body: {
            ...nuevoPlan,
            id: faker.string.uuid(),
            vendedorNombre: vendedores[0].nombre,
            unidadesVendidas: 0,
          },
        },
      ]);

      await gotoPlanesVenta(page, { token: adminToken, storagePayload });
      await openCreateDialog(page);
      await fillCreatePlanForm(page, nuevoPlan, vendedores[0]);

      const createResponsePromise = waitForCreatePlanResponse(page);
      await page.getByRole("button", { name: "Crear" }).click();
      await expect(page.getByRole("button", { name: "Creando..." })).toBeVisible();
      await expect(page.getByPlaceholder("Identificador del plan")).toBeDisabled();
      await expect(page.getByRole("combobox", { name: /vendedor/i })).toBeDisabled();
      await expect(page.getByPlaceholder("Cuota en monto ($)")).toBeDisabled();

      await createResponsePromise;
    }
  );

  test(
    "Creación exitosa cierra el diálogo y actualiza la tabla",
    async ({ page }) => {
      const vendedores = buildVendedores();
      await interceptVendedoresList(page, vendedores);

      const existente = buildPlanVentaResponse({
        identificador: "PLAN-ANTERIOR",
        vendedorId: vendedores[1].id,
        vendedorNombre: vendedores[1].nombre,
      });

      const nuevoPlanData = buildPlanVentaPayload({
        vendedorId: vendedores[0].id,
        identificador: "PLAN-NUEVO",
        nombre: "Plan Lanzamiento",
      });

      const planCreado: PlanVentaResponse = {
        id: faker.string.uuid(),
        ...nuevoPlanData,
        vendedorNombre: vendedores[0].nombre,
        unidadesVendidas: 0,
      };

      await interceptPlanesList(page, [
        {
          once: true,
          body: {
            data: [existente],
            total: 1,
            page: 1,
            limit: ITEMS_PER_PAGE,
            totalPages: 1,
          },
        },
        {
          predicate: () => true,
          body: {
            data: [planCreado, existente],
            total: 2,
            page: 1,
            limit: ITEMS_PER_PAGE,
            totalPages: 1,
          },
        },
      ]);

      await interceptCreatePlanVenta(page, [
        {
          status: 201,
          body: planCreado,
        },
      ]);

      await gotoPlanesVenta(page, { token: adminToken, storagePayload });
      await openCreateDialog(page);
      await fillCreatePlanForm(page, nuevoPlanData, vendedores[0]);

      const createResponsePromise = waitForCreatePlanResponse(
        page,
        (response) => response.status() === 201
      );
      const refetchPromise = waitForPlanesListResponse(
        page,
        (response) => response.request().url().includes("page=1")
      );

      await page.getByRole("button", { name: "Crear" }).click();
      const createResponse = await createResponsePromise;
      const body = await createResponse.json();
      expect(body.unidadesVendidas ?? body.unidades_vendidas).toBe(0);
      await refetchPromise;

      await expect(getCreateDialog(page)).not.toBeVisible();
      const firstRow = page.getByRole("row").nth(1);
      await expect(firstRow).toContainText(planCreado.identificador);
      await expect(firstRow).toContainText(planCreado.nombre);
      await expect(firstRow).toContainText(planCreado.vendedorNombre!);
      await expect(firstRow).toContainText(String(planCreado.meta));

      await openCreateDialog(page);
      await expect(page.getByPlaceholder("Identificador del plan")).toHaveValue("");
      await expect(page.getByPlaceholder("Plan Ventas Q1 2025")).toHaveValue("");
      await page.getByRole("button", { name: "Cancelar" }).click();
    }
  );

  test.describe("Errores del backend al crear planes de venta", () => {
    const escenarios = [
      {
        nombre: "vendedor inexistente",
        status: 404,
        detail: "El vendedor seleccionado no existe.",
        toastMessage: "El vendedor seleccionado no existe.",
      },
      {
        nombre: "identificador duplicado",
        status: 400,
        detail: "El identificador ya fue registrado.",
        toastMessage: "El identificador ya fue registrado.",
      },
      {
        nombre: "conflicto de periodo",
        status: 400,
        detail: "Ya existe un plan para ese periodo y vendedor.",
        toastMessage: "Ya existe un plan para ese periodo y vendedor.",
      },
      {
        nombre: "error genérico",
        status: 500,
        detail: "",
        toastMessage: "Ocurrió un error al crear el plan de venta.",
      },
    ] as const satisfies ReadonlyArray<{
      nombre: string;
      status: number;
      detail: string;
      toastMessage: string;
    }>;

    for (const escenario of escenarios) {
      test(
        `Muestra mensaje y conserva los valores cuando ocurre ${escenario.nombre}`,
        async ({ page }) => {
          const vendedores = buildVendedores();
          await interceptVendedoresList(page, vendedores);
          await interceptPlanesList(page, [
            {
              body: {
                data: [],
                total: 0,
                page: 1,
                limit: ITEMS_PER_PAGE,
                totalPages: 0,
              },
            },
          ]);

          const payload = buildPlanVentaPayload({ vendedorId: vendedores[0].id });
          await interceptCreatePlanVenta(page, [
            {
              status: escenario.status,
              body: escenario.detail
                ? { detail: escenario.detail }
                : { detail: escenario.detail },
            },
          ]);

          await gotoPlanesVenta(page, { token: adminToken, storagePayload });
          await openCreateDialog(page);
          await fillCreatePlanForm(page, payload, vendedores[0]);

          const createResponsePromise = waitForCreatePlanResponse(page);
          await page.getByRole("button", { name: "Crear" }).click();
          await createResponsePromise;

          await waitForToastWithText(page, escenario.toastMessage);
          await expect(getCreateDialog(page)).toBeVisible();
          await expect(
            page.getByPlaceholder("Identificador del plan")
          ).toHaveValue(payload.identificador);
          await expect(page.getByPlaceholder("Plan Ventas Q1 2025")).toHaveValue(
            payload.nombre
          );
        }
      );
    }
  });

});
