import { faker } from "@faker-js/faker";
import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  loginAsAdmin,
  buildVendedorPayload,
  interceptAuthBootstrap,
  interceptVendedoresList,
  waitForVendorListResponse,
  gotoVendedores,
  trackVendedoresRequests,
  waitForToastWithText,
  interceptVendedorDetalle,
  waitForVendedorDetalleResponse,
  type VendedorResponse,
  type VendedorDetalleMock,
  type VendedorPlanDetalle,
} from "./utils/vendedores";

const buildVendedorRespuesta = (
  overrides: Partial<VendedorResponse> = {}
): VendedorResponse => ({
  id: overrides.id ?? faker.string.uuid(),
  ...buildVendedorPayload("HUP007", overrides),
  fechaContratacion:
    overrides.fechaContratacion ?? new Date().toISOString().split("T")[0],
});

test.describe.serial("HUP-007 Consulta de reportes de vendedor", () => {
  let adminToken: string;
  let storagePayload: { user: unknown; permissions: string[] };
  const authMocks: { dispose: () => Promise<void> }[] = [];

  test.beforeAll(async () => {
    const auth = await loginAsAdmin();
    adminToken = auth.token;
    storagePayload = auth.storagePayload;
  });

  test.beforeEach(async ({ page }) => {
    const authMock = await interceptAuthBootstrap(page, {
      token: adminToken,
      permissions: storagePayload.permissions ?? [],
      profile: {
        id: "admin-id",
        username: "Administrador",
        email: ADMIN_EMAIL,
      },
    });
    authMocks.push(authMock);

    await page.addInitScript(
      ([token, payload]) => {
        localStorage.setItem("auth_token", token as string);
        localStorage.setItem("user_data", JSON.stringify(payload));
      },
      [adminToken, storagePayload]
    );
  });

  test.afterEach(async () => {
    while (authMocks.length > 0) {
      const mock = authMocks.pop();
      if (mock) {
        await mock.dispose();
      }
    }
  });

  test("Muestra el detalle del plan de venta con indicadores y cumplimiento", async ({ page }) => {
    const vendedor = buildVendedorRespuesta({ nombre: "Camila Duarte" });
    const plan: VendedorPlanDetalle = {
      identificador: "PV-2025-Q1",
      nombre: "Plan Q1",
      descripcion: "Plan trimestral",
      periodo: "2025-Q1",
      meta: 150,
      unidadesVendidas: 120,
    };
    const detalle: VendedorDetalleMock = {
      ...vendedor,
      planDeVenta: plan,
    };

    const tracker = trackVendedoresRequests(page);
    const listadoIntercept = await interceptVendedoresList(page, [vendedor]);
    const detalleIntercept = await interceptVendedorDetalle(page, {
      id: vendedor.id,
      detail: detalle,
    });

    try {
      const listadoResponsePromise = waitForVendorListResponse(page);
      await gotoVendedores(page);
      await listadoResponsePromise;

      const fila = page
        .getByRole("row")
        .filter({ hasText: new RegExp(vendedor.correo, "i") })
        .first();

      const detalleResponsePromise = waitForVendedorDetalleResponse(
        page,
        vendedor.id
      );
      await fila.getByRole("button", { name: /Ver asignaciones/i }).click();
      const detalleResponse = await detalleResponsePromise;
      expect(detalleResponse.ok()).toBeTruthy();

      const modal = page.getByRole("dialog", { name: /Reporte Vendedor/i });
      await expect(modal).toBeVisible();
      await expect(modal.getByText(vendedor.id)).toBeVisible();
      await expect(modal.getByText(vendedor.nombre)).toBeVisible();
      await expect(modal.getByText(vendedor.correo)).toBeVisible();
      await expect(modal.getByText(plan.identificador)).toBeVisible();
      await expect(
        modal
          .locator('label:has-text("Unidades Vendidas") + p')
          .first()
      ).toHaveText(String(plan.unidadesVendidas));
      await expect(
        modal.locator('label:has-text("Meta") + p').first()
      ).toHaveText(String(plan.meta));

      const cumplimiento = ((plan.unidadesVendidas / plan.meta) * 100).toFixed(2);
      await expect(
        modal.locator('label:has-text("Cumplimiento de plan") + p').first()
      ).toHaveText(new RegExp(`${cumplimiento}\\s*%`));

      tracker.assertAllAuthorized();
    } finally {
      tracker.stop();
      await detalleIntercept.dispose();
      await listadoIntercept.dispose();
    }
  });

  test("Muestra mensaje cuando el vendedor no tiene plan de venta asignado", async ({ page }) => {
    const vendedor = buildVendedorRespuesta({ nombre: "Santiago Núñez" });
    const detalle: VendedorDetalleMock = {
      ...vendedor,
      planDeVenta: null,
    };

    const tracker = trackVendedoresRequests(page);
    const listadoIntercept = await interceptVendedoresList(page, [vendedor]);
    const detalleIntercept = await interceptVendedorDetalle(page, {
      id: vendedor.id,
      detail: detalle,
    });

    try {
      const listadoResponsePromise = waitForVendorListResponse(page);
      await gotoVendedores(page);
      await listadoResponsePromise;

      const fila = page
        .getByRole("row")
        .filter({ hasText: new RegExp(vendedor.correo, "i") })
        .first();

      const detalleResponsePromise = waitForVendedorDetalleResponse(
        page,
        vendedor.id
      );
      await fila.getByRole("button", { name: /Ver asignaciones/i }).click();
      const detalleResponse = await detalleResponsePromise;
      expect(detalleResponse.ok()).toBeTruthy();

      const modal = page.getByRole("dialog", { name: /Reporte Vendedor/i });
      await expect(modal).toBeVisible();
      await expect(
        modal.getByText(/Este vendedor no tiene un plan de venta asignado/i)
      ).toBeVisible();
      await expect(modal.locator("text=Indicadores Clave")).toHaveCount(0);

      tracker.assertAllAuthorized();
    } finally {
      tracker.stop();
      await detalleIntercept.dispose();
      await listadoIntercept.dispose();
    }
  });

  test("Calcula cumplimiento en 0% cuando no hay unidades vendidas", async ({ page }) => {
    const vendedor = buildVendedorRespuesta({ nombre: "Valeria Pineda" });
    const plan: VendedorPlanDetalle = {
      identificador: "PV-2025-Q2",
      nombre: "Plan Q2",
      descripcion: "Plan trimestral",
      periodo: "2025-Q2",
      meta: 90,
      unidadesVendidas: 0,
    };
    const detalle: VendedorDetalleMock = {
      ...vendedor,
      planDeVenta: plan,
    };

    const tracker = trackVendedoresRequests(page);
    const listadoIntercept = await interceptVendedoresList(page, [vendedor]);
    const detalleIntercept = await interceptVendedorDetalle(page, {
      id: vendedor.id,
      detail: detalle,
    });

    try {
      const listadoResponsePromise = waitForVendorListResponse(page);
      await gotoVendedores(page);
      await listadoResponsePromise;

      const fila = page
        .getByRole("row")
        .filter({ hasText: new RegExp(vendedor.correo, "i") })
        .first();

      const detalleResponsePromise = waitForVendedorDetalleResponse(
        page,
        vendedor.id
      );
      await fila.getByRole("button", { name: /Ver asignaciones/i }).click();
      const detalleResponse = await detalleResponsePromise;
      expect(detalleResponse.ok()).toBeTruthy();

      const modal = page.getByRole("dialog", { name: /Reporte Vendedor/i });
      await expect(modal).toBeVisible();
      await expect(
        modal.locator('label:has-text("Unidades Vendidas") + p').first()
      ).toHaveText("0");
      await expect(
        modal.locator('label:has-text("Cumplimiento de plan") + p').first()
      ).toHaveText(/0\.00\s*%/);

      tracker.assertAllAuthorized();
    } finally {
      tracker.stop();
      await detalleIntercept.dispose();
      await listadoIntercept.dispose();
    }
  });

  test("Muestra notificación de error cuando falla la consulta del reporte", async ({ page }) => {
    const vendedor = buildVendedorRespuesta({ nombre: "Andrés Lozano" });

    const tracker = trackVendedoresRequests(page);
    const listadoIntercept = await interceptVendedoresList(page, [vendedor]);
    const detalleIntercept = await interceptVendedorDetalle(page, {
      id: vendedor.id,
      status: 500,
      body: { detail: "Server error" },
    });

    try {
      const listadoResponsePromise = waitForVendorListResponse(page);
      await gotoVendedores(page);
      await listadoResponsePromise;

      const fila = page
        .getByRole("row")
        .filter({ hasText: new RegExp(vendedor.correo, "i") })
        .first();

      const detalleResponsePromise = waitForVendedorDetalleResponse(
        page,
        vendedor.id
      );
      await fila.getByRole("button", { name: /Ver asignaciones/i }).click();
      const detalleResponse = await detalleResponsePromise;
      expect(detalleResponse.ok()).toBeFalsy();

      await waitForToastWithText(
        page,
        "No se pudo cargar la información del vendedor"
      );
      await expect(
        page.getByRole("dialog", { name: /Reporte Vendedor/i })
      ).toHaveCount(0);
      await expect(
        fila.getByRole("button", { name: /Ver asignaciones/i })
      ).toBeEnabled();

      tracker.assertAllAuthorized();
    } finally {
      tracker.stop();
      await detalleIntercept.dispose();
      await listadoIntercept.dispose();
    }
  });
});
