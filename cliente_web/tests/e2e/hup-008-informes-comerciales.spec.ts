import { faker } from "@faker-js/faker";
import { test, expect, type Page } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_GATEWAY_URL,
  loginAsAdmin,
  buildInformePayload,
  buildInformeResponse,
  gotoInformesComerciales,
  interceptInformesList,
  interceptCreateInforme,
  waitForInformesListResponse,
  waitForCreateInformeResponse,
  expectInformeRowVisible,
  trackInformesRequests,
  waitForToastWithText,
  interceptLogin,
  interceptAuthBootstrap,
} from "./utils/informesComerciales";
import type {
  InformeComercialPayload,
  InformeComercialResponse,
} from "./utils/informesComerciales";

const ITEMS_PER_PAGE = 5;

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

test.describe.serial("HUP-008 Generación de informes comerciales", () => {
  let adminToken: string;
  let storagePayload: { user: unknown; permissions: string[] };

  test.beforeAll(async () => {
    const auth = await loginAsAdmin();
    adminToken = auth.token;
    storagePayload = auth.storagePayload;
  });

  test.beforeEach(async ({ page }, testInfo) => {
    const shouldMockAuth = !testInfo.title.includes("redirige");

    if (shouldMockAuth) {
      await interceptAuthBootstrap(page, {
        token: adminToken,
        permissions: storagePayload.permissions ?? [],
        profile: {
          id: "admin-id",
          username: "Administrador",
          email: ADMIN_EMAIL,
        },
      });
    }

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

  test("Autenticación y navegación hacia Informes comerciales", async ({
    page,
  }) => {
    const informe = buildInformeResponse();

    await interceptInformesList(page, [
      {
        body: {
          data: [informe],
          total: 1,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        },
      },
    ]);

    const tracker = trackInformesRequests(page);

    const loginIntercept = await interceptLogin(page, {
      token: adminToken,
      user: storagePayload.user ?? { email: ADMIN_EMAIL },
      permissions: storagePayload.permissions,
    });

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

    const listResponsePromise = waitForInformesListResponse(page);
    await page
      .getByRole("link", { name: "Informes comerciales", exact: true })
      .click();
    await listResponsePromise;

    await expect(page).toHaveURL(/\/comercial\/informes-comerciales$/);
    await expect(
      page.getByRole("heading", { name: "Informes Comerciales" })
    ).toBeVisible();
    await expectInformeRowVisible(page, informe.nombre);

    tracker.assertAllAuthorized();
    tracker.stop();
    await loginIntercept.dispose();
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

  test("Listado muestra estados de carga, vacío y error", async ({ page }) => {
    await interceptInformesList(page, [
      {
        delayMs: 2000,
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

    await gotoInformesComerciales(page, {
      token: adminToken,
      storagePayload,
      forceReload: true,
    });

    // Wait for the empty state to show
    await expect(
      page.getByText("No hay informes comerciales disponibles")
    ).toBeVisible({ timeout: 5000 });

    const errorResponsePromise = waitForInformesListResponse(
      page,
      (response) => response.status() === 500
    );
    await page.reload();
    await errorResponsePromise;
    await expect(
      page.getByText("Error al cargar los informes comerciales")
    ).toBeVisible();
  });

  test("La tabla refleja el orden y normalización de datos", async ({
    page,
  }) => {
    const informe1: InformeComercialResponse = {
      ...buildInformeResponse(),
      nombre: "IC-Enero-2025",
      ventasTotales: 150000.5,
      unidadesVendidas: 350.75,
    };
    const informe2: InformeComercialResponse = {
      ...buildInformeResponse(),
      nombre: "IC-Febrero-2025",
      ventas_totales: 200000.25,
      unidades_vendidas: 450.5,
    };

    await interceptInformesList(page, [
      {
        body: {
          data: [informe1, informe2],
          total: 2,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        },
      },
    ]);

    await gotoInformesComerciales(page, { token: adminToken, storagePayload });

    const rows = page.getByRole("row");
    await expect(rows.nth(1)).toContainText(informe1.nombre);
    await expect(rows.nth(2)).toContainText(informe2.nombre);
  });

  test("La paginación actualiza la tabla y botones", async ({ page }) => {
    const pagina1: InformeComercialResponse[] = Array.from({
      length: ITEMS_PER_PAGE,
    }).map((_, index) =>
      buildInformeResponse({
        nombre: `IC-P1-${index + 1}`,
      })
    );
    const pagina2: InformeComercialResponse[] = Array.from({
      length: ITEMS_PER_PAGE,
    }).map((_, index) =>
      buildInformeResponse({
        nombre: `IC-P2-${index + 1}`,
      })
    );

    await interceptInformesList(page, [
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

    await gotoInformesComerciales(page, { token: adminToken, storagePayload });
    await expect(page.getByRole("button", { name: "Anterior" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeEnabled();

    const nextResponsePromise = waitForInformesListResponse(page, (response) =>
      response.url().includes("page=2")
    );
    await page.getByRole("button", { name: "Siguiente" }).click();
    await nextResponsePromise;

    await expect(page.getByText("Página 2 de 2")).toBeVisible();
    await expect(page.getByRole("button", { name: "Anterior" })).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Siguiente" })
    ).toBeDisabled();
    await expectInformeRowVisible(page, pagina2[0].nombre);

    const prevResponsePromise = waitForInformesListResponse(page, (response) =>
      response.url().includes("page=1")
    );
    await page.getByRole("button", { name: "Anterior" }).click();
    await prevResponsePromise;
    await expect(page.getByText("Página 1 de 2")).toBeVisible();
  });

  test("Las validaciones impiden enviar el formulario vacío", async ({
    page,
  }) => {
    await interceptInformesList(page, [
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

    const tracker = trackInformesRequests(page);
    await gotoInformesComerciales(page, { token: adminToken, storagePayload });
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
    const existente = buildInformeResponse({
      nombre: "IC-ANTERIOR",
    });

    const nuevoInformeData = buildInformePayload();
    nuevoInformeData.nombre = "IC-NUEVO-2025";

    const informeCreado: InformeComercialResponse = {
      id: faker.string.uuid(),
      ...nuevoInformeData,
      fecha: faker.date.recent().toISOString(),
      ventasTotales: 125000.75,
      unidadesVendidas: 550.5,
    };

    await interceptInformesList(page, [
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
          data: [informeCreado, existente],
          total: 2,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        },
      },
    ]);

    await interceptCreateInforme(page, [
      {
        status: 201,
        body: informeCreado,
      },
    ]);

    await gotoInformesComerciales(page, { token: adminToken, storagePayload });
    await openCreateDialog(page);
    await fillCreateInformeForm(page, nuevoInformeData);

    const createResponsePromise = waitForCreateInformeResponse(
      page,
      (response) => response.status() === 201
    );
    const refetchPromise = waitForInformesListResponse(page, (response) =>
      response.request().url().includes("page=1")
    );

    await page.getByRole("button", { name: "Crear" }).click();
    await createResponsePromise;

    // Verificar que se muestran los indicadores clave
    await expect(page.getByText("Indicadores Clave")).toBeVisible();
    await expect(page.getByText("Ventas Totales")).toBeVisible();
    await expect(page.getByText("Unidades Vendidas")).toBeVisible();

    // Verificar formato de números con dos decimales
    await expect(page.getByText(/125\.000,75/)).toBeVisible();
    await expect(page.getByText(/550,50/)).toBeVisible();

    // Cerrar el diálogo con indicadores
    await page.getByRole("button", { name: "Cerrar" }).click();
    await refetchPromise;

    // Verificar que el diálogo se cerró
    await expect(getCreateDialog(page)).not.toBeVisible();

    // Verificar que la tabla se actualizó
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow).toContainText(informeCreado.nombre);

    // Verificar que el formulario se resetea al abrir de nuevo
    await openCreateDialog(page);
    await expect(page.getByPlaceholder("ej. IC-2025-Q1")).toHaveValue("");
    await page.getByRole("button", { name: "Cancelar" }).click();
  });

  test.describe("Errores del backend al crear informes comerciales", () => {
    const escenarios = [
      {
        nombre: "error de cálculo de indicadores",
        status: 500,
        detail:
          "No se pudo calcular los indicadores: base de datos no disponible",
        toastMessage:
          "No se pudo calcular los indicadores: base de datos no disponible",
      },
    ] as const satisfies ReadonlyArray<{
      nombre: string;
      status: number;
      detail: string;
      toastMessage: string;
    }>;

    for (const escenario of escenarios) {
      test(`Muestra mensaje y conserva los valores cuando ocurre ${escenario.nombre}`, async ({
        page,
      }) => {
        await interceptInformesList(page, [
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

        const payload = buildInformePayload();
        await interceptCreateInforme(page, [
          {
            status: escenario.status,
            body: escenario.detail ? { detail: escenario.detail } : {},
          },
        ]);

        await gotoInformesComerciales(page, {
          token: adminToken,
          storagePayload,
        });
        await openCreateDialog(page);
        await fillCreateInformeForm(page, payload);

        const createResponsePromise = waitForCreateInformeResponse(page);
        await page.getByRole("button", { name: "Crear" }).click();
        await createResponsePromise;

        await waitForToastWithText(page, escenario.toastMessage);
        await expect(getCreateDialog(page)).toBeVisible();
        await expect(page.getByPlaceholder("ej. IC-2025-Q1")).toHaveValue(
          payload.nombre
        );
      });
    }
  });
});
