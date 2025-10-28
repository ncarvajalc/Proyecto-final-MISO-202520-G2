import { describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { getPlanesVenta } from "@/services/planesVenta.service";

import { startHttpServer } from "./httpServerTestUtils";

describe("planesVenta.service - functional", () => {
  it("consume un backend HTTP real para listar planes", async () => {
    const requests: Array<{ method: string; page: number; limit: number }> = [];
    faker.seed(333);

    const plan = {
      id: faker.string.uuid(),
      identificador: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
      nombre: faker.commerce.productName(),
      descripcion: faker.lorem.sentence(),
      periodo: `${faker.date.future({ years: 1 }).getFullYear()}-Q${faker.number.int({ min: 1, max: 4 })}`,
      meta: faker.number.int({ min: 50, max: 500 }),
      vendedorId: faker.string.uuid(),
      vendedorNombre: faker.person.fullName(),
      unidadesVendidas: faker.number.int({ min: 0, max: 200 }),
    };
    const total = faker.number.int({ min: 2, max: 10 });
    const page = faker.number.int({ min: 1, max: 5 });
    const limit = faker.number.int({ min: 1, max: 3 });
    const totalPages = faker.number.int({ min: 1, max: 5 });

    const server = await startHttpServer((req, res) => {
      const url = new URL(req.url ?? "", "http://127.0.0.1");

      if (req.method === "GET" && url.pathname === "/planes-venta/") {
        requests.push({
          method: req.method,
          page: Number(url.searchParams.get("page")),
          limit: Number(url.searchParams.get("limit")),
        });

        const body = {
          data: [plan],
          total,
          page: Number(url.searchParams.get("page")),
          limit: Number(url.searchParams.get("limit")),
          totalPages,
        };

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify(body));
        return;
      }

      res.writeHead(404, { "Access-Control-Allow-Origin": "*" });
      res.end();
    });

    vi.stubEnv("VITE_API_URL", server.url);

    try {
      const result = await getPlanesVenta({ page, limit });

      expect(requests).toEqual([
        {
          method: "GET",
          page,
          limit,
        },
      ]);
      expect(result).toEqual({
        data: [plan],
        total,
        page,
        limit,
        totalPages,
      });
      expect(result.totalPages).toBe(totalPages);
    } finally {
      await server.close();
      vi.unstubAllEnvs();
    }
  });
});
