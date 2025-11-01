import { faker } from "@faker-js/faker";
import { expect, it, vi } from "vitest";

import { createPlanVenta } from "@/services/planesVenta.service";

import { startHttpServer } from "./httpServerTestUtils";

export const runPlanesVentaServiceIntegrationSuite = () => {
  it("envía la creación de planes al backend y normaliza la respuesta", async () => {
    const requests: Array<{ path: string; payload: unknown }> = [];
    faker.seed(712);

    const identificador = faker.string.alphanumeric({ length: 8 }).toUpperCase();
    const nombre = faker.commerce.productName();
    const descripcion = faker.lorem.sentence();
    const periodo = `${faker.date
      .future({ years: 1 })
      .getFullYear()}-Q${faker.number.int({ min: 1, max: 4 })}`;
    const meta = faker.number.int({ min: 100, max: 400 });
    const vendedorId = faker.string.uuid();
    const responseId = faker.string.uuid();
    const vendedorNombre = faker.person.fullName();

    const server = await startHttpServer((req, res) => {
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        });
        res.end();
        return;
      }

      if (req.method === "POST" && req.url === "/planes-venta/") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          const parsed = JSON.parse(body || "{}");
          requests.push({ path: req.url ?? "", payload: parsed });

          const responseBody = {
            ...parsed,
            meta: String(meta),
            id: responseId,
            vendedor_id: parsed.vendedorId,
            vendedor_nombre: vendedorNombre,
            unidades_vendidas: undefined,
          };

          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify(responseBody));
        });
        return;
      }

      res.writeHead(404, { "Access-Control-Allow-Origin": "*" });
      res.end();
    });

    vi.stubEnv("VITE_API_URL", server.url);

    try {
      const result = await createPlanVenta({
        identificador,
        nombre,
        descripcion,
        periodo,
        meta,
        vendedorId,
      });

      expect(requests).toEqual([
        {
          path: "/planes-venta/",
          payload: {
            identificador,
            nombre,
            descripcion,
            periodo,
            meta,
            vendedorId,
          },
        },
      ]);

      expect(result).toEqual({
        id: responseId,
        identificador,
        nombre,
        descripcion,
        periodo,
        meta,
        vendedorId,
        vendedorNombre,
        unidadesVendidas: 0,
      });
    } finally {
      await server.close();
      vi.unstubAllEnvs();
    }
  });
};
