import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import {
  createVendedor,
  deleteVendedor,
  getVendedores,
  updateVendedor,
} from "@/services/vendedores.service";

const postMock = vi.fn();
const getMock = vi.fn();
const putMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    post: postMock,
    get: getMock,
    put: putMock,
    delete: deleteMock,
  })),
}));

describe("vendedores.service - unit", () => {
  let apiUrl: string;

  faker.seed(456);

  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
    vi.unstubAllEnvs();
    apiUrl = faker.internet.url();
    vi.stubEnv("VITE_SALESFORCE_API_URL", apiUrl);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("normaliza el payload para createVendedor y transforma la respuesta", async () => {
    vi.useFakeTimers();
    const now = faker.date.past({ years: 1 });
    vi.setSystemTime(now);

    const fullName = faker.person.fullName();
    const email = faker.internet.email();
    const hireDate = now.toISOString().split("T")[0];
    const vendorId = faker.string.uuid();

    const backendResponse = {
      id: vendorId,
      full_name: fullName,
      email,
      hire_date: hireDate,
      status: "active",
      created_at: `${hireDate}T00:00:00Z`,
      updated_at: `${hireDate}T00:00:00Z`,
    };
    postMock.mockResolvedValue(backendResponse);

    const result = await createVendedor({
      id: vendorId,
      nombre: fullName,
      correo: email,
    });

    const { ApiClient } = await import("@/lib/api-client");
    expect(ApiClient).toHaveBeenCalledWith(apiUrl);
    expect(postMock).toHaveBeenCalledWith("/vendedores", {
      full_name: fullName,
      email,
      hire_date: hireDate,
      status: "active",
    });

    expect(result).toEqual({
      id: vendorId,
      nombre: fullName,
      correo: email,
      fechaContratacion: hireDate,
      planDeVenta: null,
    });
  });

  it("transforma la respuesta paginada en getVendedores", async () => {
    const vendedorId = faker.string.uuid();
    const fullName = faker.person.fullName();
    const email = faker.internet.email();
    const hireDate = faker.date.past({ years: 2 }).toISOString().split("T")[0];
    const page = faker.number.int({ min: 1, max: 3 });
    const limit = faker.number.int({ min: 1, max: 10 });

    getMock.mockResolvedValue({
      data: [
        {
          id: vendedorId,
          full_name: fullName,
          email,
          hire_date: hireDate,
          status: "active",
          created_at: `${hireDate}T00:00:00Z`,
          updated_at: `${hireDate}T00:00:00Z`,
        },
      ],
      total: 1,
      page,
      limit,
      total_pages: 1,
    });

    const result = await getVendedores({ page, limit });

    expect(getMock).toHaveBeenCalledWith(
      "/vendedores/",
      expect.objectContaining({ params: { page, limit } })
    );
    expect(result).toEqual({
      data: [
        {
          id: vendedorId,
          nombre: fullName,
          correo: email,
          fechaContratacion: hireDate,
          planDeVenta: null,
        },
      ],
      total: 1,
      page,
      limit,
      totalPages: 1,
    });
  });

  it("envía solo los campos provistos en updateVendedor", async () => {
    const vendedorId = faker.string.uuid();
    const updatedName = faker.person.fullName();
    const email = faker.internet.email();
    const hireDate = faker.date.past({ years: 1 }).toISOString().split("T")[0];

    putMock.mockResolvedValue({
      id: vendedorId,
      full_name: updatedName,
      email,
      hire_date: hireDate,
      status: "active",
      created_at: `${hireDate}T00:00:00Z`,
      updated_at: `${hireDate}T00:00:00Z`,
    });

    const result = await updateVendedor(vendedorId, { nombre: updatedName });

    expect(putMock).toHaveBeenCalledWith(`/vendedores/${vendedorId}`, {
      full_name: updatedName,
    });
    expect(result.nombre).toBe(updatedName);
  });

  it("invoca el endpoint correcto en deleteVendedor", async () => {
    const vendedorId = faker.string.uuid();
    await deleteVendedor(vendedorId);
    expect(deleteMock).toHaveBeenCalledWith(`/vendedores/${vendedorId}`);
  });
});
