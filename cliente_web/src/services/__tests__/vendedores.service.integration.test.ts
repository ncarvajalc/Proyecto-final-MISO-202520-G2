import { describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { getVendedor } from "@/services/vendedores.service";

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

describe("vendedores.service - integration", () => {
  it("consulta el detalle del vendedor y normaliza el plan", async () => {
    faker.seed(981);
    const vendorId = faker.string.uuid();
    const fullName = faker.person.fullName();
    const email = faker.internet.email();
    const hireDate = faker.date.past({ years: 2 }).toISOString().split("T")[0];
    const plan = {
      identificador: faker.string.alphanumeric(10),
      nombre: faker.commerce.productName(),
      descripcion: faker.lorem.sentence(),
      periodo: "2025-Q1",
      meta: faker.number.float({ min: 1000, max: 5000, fractionDigits: 0 }),
      unidades_vendidas: faker.number.float({ min: 100, max: 800, fractionDigits: 0 }),
    };

    const requests: string[] = [];
    const server = await startServer((req, res) => {
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        });
        res.end();
        return;
      }

      requests.push(`${req.method} ${req.url}`);

      if (req.method === "GET" && req.url === `/vendedores/${vendorId}`) {
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
      const result = await getVendedor(vendorId);

      expect(requests).toContain(`GET /vendedores/${vendorId}`);
      expect(result).toEqual({
        id: vendorId,
        nombre: fullName,
        correo: email,
        fechaContratacion: hireDate,
        planDeVenta: {
          identificador: plan.identificador,
          nombre: plan.nombre,
          descripcion: plan.descripcion,
          periodo: plan.periodo,
          meta: plan.meta,
          unidadesVendidas: plan.unidades_vendidas,
        },
      });
    } finally {
      await server.close();
      vi.unstubAllEnvs();
    }
  });

  it("devuelve planDeVenta null cuando el backend no envía planes", async () => {
    faker.seed(982);
    const vendorId = faker.string.uuid();
    const fullName = faker.person.fullName();
    const email = faker.internet.email();
    const hireDate = faker.date.past({ years: 1 }).toISOString().split("T")[0];

    const server = await startServer((req, res) => {
      if (req.method === "GET" && req.url === `/vendedores/${vendorId}`) {
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
      const result = await getVendedor(vendorId);
      expect(result.planDeVenta).toBeNull();
    } finally {
      await server.close();
      vi.unstubAllEnvs();
    }
  });
});
