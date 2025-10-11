import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlanVenta, getPlanesVenta } from "@/services/planesVenta.service";

const postMock = vi.fn();
const getMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    post: postMock,
    get: getMock,
  })),
}));

describe("planesVenta.service - unit", () => {
  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_SALESFORCE_API_URL", "https://salesforce.test");
  });

  it("envía el payload esperado y normaliza la respuesta", async () => {
    const backendResponse = {
      id: "plan-1",
      identificador: "PV-2025-Q1",
      nombre: "Plan Q1",
      descripcion: "Plan del primer trimestre",
      periodo: "2025-Q1",
      meta: "150",
      vendedor_id: "vend-1",
      vendedor_nombre: "Laura Pérez",
      unidades_vendidas: 0,
    };

    postMock.mockResolvedValue(backendResponse);

    const result = await createPlanVenta({
      identificador: "PV-2025-Q1",
      nombre: "Plan Q1",
      descripcion: "Plan del primer trimestre",
      periodo: "2025-Q1",
      meta: 150,
      vendedorId: "vend-1",
    });

    const { ApiClient } = await import("@/lib/api-client");
    expect(ApiClient).toHaveBeenCalledWith("https://salesforce.test");
    expect(postMock).toHaveBeenCalledWith("/planes-venta/", {
      identificador: "PV-2025-Q1",
      nombre: "Plan Q1",
      descripcion: "Plan del primer trimestre",
      periodo: "2025-Q1",
      meta: 150,
      vendedorId: "vend-1",
    });

    expect(result).toEqual({
      id: "plan-1",
      identificador: "PV-2025-Q1",
      nombre: "Plan Q1",
      descripcion: "Plan del primer trimestre",
      periodo: "2025-Q1",
      meta: 150,
      vendedorId: "vend-1",
      vendedorNombre: "Laura Pérez",
      unidadesVendidas: 0,
    });
  });

  it("maneja respuestas parciales del backend", async () => {
    postMock.mockResolvedValue({
      id: "plan-2",
      identificador: "PV-2025-Q2",
      nombre: "Plan Q2",
      descripcion: "Plan del segundo trimestre",
      periodo: "2025-Q2",
      meta: undefined,
      vendedor_id: undefined,
      unidades_vendidas: undefined,
    });

    const result = await createPlanVenta({
      identificador: "PV-2025-Q2",
      nombre: "Plan Q2",
      descripcion: "Plan del segundo trimestre",
      periodo: "2025-Q2",
      meta: 200,
      vendedorId: "vend-2",
    });

    expect(result).toEqual({
      id: "plan-2",
      identificador: "PV-2025-Q2",
      nombre: "Plan Q2",
      descripcion: "Plan del segundo trimestre",
      periodo: "2025-Q2",
      meta: 200,
      vendedorId: "vend-2",
      vendedorNombre: undefined,
      unidadesVendidas: 0,
    });
  });

  it("solicita la lista de planes con paginación y normaliza la respuesta", async () => {
    getMock.mockResolvedValue({
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
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const result = await getPlanesVenta({ page: 1, limit: 10 });

    const { ApiClient } = await import("@/lib/api-client");
    expect(ApiClient).toHaveBeenCalledWith("https://salesforce.test");
    expect(getMock).toHaveBeenCalledWith("/planes-venta/", {
      params: { page: 1, limit: 10 },
    });

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
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it("tolera respuestas del backend con snake_case y sin unidades", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "plan-2",
          identificador: "PV-2025-Q2",
          nombre: "Plan Q2",
          descripcion: "Plan del segundo trimestre",
          periodo: "2025-Q2",
          meta: "200",
          vendedor_id: "vend-2",
          vendedor_nombre: null,
        },
      ],
      total: 1,
      page: 2,
      limit: 1,
      total_pages: 1,
    });

    const result = await getPlanesVenta({ page: 2, limit: 1 });

    expect(result.data[0]).toEqual({
      id: "plan-2",
      identificador: "PV-2025-Q2",
      nombre: "Plan Q2",
      descripcion: "Plan del segundo trimestre",
      periodo: "2025-Q2",
      meta: 200,
      vendedorId: "vend-2",
      vendedorNombre: undefined,
      unidadesVendidas: 0,
    });
    expect(result.totalPages).toBe(1);
  });
});
