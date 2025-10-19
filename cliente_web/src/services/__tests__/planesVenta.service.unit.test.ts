import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

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
  let apiUrl: string;

  faker.seed(1051);

  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
    vi.unstubAllEnvs();
    apiUrl = faker.internet.url();
    vi.stubEnv("VITE_API_URL", apiUrl);
  });

  it("envía el payload esperado y normaliza la respuesta", async () => {
    const planId = faker.string.uuid();
    const identificador = faker.string.alphanumeric({ length: 8 }).toUpperCase();
    const nombre = faker.commerce.productName();
    const descripcion = faker.lorem.sentence();
    const periodo = `${faker.date.future({ years: 1 }).getFullYear()}-Q${faker.number.int({ min: 1, max: 4 })}`;
    const meta = faker.number.int({ min: 100, max: 500 });
    const vendedorId = faker.string.uuid();
    const vendedorNombre = faker.person.fullName();

    const backendResponse = {
      id: planId,
      identificador,
      nombre,
      descripcion,
      periodo,
      meta: String(meta),
      vendedor_id: vendedorId,
      vendedor_nombre: vendedorNombre,
      unidades_vendidas: faker.number.int({ min: 0, max: 100 }),
    };

    postMock.mockResolvedValue(backendResponse);

    const result = await createPlanVenta({
      identificador,
      nombre,
      descripcion,
      periodo,
      meta,
      vendedorId,
    });

    const { ApiClient } = await import("@/lib/api-client");
    expect(ApiClient).toHaveBeenCalledWith(apiUrl);
    expect(postMock).toHaveBeenCalledWith("/planes-venta/", {
      identificador,
      nombre,
      descripcion,
      periodo,
      meta,
      vendedorId,
    });

    expect(result).toEqual({
      id: planId,
      identificador,
      nombre,
      descripcion,
      periodo,
      meta,
      vendedorId,
      vendedorNombre,
      unidadesVendidas: backendResponse.unidades_vendidas,
    });
  });

  it("maneja respuestas parciales del backend", async () => {
    const planId = faker.string.uuid();
    const identificador = faker.string.alphanumeric({ length: 8 }).toUpperCase();
    const nombre = faker.commerce.productName();
    const descripcion = faker.lorem.sentence();
    const periodo = `${faker.date.future({ years: 1 }).getFullYear()}-Q${faker.number.int({ min: 1, max: 4 })}`;
    const meta = faker.number.int({ min: 100, max: 400 });
    const vendedorId = faker.string.uuid();

    postMock.mockResolvedValue({
      id: planId,
      identificador,
      nombre,
      descripcion,
      periodo,
      meta: undefined,
      vendedor_id: undefined,
      unidades_vendidas: undefined,
    });

    const result = await createPlanVenta({
      identificador,
      nombre,
      descripcion,
      periodo,
      meta,
      vendedorId,
    });

    expect(result).toEqual({
      id: planId,
      identificador,
      nombre,
      descripcion,
      periodo,
      meta,
      vendedorId,
      vendedorNombre: undefined,
      unidadesVendidas: 0,
    });
  });

  it("solicita la lista de planes con paginación y normaliza la respuesta", async () => {
    const planId = faker.string.uuid();
    const identificador = faker.string.alphanumeric({ length: 8 }).toUpperCase();
    const nombre = faker.commerce.productName();
    const descripcion = faker.lorem.sentence();
    const periodo = `${faker.date.future({ years: 1 }).getFullYear()}-Q${faker.number.int({ min: 1, max: 4 })}`;
    const meta = faker.number.int({ min: 50, max: 500 });
    const vendedorId = faker.string.uuid();
    const vendedorNombre = faker.person.fullName();
    const unidadesVendidas = faker.number.int({ min: 0, max: 200 });
    const page = faker.number.int({ min: 1, max: 3 });
    const limit = faker.number.int({ min: 1, max: 10 });

    getMock.mockResolvedValue({
      data: [
        {
          id: planId,
          identificador,
          nombre,
          descripcion,
          periodo,
          meta,
          vendedorId,
          vendedorNombre,
          unidadesVendidas,
        },
      ],
      total: 1,
      page,
      limit,
      totalPages: 1,
    });

    const result = await getPlanesVenta({ page, limit });

    const { ApiClient } = await import("@/lib/api-client");
    expect(ApiClient).toHaveBeenCalledWith(apiUrl);
    expect(getMock).toHaveBeenCalledWith("/planes-venta/", {
      params: { page, limit },
    });

    expect(result).toEqual({
      data: [
        {
          id: planId,
          identificador,
          nombre,
          descripcion,
          periodo,
          meta,
          vendedorId,
          vendedorNombre,
          unidadesVendidas,
        },
      ],
      total: 1,
      page,
      limit,
      totalPages: 1,
    });
  });

  it("tolera respuestas del backend con snake_case y sin unidades", async () => {
    const planId = faker.string.uuid();
    const identificador = faker.string.alphanumeric({ length: 8 }).toUpperCase();
    const nombre = faker.commerce.productName();
    const descripcion = faker.lorem.sentence();
    const periodo = `${faker.date.future({ years: 1 }).getFullYear()}-Q${faker.number.int({ min: 1, max: 4 })}`;
    const meta = faker.number.int({ min: 50, max: 400 });
    const vendedorId = faker.string.uuid();
    const page = faker.number.int({ min: 1, max: 5 });
    const limit = faker.number.int({ min: 1, max: 3 });

    getMock.mockResolvedValue({
      data: [
        {
          id: planId,
          identificador,
          nombre,
          descripcion,
          periodo,
          meta: String(meta),
          vendedor_id: vendedorId,
          vendedor_nombre: null,
        },
      ],
      total: 1,
      page,
      limit,
      total_pages: 1,
    });

    const result = await getPlanesVenta({ page, limit });

    expect(result.data[0]).toEqual({
      id: planId,
      identificador,
      nombre,
      descripcion,
      periodo,
      meta,
      vendedorId,
      vendedorNombre: undefined,
      unidadesVendidas: 0,
    });
    expect(result.totalPages).toBe(1);
  });
});
