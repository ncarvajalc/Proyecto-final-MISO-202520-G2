import { describe, expect, it } from "vitest";
import { faker } from "@faker-js/faker";

import { getVendedor, getVendedores } from "@/services/vendedores.service";

import {
  buildPlan,
  buildVendor,
  vendorListResponse,
  vendorResponse,
  withVendorServer,
} from "./vendedoresTestUtils";

type VendorServerHandler = Parameters<typeof withVendorServer>[0];
type VendorPlan = ReturnType<typeof buildPlan>;

const vendorServiceHandler = (
  vendor: ReturnType<typeof buildVendor>,
  planProvider: () => VendorPlan[]
): VendorServerHandler => {
  return (req, res) => {
    const url = new URL(req.url ?? "", "http://localhost");

    if (req.method === "GET" && url.pathname === "/vendedores/") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify(vendorListResponse(vendor)));
      return;
    }

    if (req.method === "GET" && url.pathname === `/vendedores/${vendor.id}`) {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify(vendorResponse(vendor, planProvider())));
      return;
    }

    res.writeHead(404, { "Access-Control-Allow-Origin": "*" });
    res.end();
  };
};

describe("vendedores.service - acceptance", () => {
  it("recupera listado y reporte detallado de un vendedor", async () => {
    faker.seed(1091);
    const vendor = buildVendor();
    const plan = buildPlan();

    await withVendorServer(
      vendorServiceHandler(vendor, () => [plan]),
      async () => {
        const listado = await getVendedores({ page: 1, limit: 10 });
        expect(listado.data[0]!.id).toBe(vendor.id);
        expect(listado.totalPages).toBe(1);

        const detalle = await getVendedor(vendor.id);
        expect(detalle.planDeVenta).toEqual({
          identificador: plan.identificador,
          nombre: plan.nombre,
          descripcion: plan.descripcion,
          periodo: plan.periodo,
          meta: plan.meta,
          unidadesVendidas: plan.unidades_vendidas,
        });
      }
    );
  });

  it("propaga la ausencia de plan cuando no hay registros", async () => {
    faker.seed(1092);
    const vendor = buildVendor();

    await withVendorServer(
      vendorServiceHandler(vendor, () => []),
      async () => {
        const listado = await getVendedores({ page: 1, limit: 10 });
        expect(listado.data).toHaveLength(1);

        const detalle = await getVendedor(vendor.id);
        expect(detalle.planDeVenta).toBeNull();
      }
    );
  });
});
