import { describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { getPlanesVenta } from "@/services/planesVenta.service";

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

describe("planesVenta.service - functional", () => {
  it("consume un backend HTTP real para listar planes", async () => {
    const requests: Array<{ method: string; page: number; limit: number }> = [];

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

      if (req.method === "GET" && url.pathname === "/planes-venta/") {
        requests.push({
          method: req.method,
          page: Number(url.searchParams.get("page")),
          limit: Number(url.searchParams.get("limit")),
        });

        const body = {
          data: [
            {
              id: "plan-1",
              identificador: "PV-2025-Q1",
              nombre: "Plan Q1",
              descripcion: "Plan del primer trimestre",
              periodo: "2025-Q1",
              meta: 150,
              vendedorId: "vend-1",
              vendedorNombre: "Laura Pérez",
              unidadesVendidas: 25,
            },
          ],
          total: 3,
          page: Number(url.searchParams.get("page")),
          limit: Number(url.searchParams.get("limit")),
          totalPages: 3,
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

    vi.stubEnv("VITE_SALESFORCE_API_URL", server.url);

    try {
      const result = await getPlanesVenta({ page: 2, limit: 1 });

      expect(requests).toEqual([
        {
          method: "GET",
          page: 2,
          limit: 1,
        },
      ]);
      expect(result).toEqual({
        data: [
          {
            id: "plan-1",
            identificador: "PV-2025-Q1",
            nombre: "Plan Q1",
            descripcion: "Plan del primer trimestre",
            periodo: "2025-Q1",
            meta: 150,
            vendedorId: "vend-1",
            vendedorNombre: "Laura Pérez",
            unidadesVendidas: 25,
          },
        ],
        total: 3,
        page: 2,
        limit: 1,
        totalPages: 3,
      });
    } finally {
      await server.close();
      vi.unstubAllEnvs();
    }
  });
});
