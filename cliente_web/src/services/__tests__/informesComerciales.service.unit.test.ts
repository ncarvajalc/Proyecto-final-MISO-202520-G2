import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import {
  createInformeComercial,
  getInformesComerciales,
} from "@/services/informesComerciales.service";

const postMock = vi.fn();
const getMock = vi.fn();

vi.mock("@/lib/api-client", () => {
  const ApiClientMock = vi.fn(function ApiClientMockImpl() {
    this.post = postMock;
    this.get = getMock;
  });

  return {
    ApiClient: ApiClientMock,
  };
});

describe("informesComerciales.service - unit", () => {
  let apiUrl: string;

  faker.seed(1052);

  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
    vi.unstubAllEnvs();
    apiUrl = faker.internet.url();
    vi.stubEnv("VITE_API_URL", apiUrl);
  });

  describe("createInformeComercial", () => {
    it("envía el payload esperado y normaliza la respuesta", async () => {
      const informeId = faker.string.uuid();
      const nombre = faker.commerce.productName();
      const fecha = faker.date.recent().toISOString();
      const ventasTotales = faker.number.float({
        min: 1000,
        max: 50000,
        fractionDigits: 2,
      });
      const unidadesVendidas = faker.number.float({
        min: 50,
        max: 500,
        fractionDigits: 2,
      });

      const backendResponse = {
        id: informeId,
        nombre,
        fecha,
        ventas_totales: ventasTotales,
        unidades_vendidas: unidadesVendidas,
      };

      postMock.mockResolvedValue(backendResponse);

      const result = await createInformeComercial({ nombre });

      const { ApiClient } = await import("@/lib/api-client");
      expect(ApiClient).toHaveBeenCalledWith(apiUrl);
      expect(postMock).toHaveBeenCalledWith("/informes-comerciales/", {
        nombre,
      });

      expect(result).toEqual({
        id: informeId,
        nombre,
        fecha,
        ventasTotales,
        unidadesVendidas,
      });
    });

    it("normaliza camelCase cuando el backend devuelve camelCase", async () => {
      const informeId = faker.string.uuid();
      const nombre = faker.commerce.productName();
      const fecha = faker.date.recent().toISOString();
      const ventasTotales = faker.number.float({
        min: 1000,
        max: 50000,
        fractionDigits: 2,
      });
      const unidadesVendidas = faker.number.float({
        min: 50,
        max: 500,
        fractionDigits: 2,
      });

      postMock.mockResolvedValue({
        id: informeId,
        nombre,
        fecha,
        ventasTotales,
        unidadesVendidas,
      });

      const result = await createInformeComercial({ nombre });

      expect(result.ventasTotales).toBe(ventasTotales);
      expect(result.unidadesVendidas).toBe(unidadesVendidas);
    });

    it("maneja valores por defecto cuando faltan indicadores", async () => {
      const informeId = faker.string.uuid();
      const nombre = faker.commerce.productName();
      const fecha = faker.date.recent().toISOString();

      postMock.mockResolvedValue({
        id: informeId,
        nombre,
        fecha,
      });

      const result = await createInformeComercial({ nombre });

      expect(result.ventasTotales).toBe(0);
      expect(result.unidadesVendidas).toBe(0);
    });
  });

  describe("getInformesComerciales", () => {
    it("envía parámetros de paginación y normaliza la respuesta", async () => {
      const informes = Array.from({ length: 2 }, () => ({
        id: faker.string.uuid(),
        nombre: faker.commerce.productName(),
        fecha: faker.date.recent().toISOString(),
        ventas_totales: faker.number.float({
          min: 1000,
          max: 50000,
          fractionDigits: 2,
        }),
        unidades_vendidas: faker.number.float({
          min: 50,
          max: 500,
          fractionDigits: 2,
        }),
      }));

      const backendResponse = {
        data: informes,
        total: 10,
        page: 1,
        limit: 5,
        total_pages: 2,
      };

      getMock.mockResolvedValue(backendResponse);

      const result = await getInformesComerciales({ page: 1, limit: 5 });

      expect(getMock).toHaveBeenCalledWith("/informes-comerciales/", {
        params: {
          page: 1,
          limit: 5,
        },
      });

      expect(result).toEqual({
        data: informes.map((informe) => ({
          id: informe.id,
          nombre: informe.nombre,
          fecha: informe.fecha,
          ventasTotales: informe.ventas_totales,
          unidadesVendidas: informe.unidades_vendidas,
        })),
        total: 10,
        page: 1,
        limit: 5,
        totalPages: 2,
      });
    });

    it("normaliza respuestas con camelCase del backend", async () => {
      const informes = Array.from({ length: 2 }, () => ({
        id: faker.string.uuid(),
        nombre: faker.commerce.productName(),
        fecha: faker.date.recent().toISOString(),
        ventasTotales: faker.number.float({
          min: 1000,
          max: 50000,
          fractionDigits: 2,
        }),
        unidadesVendidas: faker.number.float({
          min: 50,
          max: 500,
          fractionDigits: 2,
        }),
      }));

      getMock.mockResolvedValue({
        data: informes,
        total: 5,
        page: 1,
        limit: 5,
        totalPages: 1,
      });

      const result = await getInformesComerciales({ page: 1, limit: 5 });

      expect(result.data[0].ventasTotales).toBe(informes[0].ventasTotales);
      expect(result.data[0].unidadesVendidas).toBe(
        informes[0].unidadesVendidas
      );
      expect(result.totalPages).toBe(1);
    });

    it("calcula totalPages cuando el backend no lo devuelve", async () => {
      getMock.mockResolvedValue({
        data: [],
        total: 25,
        page: 1,
        limit: 10,
      });

      const result = await getInformesComerciales({ page: 1, limit: 10 });

      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
    });

    it("maneja respuestas vacías correctamente", async () => {
      getMock.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        total_pages: 0,
      });

      const result = await getInformesComerciales({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });
});
