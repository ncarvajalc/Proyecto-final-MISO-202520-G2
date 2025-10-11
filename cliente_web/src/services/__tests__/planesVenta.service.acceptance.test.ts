import { describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";

import { createPlanVenta, getPlanesVenta } from "@/services/planesVenta.service";
import type { PlanVenta } from "@/types/planVenta";

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

describe("planesVenta.service - acceptance", () => {
  it("permite crear un plan y luego listarlo con los datos normalizados", async () => {
    const plans: PlanVenta[] = [];

    const server = await startServer((req, res) => {
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        });
        res.end();
        return;
      }

      const url = new URL(req.url ?? "", "http://127.0.0.1");

      if (req.method === "POST" && url.pathname === "/planes-venta/") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          const parsed = JSON.parse(body || "{}");
          const id = randomUUID();
          const stored = {
            ...parsed,
            id,
            meta: parsed.meta,
            vendedor_nombre: "Lucía Gómez",
            unidades_vendidas: 12,
          };
          plans.push(stored);

          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify(stored));
        });
        return;
      }

      if (req.method === "GET" && url.pathname === "/planes-venta/") {
        const page = Number(url.searchParams.get("page")) || 1;
        const limit = Number(url.searchParams.get("limit")) || plans.length;

        const start = (page - 1) * limit;
        const paginated = plans.slice(start, start + limit);
        const totalPages = plans.length === 0 ? 0 : Math.ceil(plans.length / limit);

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(
          JSON.stringify({
            data: paginated,
            total: plans.length,
            page,
            limit,
            totalPages,
          })
        );
        return;
      }

      res.writeHead(404, { "Access-Control-Allow-Origin": "*" });
      res.end();
    });

    vi.stubEnv("VITE_SALESFORCE_API_URL", server.url);

    try {
      const created = await createPlanVenta({
        identificador: "PV-2025-Q4",
        nombre: "Plan Q4",
        descripcion: "Plan del cuarto trimestre",
        periodo: "2025-Q4",
        meta: 210,
        vendedorId: "vend-9",
      });

      expect(created.vendedorNombre).toBe("Lucía Gómez");
      expect(created.unidadesVendidas).toBe(12);

      const listado = await getPlanesVenta({ page: 1, limit: 5 });

      expect(listado.total).toBe(1);
      expect(listado.totalPages).toBe(1);
      expect(listado.data[0].id).toBe(created.id);
      expect(listado.data[0].vendedorNombre).toBe("Lucía Gómez");
      expect(listado.data[0].unidadesVendidas).toBe(12);
    } finally {
      await server.close();
      vi.unstubAllEnvs();
    }
  });
});
