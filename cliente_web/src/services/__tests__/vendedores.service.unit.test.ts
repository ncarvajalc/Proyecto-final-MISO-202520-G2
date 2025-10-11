import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_SALESFORCE_API_URL", "https://salesforce.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("normaliza el payload para createVendedor y transforma la respuesta", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T12:00:00Z"));

    const backendResponse = {
      id: "vendor-1",
      full_name: "Laura Pérez",
      email: "laura.perez@example.com",
      hire_date: "2024-06-01",
      status: "active",
      created_at: "2024-06-01T12:00:00Z",
      updated_at: "2024-06-01T12:00:00Z",
    };
    postMock.mockResolvedValue(backendResponse);

    const result = await createVendedor({
      id: "vendor-1",
      nombre: "Laura Pérez",
      correo: "laura.perez@example.com",
    });

    const { ApiClient } = await import("@/lib/api-client");
    expect(ApiClient).toHaveBeenCalledWith("https://salesforce.test");
    expect(postMock).toHaveBeenCalledWith("/vendedores", {
      full_name: "Laura Pérez",
      email: "laura.perez@example.com",
      hire_date: "2024-06-01",
      status: "active",
    });

    expect(result).toEqual({
      id: "vendor-1",
      nombre: "Laura Pérez",
      correo: "laura.perez@example.com",
      fechaContratacion: "2024-06-01",
      planDeVenta: null,
    });
  });

  it("transforma la respuesta paginada en getVendedores", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "vend-1",
          full_name: "Carlos", 
          email: "carlos@example.com",
          hire_date: "2024-01-01",
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      total_pages: 1,
    });

    const result = await getVendedores({ page: 1, limit: 10 });

    expect(getMock).toHaveBeenCalledWith(
      "/vendedores/",
      expect.objectContaining({ params: { page: 1, limit: 10 } })
    );
    expect(result).toEqual({
      data: [
        {
          id: "vend-1",
          nombre: "Carlos",
          correo: "carlos@example.com",
          fechaContratacion: "2024-01-01",
          planDeVenta: null,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it("envía solo los campos provistos en updateVendedor", async () => {
    putMock.mockResolvedValue({
      id: "vend-1",
      full_name: "Carlos Renovado",
      email: "carlos@example.com",
      hire_date: "2024-01-01",
      status: "active",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-02-01T00:00:00Z",
    });

    const result = await updateVendedor("vend-1", { nombre: "Carlos Renovado" });

    expect(putMock).toHaveBeenCalledWith("/vendedores/vend-1", {
      full_name: "Carlos Renovado",
    });
    expect(result.nombre).toBe("Carlos Renovado");
  });

  it("invoca el endpoint correcto en deleteVendedor", async () => {
    await deleteVendedor("vend-1");
    expect(deleteMock).toHaveBeenCalledWith("/vendedores/vend-1");
  });
});
