import { describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { createPlanVenta } from "@/services/planesVenta.service";

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

describe("planesVenta.service - integration", () => {
  it("envía la creación de planes al backend y normaliza la respuesta", async () => {
    const requests: Array<{ path: string; payload: unknown }> = [];

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
            meta: "180",
            id: "plan-generated",
            vendedor_id: parsed.vendedorId,
            vendedor_nombre: "Ana Pérez",
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

    vi.stubEnv("VITE_SALESFORCE_API_URL", server.url);

    try {
      const result = await createPlanVenta({
        identificador: "PV-2025-Q1",
        nombre: "Plan Q1",
        descripcion: "Plan del primer trimestre",
        periodo: "2025-Q1",
        meta: 180,
        vendedorId: "vend-1",
      });

      expect(requests).toEqual([
        {
          path: "/planes-venta/",
          payload: {
            identificador: "PV-2025-Q1",
            nombre: "Plan Q1",
            descripcion: "Plan del primer trimestre",
            periodo: "2025-Q1",
            meta: 180,
            vendedorId: "vend-1",
          },
        },
      ]);

      expect(result).toEqual({
        id: "plan-generated",
        identificador: "PV-2025-Q1",
        nombre: "Plan Q1",
        descripcion: "Plan del primer trimestre",
        periodo: "2025-Q1",
        meta: 180,
        vendedorId: "vend-1",
        vendedorNombre: "Ana Pérez",
        unidadesVendidas: 0,
      });
    } finally {
      await server.close();
      vi.unstubAllEnvs();
    }
  });
});
