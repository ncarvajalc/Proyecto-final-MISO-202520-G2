import { faker } from "@faker-js/faker";
import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_GATEWAY_URL,
  loginAsAdmin,
  buildVehicleResponse,
  buildRouteResponse,
  buildRouteStopResponse,
  gotoLogistica,
  interceptVehiclesList,
  interceptRoutesList,
  interceptOptimizeRoute,
  waitForVehiclesListResponse,
  waitForRoutesListResponse,
  waitForOptimizeResponse,
  expectVehicleRowVisible,
  waitForToastWithText,
  openRouteGenerationModal,
  interceptLogin,
  interceptAuthBootstrap,
} from "./utils/routes";
import type {
  VehicleResponse,
  RouteResponse,
  RouteStopResponse,
} from "./utils/routes";

const ITEMS_PER_PAGE = 5;

test.describe.serial("HUP-009 Generación de rutas logísticas", () => {
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

  test("Autenticación y navegación hacia Gestión Logística", async ({
    page,
  }) => {
    const vehicle = buildVehicleResponse({ placa: "ABC-123" });

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
      .getByRole("link", { name: "Gestión logística", exact: true })
      .click();
    await expect(page).toHaveURL(/\/logistica$/);

    await expect(
      page.getByRole("heading", { name: "Gestión Logística" })
    ).toBeVisible();
    await expectVehicleRowVisible(page, vehicle.placa);

    await loginIntercept.dispose();
  });

  test("Ruta protegida sin token redirige a login", async ({ page }) => {
    await page.goto("./logistica");
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

    await page.goto("./logistica");
    await page.waitForURL(/\/login$/);
    await expect(
      page.getByRole("button", { name: "Iniciar sesión" })
    ).toBeVisible();
  });

  test("Listado de vehículos muestra estados de carga, vacío y error", async ({
    page,
  }) => {
    await interceptVehiclesList(page, [
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

    await gotoLogistica(page, {
      token: adminToken,
      storagePayload,
      forceReload: true,
    });

    await expect(page.getByText("No hay vehículos disponibles")).toBeVisible({
      timeout: 5000,
    });

    const errorResponsePromise = waitForVehiclesListResponse(
      page,
      (response) => response.status() === 500
    );
    await page.reload();
    await errorResponsePromise;
    await expect(page.getByText("Error al cargar los vehículos")).toBeVisible();
  });

  test("La tabla muestra vehículos con datos correctos", async ({ page }) => {
    const vehicle1: VehicleResponse = buildVehicleResponse({
      placa: "XYZ-789",
      conductor: "Carlos Rodríguez",
      numeroEntregas: 15,
    });
    const vehicle2: VehicleResponse = buildVehicleResponse({
      placa: "DEF-456",
      conductor: "María García",
      numeroEntregas: 23,
    });

    await interceptVehiclesList(page, [
      {
        body: {
          data: [vehicle1, vehicle2],
          total: 2,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        },
      },
    ]);

    await gotoLogistica(page, { token: adminToken, storagePayload });

    const rows = page.getByRole("row");
    await expect(rows.nth(1)).toContainText(vehicle1.placa);
    await expect(rows.nth(1)).toContainText(vehicle1.conductor);
    await expect(rows.nth(1)).toContainText(vehicle1.numeroEntregas.toString());
    await expect(rows.nth(2)).toContainText(vehicle2.placa);
    await expect(rows.nth(2)).toContainText(vehicle2.conductor);
  });

  test("Abre modal de generación de rutas al hacer clic en el botón", async ({
    page,
  }) => {
    const vehicle = buildVehicleResponse({ placa: "ABC-123" });
    const route = buildRouteResponse({
      vehicleId: vehicle.id,
      status: "pending",
    });

    await interceptVehiclesList(page, [
      {
        body: {
          data: [vehicle],
          total: 1,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        },
      },
    ]);

    await interceptRoutesList(page, [
      {
        body: {
          data: [route],
        },
      },
    ]);

    await gotoLogistica(page, { token: adminToken, storagePayload });

    const dialog = await openRouteGenerationModal(page, vehicle.placa);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(vehicle.placa);
  });

  test("Modal carga rutas pendientes del vehículo seleccionado", async ({
    page,
  }) => {
    const vehicle = buildVehicleResponse({ placa: "XYZ-789" });
    const route = buildRouteResponse({
      vehicleId: vehicle.id,
      status: "pending",
      date: "2025-10-23",
    });

    await interceptVehiclesList(page, [
      {
        body: {
          data: [vehicle],
          total: 1,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        },
      },
    ]);

    await interceptRoutesList(page, [
      {
        body: {
          data: [route],
        },
      },
    ]);

    await gotoLogistica(page, { token: adminToken, storagePayload });

    const routesResponsePromise = waitForRoutesListResponse(page, (response) =>
      response.url().includes(`vehicle_id=${vehicle.id}`)
    );

    await openRouteGenerationModal(page, vehicle.placa);
    await routesResponsePromise;

    await expect(page.getByRole("button", { name: /generar/i })).toBeVisible();
  });

  test("Genera y optimiza ruta mostrando visualización y métricas", async ({
    page,
  }) => {
    const vehicle = buildVehicleResponse({ placa: "ABC-123" });
    const routeId = faker.string.uuid();
    const pendingRoute = buildRouteResponse({
      id: routeId,
      vehicleId: vehicle.id,
      status: "pending",
      totalDistanceKm: 0,
      estimatedTimeH: 0,
    });

    const stop1: RouteStopResponse = buildRouteStopResponse({
      routeId,
      sequence: 1,
      latitude: 4.6097,
      longitude: -74.0817,
      address: "Calle 127 #15-20, Bogotá",
    });

    const stop2: RouteStopResponse = buildRouteStopResponse({
      routeId,
      sequence: 2,
      latitude: 4.6534,
      longitude: -74.0548,
      address: "Autopista Norte #145-30, Bogotá",
    });

    const optimizedRoute: RouteResponse = {
      ...pendingRoute,
      totalDistanceKm: 18.45,
      estimatedTimeH: 0.46,
      stops: [stop1, stop2],
    };

    await interceptVehiclesList(page, [
      {
        body: {
          data: [vehicle],
          total: 1,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        },
      },
    ]);

    await interceptRoutesList(page, [
      {
        body: {
          data: [pendingRoute],
        },
      },
    ]);

    await interceptOptimizeRoute(page, [
      {
        status: 200,
        body: optimizedRoute,
      },
    ]);

    await gotoLogistica(page, { token: adminToken, storagePayload });

    await openRouteGenerationModal(page, vehicle.placa);

    const optimizeResponsePromise = waitForOptimizeResponse(page);
    await page.getByRole("button", { name: /generar/i }).click();
    await optimizeResponsePromise;

    // Verificar que se muestra el toast de éxito
    await waitForToastWithText(page, "Ruta optimizada exitosamente");

    // Verificar que se muestran las métricas
    await expect(page.getByText(/Distancia total:/)).toBeVisible();
    await expect(page.getByText(/18.45 km/)).toBeVisible();
    await expect(page.getByText(/Tiempo estimado:/)).toBeVisible();
    await expect(page.getByText(/28 min/)).toBeVisible(); // 0.46 * 60 ~ 28
    await expect(page.getByText(/Paradas:/)).toBeVisible();

    // Verificar que se muestra el SVG de la ruta
    const svgs = await page.locator("svg").all();
    const routeSvg = svgs.find(async (svg) => {
      const viewBox = await svg.getAttribute("viewBox");
      return viewBox === "0 0 500 300";
    });
    expect(routeSvg).toBeTruthy();
  });

  test("Modal muestra mensaje cuando no hay rutas pendientes", async ({
    page,
  }) => {
    const vehicle = buildVehicleResponse({ placa: "DEF-456" });

    await interceptVehiclesList(page, [
      {
        body: {
          data: [vehicle],
          total: 1,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        },
      },
    ]);

    await interceptRoutesList(page, [
      {
        body: {
          data: [],
        },
      },
    ]);

    await gotoLogistica(page, { token: adminToken, storagePayload });

    await openRouteGenerationModal(page, vehicle.placa);

    await expect(
      page.getByText("No hay rutas pendientes para este vehículo")
    ).toBeVisible();
    const generateButton = page.getByRole("button", { name: /generar/i });
    await expect(generateButton).toHaveCount(0);
  });

  test("Maneja error de optimización mostrando mensaje apropiado", async ({
    page,
  }) => {
    const vehicle = buildVehicleResponse({ placa: "GHI-789" });
    const routeId = faker.string.uuid();
    const pendingRoute = buildRouteResponse({
      id: routeId,
      vehicleId: vehicle.id,
      status: "pending",
    });

    const errorDetail = "Route has no stops to optimize";

    await interceptVehiclesList(page, [
      {
        body: {
          data: [vehicle],
          total: 1,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        },
      },
    ]);

    await interceptRoutesList(page, [
      {
        body: {
          data: [pendingRoute],
        },
      },
    ]);

    await interceptOptimizeRoute(page, [
      {
        status: 400,
        body: { detail: errorDetail },
      },
    ]);

    await gotoLogistica(page, { token: adminToken, storagePayload });

    await openRouteGenerationModal(page, vehicle.placa);

    const optimizeResponsePromise = waitForOptimizeResponse(page);
    await page.getByRole("button", { name: /generar/i }).click();
    await optimizeResponsePromise;

    // Verificar que se muestra el toast de error
    await waitForToastWithText(page, errorDetail);

    // Verificar que NO se muestra la visualización
    const distanciaText = page.getByText(/Distancia total:/);
    await expect(distanciaText).toHaveCount(0);
  });

  test("Muestra mensaje cuando las paradas no tienen coordenadas", async ({
    page,
  }) => {
    const vehicle = buildVehicleResponse({ placa: "JKL-123" });
    const routeId = faker.string.uuid();
    const pendingRoute = buildRouteResponse({
      id: routeId,
      vehicleId: vehicle.id,
      status: "pending",
      totalDistanceKm: 0,
      estimatedTimeH: 0,
    });

    const stopWithoutCoords: RouteStopResponse = buildRouteStopResponse({
      routeId,
      sequence: 1,
      latitude: null,
      longitude: null,
      address: "Sin dirección",
    });

    const optimizedRoute: RouteResponse = {
      ...pendingRoute,
      totalDistanceKm: 0,
      estimatedTimeH: 0,
      stops: [stopWithoutCoords],
    };

    await interceptVehiclesList(page, [
      {
        body: {
          data: [vehicle],
          total: 1,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        },
      },
    ]);

    await interceptRoutesList(page, [
      {
        body: {
          data: [pendingRoute],
        },
      },
    ]);

    await interceptOptimizeRoute(page, [
      {
        status: 200,
        body: optimizedRoute,
      },
    ]);

    await gotoLogistica(page, { token: adminToken, storagePayload });

    await openRouteGenerationModal(page, vehicle.placa);

    await page.getByRole("button", { name: /generar/i }).click();

    await waitForToastWithText(page, "Ruta optimizada exitosamente");

    // Verificar que se muestra el mensaje de coordenadas faltantes
    await expect(
      page.getByText("Las paradas no tienen coordenadas")
    ).toBeVisible();
  });

  test("Cierra el modal al hacer clic en Cancelar", async ({ page }) => {
    const vehicle = buildVehicleResponse({ placa: "MNO-456" });
    const route = buildRouteResponse({
      vehicleId: vehicle.id,
      status: "pending",
    });

    await interceptVehiclesList(page, [
      {
        body: {
          data: [vehicle],
          total: 1,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        },
      },
    ]);

    await interceptRoutesList(page, [
      {
        body: {
          data: [route],
        },
      },
    ]);

    await gotoLogistica(page, { token: adminToken, storagePayload });

    const dialog = await openRouteGenerationModal(page, vehicle.placa);
    await expect(dialog).toBeVisible();

    await page.getByRole("button", { name: /volver/i }).click();

    await expect(dialog).not.toBeVisible();
  });
});
