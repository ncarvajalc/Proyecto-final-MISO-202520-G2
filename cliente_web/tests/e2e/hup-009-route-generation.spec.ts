import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ITEMS_PER_PAGE,
  loginAsAdmin,
  createTrackingApi,
  buildVehiclePayload,
  createVehicleViaApi,
  buildRoutePayload,
  createRouteViaApi,
  buildRouteStopPayload,
  createRouteStopViaApi,
  deleteRouteViaApi,
  gotoLogistica,
  waitForVehiclesListResponse,
  waitForRoutesListResponse,
  waitForOptimizeResponse,
  waitForToastWithText,
  expectVehicleRowVisible,
  openRouteGenerationModal,
  findVehiclePageViaApi,
  type VehicleResponse,
  type RouteResponse,
} from "./utils/routes";

const timestampSegment = Date.now().toString(36).toUpperCase();
const SEED_PREFIX = `H9-${timestampSegment}`;

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

const navigateToVehiclePage = async (page: Page, targetPage: number) => {
  if (targetPage <= 1) {
    return;
  }

  let currentPage = 1;
  while (currentPage < targetPage) {
    const nextButton = page.getByRole("button", { name: "Siguiente" });
    await expect(nextButton).toBeEnabled();
<<<<<<< HEAD
    const responsePromise = waitForVehiclesListResponse(
      page,
      (response) => response.ok()
=======
    const responsePromise = waitForVehiclesListResponse(page, (response) =>
      response.ok()
>>>>>>> main
    );
    await nextButton.click();
    await responsePromise;
    currentPage += 1;
  }
};

// TODO: Re-enable route generation e2e flows once external services are reachable in CI.
<<<<<<< HEAD
test.skip(true, "TODO: Restore route generation e2e when backend services respond.");
=======
test.skip(
  true,
  "TODO: Restore route generation e2e when backend services respond."
);
>>>>>>> main
test.describe.serial("HUP-009 Generación de rutas logísticas", () => {
  let adminToken: string;
  let storagePayload: { user: unknown; permissions: string[] };
  let trackingApi: APIRequestContext;

  let vehicleWithRoute: VehicleResponse;
  let vehicleWithoutPendingRoutes: VehicleResponse;
  let vehicleWithoutStops: VehicleResponse;
  let vehicleWithoutCoords: VehicleResponse;

  let routeForOptimization: RouteResponse;
  let routeWithoutStops: RouteResponse;
  let routeWithoutCoords: RouteResponse;

  let vehicleWithRoutePage = 1;
  let vehicleWithoutPendingRoutesPage = 1;
  let vehicleWithoutStopsPage = 1;
  let vehicleWithoutCoordsPage = 1;

  const cleanupRouteIds: string[] = [];

  test.beforeAll(async () => {
    const auth = await loginAsAdmin();
    adminToken = auth.token;
    storagePayload = auth.storagePayload;

    trackingApi = await createTrackingApi(adminToken);

    vehicleWithRoute = await createVehicleViaApi(
      trackingApi,
      buildVehiclePayload(`${SEED_PREFIX}-OPT`, { numeroEntregas: 12 })
    );

    routeForOptimization = await createRouteViaApi(
      trackingApi,
      buildRoutePayload({
        vehicleId: vehicleWithRoute.id,
        status: "pending",
        priorityLevel: "alto",
      })
    );
    cleanupRouteIds.push(routeForOptimization.id);

    await createRouteStopViaApi(
      trackingApi,
      buildRouteStopPayload(routeForOptimization.id, {
        sequence: 1,
        latitude: 4.6097,
        longitude: -74.0817,
        address: "Calle 127 #15-20, Bogotá",
      })
    );

    await createRouteStopViaApi(
      trackingApi,
      buildRouteStopPayload(routeForOptimization.id, {
        sequence: 2,
        latitude: 4.6534,
        longitude: -74.0548,
        address: "Autopista Norte #145-30, Bogotá",
      })
    );

    vehicleWithoutPendingRoutes = await createVehicleViaApi(
      trackingApi,
      buildVehiclePayload(`${SEED_PREFIX}-DONE`, { numeroEntregas: 5 })
    );

    const completedRoute = await createRouteViaApi(
      trackingApi,
      buildRoutePayload({
        vehicleId: vehicleWithoutPendingRoutes.id,
        status: "completed",
      })
    );
    cleanupRouteIds.push(completedRoute.id);

    vehicleWithoutStops = await createVehicleViaApi(
      trackingApi,
      buildVehiclePayload(`${SEED_PREFIX}-ERR`, { numeroEntregas: 3 })
    );

    routeWithoutStops = await createRouteViaApi(
      trackingApi,
      buildRoutePayload({ vehicleId: vehicleWithoutStops.id })
    );
    cleanupRouteIds.push(routeWithoutStops.id);

    vehicleWithoutCoords = await createVehicleViaApi(
      trackingApi,
      buildVehiclePayload(`${SEED_PREFIX}-NOC`, { numeroEntregas: 7 })
    );

    routeWithoutCoords = await createRouteViaApi(
      trackingApi,
      buildRoutePayload({ vehicleId: vehicleWithoutCoords.id })
    );
    cleanupRouteIds.push(routeWithoutCoords.id);

    await createRouteStopViaApi(
      trackingApi,
      buildRouteStopPayload(routeWithoutCoords.id, {
        sequence: 1,
        latitude: null,
        longitude: null,
        address: "Cliente sin coordenadas",
      })
    );

    const withRoutePageInfo = await findVehiclePageViaApi(
      trackingApi,
      vehicleWithRoute.id,
      { limit: ITEMS_PER_PAGE }
    );
    vehicleWithRoutePage = withRoutePageInfo.page;

    const withoutPendingPageInfo = await findVehiclePageViaApi(
      trackingApi,
      vehicleWithoutPendingRoutes.id,
      { limit: ITEMS_PER_PAGE }
    );
    vehicleWithoutPendingRoutesPage = withoutPendingPageInfo.page;

    const withoutStopsPageInfo = await findVehiclePageViaApi(
      trackingApi,
      vehicleWithoutStops.id,
      { limit: ITEMS_PER_PAGE }
    );
    vehicleWithoutStopsPage = withoutStopsPageInfo.page;

    const withoutCoordsPageInfo = await findVehiclePageViaApi(
      trackingApi,
      vehicleWithoutCoords.id,
      { limit: ITEMS_PER_PAGE }
    );
    vehicleWithoutCoordsPage = withoutCoordsPageInfo.page;
  });

  test.afterAll(async () => {
    if (trackingApi) {
      for (const routeId of cleanupRouteIds) {
        await deleteRouteViaApi(trackingApi, routeId);
      }
      await trackingApi.dispose();
    }
  });

  test.beforeEach(async ({ page }, testInfo) => {
    const skipAuthBootstrap =
      testInfo.title.startsWith("Autenticación") ||
      testInfo.title.includes("sin token") ||
      testInfo.title.includes("sesión inválida");

    if (skipAuthBootstrap) {
      return;
    }

    if (!adminToken) {
      throw new Error("Authentication bootstrap failed");
    }

    await ensureAuthStorage(page, adminToken, storagePayload);
  });

<<<<<<< HEAD
  test("Autenticación y navegación hacia Gestión Logística", async ({ page }) => {
=======
  test("Autenticación y navegación hacia Gestión Logística", async ({
    page,
  }) => {
>>>>>>> main
    await page.goto("./login");

    await page.getByLabel("Correo").fill(ADMIN_EMAIL);
    await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);

    const loginRequestPromise = page.waitForRequest((request) => {
<<<<<<< HEAD
      return request.url().includes("/auth/login") && request.method() === "POST";
=======
      return (
        request.url().includes("/auth/login") && request.method() === "POST"
      );
>>>>>>> main
    });

    const loginResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/auth/login") &&
        response.request().method() === "POST"
      );
    });

    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await loginRequestPromise;
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.ok()).toBeTruthy();

    await page.waitForURL((url) => url.pathname.endsWith("/"));
    await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();

    const vehiclesResponsePromise = waitForVehiclesListResponse(
      page,
      (response) => response.ok()
    );
    await page
      .getByRole("link", { name: "Gestión logística", exact: true })
      .click();
    await expect(page).toHaveURL((url) => url.pathname.endsWith("/logistica"));
    await vehiclesResponsePromise;

    await expect(
      page.getByRole("heading", { name: "Gestión Logística" })
    ).toBeVisible();

    await navigateToVehiclePage(page, vehicleWithRoutePage);
    await expectVehicleRowVisible(page, vehicleWithRoute.placa);
  });
  test("Ruta protegida sin token redirige a login", async ({ page }) => {
    await page.goto("./logistica");
    await page.waitForURL((url) => url.pathname.endsWith("/login"));
    await expect(
      page.getByRole("button", { name: "Iniciar sesión" })
    ).toBeVisible();
  });

<<<<<<< HEAD
  test("Ruta protegida con sesión inválida redirige a login", async ({ page }) => {
=======
  test("Ruta protegida con sesión inválida redirige a login", async ({
    page,
  }) => {
>>>>>>> main
    await page.addInitScript(() => {
      localStorage.setItem("auth_token", "token-invalido");
      localStorage.removeItem("user_data");
    });

    await page.goto("./logistica");
    await page.waitForURL((url) => url.pathname.endsWith("/login"));
    await expect(
      page.getByRole("button", { name: "Iniciar sesión" })
    ).toBeVisible();
  });

  test("La tabla muestra vehículos con datos correctos", async ({ page }) => {
    const vehiclesResponsePromise = waitForVehiclesListResponse(
      page,
      (response) => response.ok()
    );
    await gotoLogistica(page, { token: adminToken, storagePayload });
    await vehiclesResponsePromise;

    await navigateToVehiclePage(page, vehicleWithRoutePage);

<<<<<<< HEAD
    const row = page.getByRole("row").filter({ hasText: vehicleWithRoute.placa }).first();
=======
    const row = page
      .getByRole("row")
      .filter({ hasText: vehicleWithRoute.placa })
      .first();
>>>>>>> main
    await expect(row).toContainText(vehicleWithRoute.placa);
    await expect(row).toContainText(vehicleWithRoute.conductor);
    await expect(row).toContainText(`${vehicleWithRoute.numeroEntregas}`);
  });

  test("Abre modal de generación de rutas al hacer clic en el botón", async ({
    page,
  }) => {
    const vehiclesResponsePromise = waitForVehiclesListResponse(
      page,
      (response) => response.ok()
    );
    await gotoLogistica(page, { token: adminToken, storagePayload });
    await vehiclesResponsePromise;

    await navigateToVehiclePage(page, vehicleWithRoutePage);

    const dialog = await openRouteGenerationModal(page, vehicleWithRoute.placa);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(vehicleWithRoute.placa);
  });
  test("Modal carga rutas pendientes del vehículo seleccionado", async ({
    page,
  }) => {
    const vehiclesResponsePromise = waitForVehiclesListResponse(
      page,
      (response) => response.ok()
    );
    await gotoLogistica(page, { token: adminToken, storagePayload });
    await vehiclesResponsePromise;

    await navigateToVehiclePage(page, vehicleWithRoutePage);

<<<<<<< HEAD
    const routesResponsePromise = waitForRoutesListResponse(page, (response) => {
      return (
        response.url().includes(`vehicle_id=${vehicleWithRoute.id}`) &&
        response.ok()
      );
    });
=======
    const routesResponsePromise = waitForRoutesListResponse(
      page,
      (response) => {
        return (
          response.url().includes(`vehicle_id=${vehicleWithRoute.id}`) &&
          response.ok()
        );
      }
    );
>>>>>>> main

    await openRouteGenerationModal(page, vehicleWithRoute.placa);
    await routesResponsePromise;

    await expect(page.getByRole("button", { name: /generar/i })).toBeVisible();
  });

  test("Genera y optimiza ruta mostrando visualización y métricas", async ({
    page,
  }) => {
    const vehiclesResponsePromise = waitForVehiclesListResponse(
      page,
      (response) => response.ok()
    );
    await gotoLogistica(page, { token: adminToken, storagePayload });
    await vehiclesResponsePromise;

    await navigateToVehiclePage(page, vehicleWithRoutePage);
    await openRouteGenerationModal(page, vehicleWithRoute.placa);

    const optimizeResponsePromise = waitForOptimizeResponse(page);
    await page.getByRole("button", { name: /generar/i }).click();
    const optimizeResponse = await optimizeResponsePromise;
    expect(optimizeResponse.ok()).toBeTruthy();

    const optimizedPayload = (await optimizeResponse.json()) as RouteResponse;
    await waitForToastWithText(page, "Ruta optimizada exitosamente");

    const distanceText = `${optimizedPayload.totalDistanceKm.toFixed(2)} km`;
    const timeMinutes = Math.round(optimizedPayload.estimatedTimeH * 60);
    const stopsCount = optimizedPayload.stops?.length ?? 0;

    await expect(page.getByText("Distancia total:")).toBeVisible();
    await expect(page.getByText(distanceText)).toBeVisible();
    await expect(page.getByText(`${timeMinutes} min`)).toBeVisible();
    await expect(page.getByText(`Paradas: ${stopsCount}`)).toBeVisible();
<<<<<<< HEAD
    await expect(page.locator("svg[viewBox='0 0 500 300']").first()).toBeVisible();
=======
    await expect(
      page.locator("svg[viewBox='0 0 500 300']").first()
    ).toBeVisible();
>>>>>>> main
  });
  test("Modal muestra mensaje cuando no hay rutas pendientes", async ({
    page,
  }) => {
    const vehiclesResponsePromise = waitForVehiclesListResponse(
      page,
      (response) => response.ok()
    );
    await gotoLogistica(page, { token: adminToken, storagePayload });
    await vehiclesResponsePromise;

    await navigateToVehiclePage(page, vehicleWithoutPendingRoutesPage);

<<<<<<< HEAD
    const routesResponsePromise = waitForRoutesListResponse(page, (response) => {
      return (
        response.url().includes(`vehicle_id=${vehicleWithoutPendingRoutes.id}`) &&
        response.ok()
      );
    });
=======
    const routesResponsePromise = waitForRoutesListResponse(
      page,
      (response) => {
        return (
          response
            .url()
            .includes(`vehicle_id=${vehicleWithoutPendingRoutes.id}`) &&
          response.ok()
        );
      }
    );
>>>>>>> main

    await openRouteGenerationModal(page, vehicleWithoutPendingRoutes.placa);
    await routesResponsePromise;

    await expect(
      page.getByText("No hay rutas pendientes para este vehículo")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /generar/i })).toHaveCount(0);
  });

  test("Maneja error de optimización mostrando mensaje apropiado", async ({
    page,
  }) => {
    const vehiclesResponsePromise = waitForVehiclesListResponse(
      page,
      (response) => response.ok()
    );
    await gotoLogistica(page, { token: adminToken, storagePayload });
    await vehiclesResponsePromise;

    await navigateToVehiclePage(page, vehicleWithoutStopsPage);
    await openRouteGenerationModal(page, vehicleWithoutStops.placa);

    const optimizeResponsePromise = waitForOptimizeResponse(page);
    await page.getByRole("button", { name: /generar/i }).click();
    const optimizeResponse = await optimizeResponsePromise;
    expect(optimizeResponse.ok()).toBeFalsy();

    await waitForToastWithText(page, "Route has no stops to optimize");
    await expect(page.getByText("Distancia total:")).toHaveCount(0);
    await expect(page.locator("svg[viewBox='0 0 500 300']")).toHaveCount(0);
  });
  test("Muestra mensaje cuando las paradas no tienen coordenadas", async ({
    page,
  }) => {
    const vehiclesResponsePromise = waitForVehiclesListResponse(
      page,
      (response) => response.ok()
    );
    await gotoLogistica(page, { token: adminToken, storagePayload });
    await vehiclesResponsePromise;

    await navigateToVehiclePage(page, vehicleWithoutCoordsPage);
    await openRouteGenerationModal(page, vehicleWithoutCoords.placa);

    const optimizeResponsePromise = waitForOptimizeResponse(page);
    await page.getByRole("button", { name: /generar/i }).click();
    const optimizeResponse = await optimizeResponsePromise;
    expect(optimizeResponse.ok()).toBeTruthy();

    await waitForToastWithText(page, "Ruta optimizada exitosamente");
    await expect(
      page.getByText("Las paradas no tienen coordenadas")
    ).toBeVisible();
  });

  test("Cierra el modal al hacer clic en Cancelar", async ({ page }) => {
    const vehiclesResponsePromise = waitForVehiclesListResponse(
      page,
      (response) => response.ok()
    );
    await gotoLogistica(page, { token: adminToken, storagePayload });
    await vehiclesResponsePromise;

    await navigateToVehiclePage(page, vehicleWithoutPendingRoutesPage);

    const dialog = await openRouteGenerationModal(
      page,
      vehicleWithoutPendingRoutes.placa
    );
    await expect(dialog).toBeVisible();

    await page.getByRole("button", { name: /volver/i }).click();
    await expect(dialog).not.toBeVisible();
  });
});
