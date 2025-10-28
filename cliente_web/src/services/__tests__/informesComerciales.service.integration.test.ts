import { describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import {
  createInformeComercial,
  getInformesComerciales,
} from "@/services/informesComerciales.service";

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

describe("informesComerciales.service - integration", () => {
  it("envía la creación de informes al backend y normaliza la respuesta", async () => {
    const requests: Array<{ path: string; payload: unknown }> = [];
    faker.seed(713);

    const nombre = faker.commerce.productName();
    const responseId = faker.string.uuid();
    const responseDate = faker.date.recent().toISOString();
    const ventasTotales = faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 });
    const unidadesVendidas = faker.number.float({ min: 50, max: 500, fractionDigits: 2 });

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

      if (req.method === "POST" && req.url === "/informes-comerciales/") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          const parsed = JSON.parse(body || "{}");
          requests.push({ path: req.url ?? "", payload: parsed });

          const responseBody = {
            id: responseId,
            nombre: parsed.nombre,
            fecha: responseDate,
            ventas_totales: ventasTotales,
            unidades_vendidas: unidadesVendidas,
          };

          res.writeHead(201, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify(responseBody));
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    vi.stubEnv("VITE_API_URL", server.url);

    const result = await createInformeComercial({ nombre });

    expect(requests).toHaveLength(1);
    expect(requests[0]).toEqual({
      path: "/informes-comerciales/",
      payload: { nombre },
    });

    expect(result).toEqual({
      id: responseId,
      nombre,
      fecha: responseDate,
      ventasTotales,
      unidadesVendidas,
    });

    await server.close();
  });

  it("envía solicitud de lista con paginación y normaliza la respuesta", async () => {
    faker.seed(714);

    const informes = Array.from({ length: 2 }, () => ({
      id: faker.string.uuid(),
      nombre: faker.commerce.productName(),
      fecha: faker.date.recent().toISOString(),
      ventas_totales: faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }),
      unidades_vendidas: faker.number.float({ min: 50, max: 500, fractionDigits: 2 }),
    }));

    let capturedUrl = "";

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

      if (req.method === "GET" && req.url?.startsWith("/informes-comerciales/")) {
        capturedUrl = req.url;

        const responseBody = {
          data: informes,
          total: 10,
          page: 1,
          limit: 5,
          total_pages: 2,
        };

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify(responseBody));
        return;
      }

      res.writeHead(404);
      res.end();
    });

    vi.stubEnv("VITE_API_URL", server.url);

    const result = await getInformesComerciales({ page: 1, limit: 5 });

    expect(capturedUrl).toContain("page=1");
    expect(capturedUrl).toContain("limit=5");

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(10);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(5);
    expect(result.totalPages).toBe(2);
    expect(result.data[0].ventasTotales).toBe(informes[0].ventas_totales);
    expect(result.data[0].unidadesVendidas).toBe(informes[0].unidades_vendidas);

    await server.close();
  });
});

