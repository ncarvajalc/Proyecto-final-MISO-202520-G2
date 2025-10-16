import { describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { faker } from "@faker-js/faker";

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
    faker.seed(1603);

    const payload = {
      identificador: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
      nombre: faker.commerce.productName(),
      descripcion: faker.lorem.sentence(),
      periodo: `${faker.date.future({ years: 1 }).getFullYear()}-Q${faker.number.int({ min: 1, max: 4 })}`,
      meta: faker.number.int({ min: 100, max: 400 }),
      vendedorId: faker.string.uuid(),
    };
    const vendedorNombre = faker.person.fullName();
    const unidadesVendidas = faker.number.int({ min: 1, max: 25 });

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
          const id = faker.string.uuid();
          const stored = {
            ...parsed,
            id,
            meta: parsed.meta,
            vendedor_nombre: vendedorNombre,
            unidades_vendidas: unidadesVendidas,
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

    vi.stubEnv("VITE_API_URL", server.url);

    try {
      const created = await createPlanVenta({
        identificador: payload.identificador,
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        periodo: payload.periodo,
        meta: payload.meta,
        vendedorId: payload.vendedorId,
      });

      expect(created.vendedorNombre).toBe(vendedorNombre);
      expect(created.unidadesVendidas).toBe(unidadesVendidas);

      const listado = await getPlanesVenta({ page: 1, limit: 5 });

      expect(listado.total).toBe(1);
      expect(listado.totalPages).toBe(1);
      expect(listado.data[0].id).toBe(created.id);
      expect(listado.data[0].vendedorNombre).toBe(vendedorNombre);
      expect(listado.data[0].unidadesVendidas).toBe(unidadesVendidas);
    } finally {
      await server.close();
      vi.unstubAllEnvs();
    }
  });
});
