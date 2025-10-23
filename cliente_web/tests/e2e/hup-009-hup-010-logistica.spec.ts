import { test, expect, type Page, type Route } from "@playwright/test";

const MOCK_TOKEN = "e2e-admin-token";
const MOCK_PERMISSIONS = [
  "logistica:read",
  "logistica:write",
  "catalogos:productos:read",
];

type InventoryConfig = {
  productos: Array<{ sku: string; nombre: string }>;
  bodegas: Array<{ id: string; nombre: string }>;
  ubicaciones: Map<string, string | null>;
  disponibilidad: Map<string, { warehouseId: string; warehouseName: string } | null>;
};

const interceptAuth = async (page: Page) => {
  const validateHandler = async (route: Route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ valid: true }),
    });
  };

  const profileHandler = async (route: Route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "admin-id",
        username: "Administrador",
        email: "admin@example.com",
        profile_id: "admin-profile",
        profile_name: "Administrador",
        is_active: true,
        permissions: MOCK_PERMISSIONS,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }),
    });
  };

  await page.route("**/auth/validate", validateHandler);
  await page.route("**/auth/me", profileHandler);

  return {
    dispose: async () => {
      await page.unroute("**/auth/validate", validateHandler);
      await page.unroute("**/auth/me", profileHandler);
    },
  };
};

const interceptVehiculos = async (page: Page) => {
  const handler = async (route: Route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "veh-1",
            placa: "ABC123",
            conductor: "Laura Ríos",
            numeroEntregas: 4,
          },
        ],
        total: 1,
        page: 1,
        limit: 5,
        totalPages: 1,
      }),
    });
  };

  await page.route("**/vehiculos**", handler);

  return {
    dispose: async () => {
      await page.unroute("**/vehiculos**", handler);
    },
  };
};

const interceptInventory = async (page: Page, config: InventoryConfig) => {
  const rutas: Array<{ url: string; handler: Parameters<Page["route"]>[1] }> = [];

  const registerRoute = async (url: string, handler: Parameters<Page["route"]>[1]) => {
    await page.route(url, handler);
    rutas.push({ url, handler });
  };

  await registerRoute("**/logistica/productos", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: config.productos }),
    });
  });

  await registerRoute("**/logistica/bodegas", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: config.bodegas }),
    });
  });

  await registerRoute("**/logistica/bodegas/*/productos/*", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    const [warehouseId, sku] = url.pathname
      .split("/logistica/bodegas/")[1]
      .split("/productos/");
    const key = `${decodeURIComponent(warehouseId)}::${decodeURIComponent(sku)}`;
    const ubicacion = config.ubicaciones.get(key);

    if (ubicacion === undefined) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Producto no localizado en esta bodega" }),
      });
      return;
    }

    if (ubicacion === null) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Producto no localizado en esta bodega" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ location: ubicacion }),
    });
  });

  await registerRoute("**/logistica/productos/*/disponibilidad", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    const sku = decodeURIComponent(url.pathname.split("/logistica/productos/")[1].split("/disponibilidad")[0]);
    const disponibilidad = config.disponibilidad.get(sku);

    if (!disponibilidad) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Producto sin disponibilidad en bodega" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        warehouse: {
          id: disponibilidad.warehouseId,
          nombre: disponibilidad.warehouseName,
        },
      }),
    });
  });

  return {
    dispose: async () => {
      for (const { url, handler } of rutas) {
        await page.unroute(url, handler);
      }
    },
  };
};

const gotoLogistica = async (page: Page) => {
  await page.addInitScript(
    ([token, payload]) => {
      localStorage.setItem("auth_token", token as string);
      localStorage.setItem("user_data", JSON.stringify(payload));
    },
    [
      MOCK_TOKEN,
      {
        user: {
          id: "admin-id",
          email: "admin@example.com",
          name: "Administrador",
          profileName: "Administrador",
        },
        permissions: MOCK_PERMISSIONS,
      },
    ]
  );

  await page.goto("./logistica");
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Gestión Logística", exact: true })
  ).toBeVisible();
};

test.describe("HUP-009 y HUP-010 - Gestión logística", () => {
  test("permite localizar productos y consultar disponibilidad en bodegas", async ({ page }) => {
    const auth = await interceptAuth(page);
    const vehiculos = await interceptVehiculos(page);

    const productos = [
      { sku: "SKU-001", nombre: "Router empresarial" },
      { sku: "SKU-002", nombre: "Switch administrable" },
      { sku: "SKU-003", nombre: "Access point" },
    ];
    const bodegas = [
      { id: "wh-norte", nombre: "Bodega Norte" },
      { id: "wh-central", nombre: "Bodega Central" },
    ];

    const ubicaciones = new Map<string, string | null>([
      ["wh-norte::SKU-001", "Z4-2"],
      ["wh-norte::SKU-002", null],
    ]);

    const disponibilidad = new Map<
      string,
      { warehouseId: string; warehouseName: string } | null
    >([
      ["SKU-001", { warehouseId: "wh-central", warehouseName: "Bodega Central" }],
      ["SKU-003", null],
    ]);

    const inventory = await interceptInventory(page, {
      productos,
      bodegas,
      ubicaciones,
      disponibilidad,
    });

    try {
      await gotoLogistica(page);

      const productoLocatorSelect = page.getByLabel(/seleccionar producto/i).first();
      const bodegaSelect = page.getByLabel(/seleccionar bodega/i);
      const localizarButton = page.getByRole("button", { name: "Localizar" });

      await expect(localizarButton).toBeDisabled();

      await productoLocatorSelect.click();
      await page
        .getByRole("option", { name: /SKU-001 - Router empresarial/i })
        .click();
      await bodegaSelect.click();
      await page.getByRole("option", { name: /Bodega Norte/i }).click();

      await expect(localizarButton).toBeEnabled();
      await localizarButton.click();

      await expect(page.locator('div[role="status"]').first()).toContainText(
        "Z4-2"
      );

      await productoLocatorSelect.click();
      await page
        .getByRole("option", { name: /SKU-002 - Switch administrable/i })
        .click();
      await bodegaSelect.click();
      await page.getByRole("option", { name: /Bodega Norte/i }).click();
      await localizarButton.click();

      await expect(page.locator('div[role="status"]').first()).toContainText(
        /Producto no localizado en esta bodega/i
      );

      const disponibilidadSelect = page
        .getByLabel(/seleccionar producto/i)
        .nth(1);
      const consultarButton = page.getByRole("button", { name: "Consultar" });

      await expect(consultarButton).toBeDisabled();

      await disponibilidadSelect.click();
      await page
        .getByRole("option", { name: /SKU-001 - Router empresarial/i })
        .click();
      await expect(consultarButton).toBeEnabled();
      await consultarButton.click();
      await expect(page.locator('div[role="status"]').nth(1)).toContainText(
        /Disponible en/i
      );
      await expect(page.locator('div[role="status"]').nth(1)).toContainText(
        /Bodega Central/i
      );

      await disponibilidadSelect.click();
      await page
        .getByRole("option", { name: /SKU-003 - Access point/i })
        .click();
      await consultarButton.click();
      await expect(page.locator('div[role="status"]').nth(1)).toContainText(
        /Producto sin disponibilidad en bodega/i
      );
    } finally {
      await inventory.dispose();
      await vehiculos.dispose();
      await auth.dispose();
    }
  });
});
