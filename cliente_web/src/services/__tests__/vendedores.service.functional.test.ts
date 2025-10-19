import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import { getVendedor, getVendedores } from "@/services/vendedores.service";

const getMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    get: getMock,
  })),
}));

describe("vendedores.service - functional", () => {
  faker.seed(567);
  let apiUrl: string;

  beforeEach(() => {
    getMock.mockReset();
    apiUrl = faker.internet.url();
    vi.stubEnv("VITE_API_URL", apiUrl);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prioriza el primer plan disponible cuando el backend envía múltiples", async () => {
    const vendorId = faker.string.uuid();
    const hireDate = faker.date.past({ years: 2 }).toISOString().split("T")[0];

    const primerPlan = {
      identificador: "PV-001",
      nombre: "Plan Inicial",
      descripcion: "Primer plan registrado",
      periodo: "2024-Q1",
      meta: 60000,
      unidades_vendidas: 15000,
    };

    const segundoPlan = {
      identificador: "PV-002",
      nombre: "Plan Histórico",
      descripcion: "Plan pasado",
      periodo: "2023-Q4",
      meta: 40000,
      unidades_vendidas: 32000,
    };

    getMock.mockResolvedValueOnce({
      id: vendorId,
      full_name: faker.person.fullName(),
      email: faker.internet.email(),
      hire_date: hireDate,
      status: "active",
      created_at: `${hireDate}T00:00:00Z`,
      updated_at: `${hireDate}T00:00:00Z`,
      sales_plans: [primerPlan, segundoPlan],
    });

    const result = await getVendedor(vendorId);

    expect(getMock).toHaveBeenCalledWith(`/vendedores/${vendorId}`);
    expect(result.planDeVenta).not.toBeNull();
    expect(result.planDeVenta).toEqual({
      identificador: primerPlan.identificador,
      nombre: primerPlan.nombre,
      descripcion: primerPlan.descripcion,
      periodo: primerPlan.periodo,
      meta: primerPlan.meta,
      unidadesVendidas: primerPlan.unidades_vendidas,
    });
  });

  it("retorna null cuando el backend responde sin la clave sales_plans", async () => {
    const vendorId = faker.string.uuid();
    const hireDate = faker.date.past({ years: 1 }).toISOString().split("T")[0];

    getMock.mockResolvedValueOnce({
      id: vendorId,
      full_name: faker.person.fullName(),
      email: faker.internet.email(),
      hire_date: hireDate,
      status: "inactive",
      created_at: `${hireDate}T00:00:00Z`,
      updated_at: `${hireDate}T00:00:00Z`,
    });

    const result = await getVendedor(vendorId);
    expect(result.planDeVenta).toBeNull();
  });

  it("normaliza el listado paginado para la consulta de reportes", async () => {
    const vendorId = faker.string.uuid();
    const fullName = faker.person.fullName();
    const email = faker.internet.email();
    const hireDate = faker.date.past({ years: 3 }).toISOString().split("T")[0];

    getMock.mockResolvedValueOnce({
      data: [
        {
          id: vendorId,
          full_name: fullName,
          email,
          hire_date: hireDate,
          status: "active",
          created_at: `${hireDate}T00:00:00Z`,
          updated_at: `${hireDate}T00:00:00Z`,
          sales_plans: [
            {
              identificador: "PV-LIST-001",
              nombre: "Plan Listado",
              descripcion: "Reporte anual",
              periodo: "2024-Q4",
              meta: 90000,
              unidades_vendidas: 45000,
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      limit: 5,
      total_pages: 1,
    });

    const listado = await getVendedores({ page: 1, limit: 5 });

    expect(getMock).toHaveBeenCalledWith(
      "/vendedores/",
      expect.objectContaining({ params: { page: 1, limit: 5 } })
    );
    expect(listado).toEqual({
      data: [
        {
          id: vendorId,
          nombre: fullName,
          correo: email,
          fechaContratacion: hireDate,
          planDeVenta: {
            identificador: "PV-LIST-001",
            nombre: "Plan Listado",
            descripcion: "Reporte anual",
            periodo: "2024-Q4",
            meta: 90000,
            unidadesVendidas: 45000,
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 5,
      totalPages: 1,
    });
  });
});
