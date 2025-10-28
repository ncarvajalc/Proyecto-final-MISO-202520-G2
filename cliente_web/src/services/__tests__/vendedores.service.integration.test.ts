import { describe, expect, it } from "vitest";
import { faker } from "@faker-js/faker";

import { getVendedor } from "@/services/vendedores.service";

import {
  buildPlan,
  buildVendor,
  vendorResponse,
  withVendorServer,
} from "./vendedoresTestUtils";

describe("vendedores.service - integration", () => {
  it("consulta el detalle del vendedor y normaliza el plan", async () => {
    faker.seed(981);
    const vendor = buildVendor();
    const plan = buildPlan();
    const requests: string[] = [];

    await withVendorServer((req, res) => {
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

      if (req.method === "GET" && req.url === `/vendedores/${vendor.id}`) {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify(vendorResponse(vendor, [plan])));
        return;
      }

      res.writeHead(404, { "Access-Control-Allow-Origin": "*" });
      res.end();
    }, async () => {
      const result = await getVendedor(vendor.id);

      expect(requests).toContain(`GET /vendedores/${vendor.id}`);
      expect(result).toEqual({
        id: vendor.id,
        nombre: vendor.full_name,
        correo: vendor.email,
        fechaContratacion: vendor.hire_date,
        planDeVenta: {
          identificador: plan.identificador,
          nombre: plan.nombre,
          descripcion: plan.descripcion,
          periodo: plan.periodo,
          meta: plan.meta,
          unidadesVendidas: plan.unidades_vendidas,
        },
      });
    });
  });

  it("devuelve planDeVenta null cuando el backend no envía planes", async () => {
    faker.seed(982);
    const vendor = buildVendor();

    await withVendorServer((req, res) => {
      if (req.method === "GET" && req.url === `/vendedores/${vendor.id}`) {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify(vendorResponse(vendor, [])));
        return;
      }

      res.writeHead(404, { "Access-Control-Allow-Origin": "*" });
      res.end();
    }, async () => {
      const result = await getVendedor(vendor.id);
      expect(result.planDeVenta).toBeNull();
    });
  });
});
