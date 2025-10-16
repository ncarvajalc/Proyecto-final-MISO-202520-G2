import { describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { getVendedor, getVendedores } from "@/services/vendedores.service";

const startServer = async (
  handler: Parameters<typeof createServer>[0]
): Promise<{ url: string; close: () => Promise<void> }> => {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
};

describe("vendedores.service - acceptance", () => {
  it("recupera listado y reporte detallado de un vendedor", async () => {
    faker.seed(1091);
    const vendorId = faker.string.uuid();
    const fullName = faker.person.fullName();
    const email = faker.internet.email();
    const hireDate = faker.date.past({ years: 2 }).toISOString().split("T")[0];
    const plan = {
      identificador: "PV-ACPT-001",
      nombre: "Plan Estratégico",
      descripcion: "Plan corporativo",
      periodo: "2025-Q2",
      meta: 75000,
      unidades_vendidas: 18000,
    };

    const server = await startServer((req, res) => {
      const url = new URL(req.url ?? "", "http://localhost");

      if (req.method === "GET" && url.pathname === "/vendedores/") {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(
          JSON.stringify({
            data: [
              {
                id: vendorId,
                full_name: fullName,
                email,
                hire_date: hireDate,
                status: "active",
                created_at: `${hireDate}T00:00:00Z`,
                updated_at: `${hireDate}T00:00:00Z`,
              },
            ],
            total: 1,
            page: Number(url.searchParams.get("page")),
            limit: Number(url.searchParams.get("limit")),
            total_pages: 1,
          })
        );
        return;
      }

      if (req.method === "GET" && url.pathname === `/vendedores/${vendorId}`) {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(
          JSON.stringify({
            id: vendorId,
            full_name: fullName,
            email,
            hire_date: hireDate,
            status: "active",
            created_at: `${hireDate}T00:00:00Z`,
            updated_at: `${hireDate}T00:00:00Z`,
            sales_plans: [plan],
          })
        );
        return;
      }

      res.writeHead(404, { "Access-Control-Allow-Origin": "*" });
      res.end();
    });

    vi.stubEnv("VITE_API_URL", server.url);

    try {
      const listado = await getVendedores({ page: 1, limit: 10 });
      expect(listado.data).toHaveLength(1);
      expect(listado.data[0]!.id).toBe(vendorId);
      expect(listado.totalPages).toBe(1);

      const detalle = await getVendedor(vendorId);
      expect(detalle.planDeVenta).not.toBeNull();
      expect(detalle.planDeVenta).toEqual({
        identificador: plan.identificador,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        periodo: plan.periodo,
        meta: plan.meta,
        unidadesVendidas: plan.unidades_vendidas,
      });
    } finally {
      await server.close();
      vi.unstubAllEnvs();
    }
  });

  it("propaga la ausencia de plan cuando no hay registros", async () => {
    faker.seed(1092);
    const vendorId = faker.string.uuid();
    const fullName = faker.person.fullName();
    const email = faker.internet.email();
    const hireDate = faker.date.past({ years: 1 }).toISOString().split("T")[0];

    const server = await startServer((req, res) => {
      const url = new URL(req.url ?? "", "http://localhost");

      if (req.method === "GET" && url.pathname === "/vendedores/") {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(
          JSON.stringify({
            data: [
              {
                id: vendorId,
                full_name: fullName,
                email,
                hire_date: hireDate,
                status: "inactive",
                created_at: `${hireDate}T00:00:00Z`,
                updated_at: `${hireDate}T00:00:00Z`,
              },
            ],
            total: 1,
            page: Number(url.searchParams.get("page")),
            limit: Number(url.searchParams.get("limit")),
            total_pages: 1,
          })
        );
        return;
      }

      if (req.method === "GET" && url.pathname === `/vendedores/${vendorId}`) {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(
          JSON.stringify({
            id: vendorId,
            full_name: fullName,
            email,
            hire_date: hireDate,
            status: "inactive",
            created_at: `${hireDate}T00:00:00Z`,
            updated_at: `${hireDate}T00:00:00Z`,
            sales_plans: [],
          })
        );
        return;
      }

      res.writeHead(404, { "Access-Control-Allow-Origin": "*" });
      res.end();
    });

    vi.stubEnv("VITE_API_URL", server.url);

    try {
      const listado = await getVendedores({ page: 1, limit: 5 });
      expect(listado.data[0]!.planDeVenta).toBeNull();

      const detalle = await getVendedor(vendorId);
      expect(detalle.planDeVenta).toBeNull();
    } finally {
      await server.close();
      vi.unstubAllEnvs();
    }
  });
});
