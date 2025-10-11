import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import {
  createProveedor,
  getProveedores,
  bulkUploadProveedores,
} from "@/services/proveedores.service";

const postMock = vi.fn();
const getMock = vi.fn();

vi.mock("@/lib/api-client", () => {
  return {
    ApiClient: vi.fn().mockImplementation(() => ({
      post: postMock,
      get: getMock,
    })),
  };
});

describe("createProveedor service", () => {
  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_PROVEEDORES_API_URL", "http://api.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("envía el payload al endpoint esperado", async () => {
    const payload = {
      nombre: "Proveedor Uno",
      id_tax: "123",
      direccion: "Calle 123",
      telefono: "5551234",
      correo: "correo@test.com",
      contacto: "Ana",
      estado: "Activo" as const,
      certificado: null,
    };

    const responseData = { ...payload, id: 1 };
    postMock.mockResolvedValue(responseData);

    const result = await createProveedor(payload);

    const { ApiClient } = await import("@/lib/api-client");
    expect(ApiClient).toHaveBeenCalledWith("http://api.test");
    expect(postMock).toHaveBeenCalledWith("/proveedores", payload);
    expect(result).toEqual(responseData);
  });
});

describe("getProveedores service", () => {
  beforeEach(() => {
    getMock.mockReset();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_PROVEEDORES_API_URL", "http://api.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("transforma una respuesta en array a paginación", async () => {
    const proveedores = [
      { id: 1, nombre: "A", id_tax: "1", direccion: "", telefono: "", correo: "a@test.com", contacto: "", estado: "Activo", certificado: null },
      { id: 2, nombre: "B", id_tax: "2", direccion: "", telefono: "", correo: "b@test.com", contacto: "", estado: "Activo", certificado: null },
      { id: 3, nombre: "C", id_tax: "3", direccion: "", telefono: "", correo: "c@test.com", contacto: "", estado: "Activo", certificado: null },
    ];
    getMock.mockResolvedValue(proveedores);

    const result = await getProveedores({ page: 1, limit: 2 });

    expect(getMock).toHaveBeenCalledWith(
      "/proveedores",
      expect.objectContaining({ params: { page: 1, limit: 2 } })
    );
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
  });

  it("retorna la estructura original cuando ya está paginada", async () => {
    const response = {
      data: [],
      total: 0,
      page: 1,
      limit: 5,
      totalPages: 0,
    };
    getMock.mockResolvedValue(response);

    const result = await getProveedores({ page: 1, limit: 5 });
    expect(result).toEqual(response);
  });
});

describe("bulkUploadProveedores service", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.spyOn(Math, "random").mockRestore?.();
  });

  it("rechaza archivos que no sean CSV", async () => {
    const file = new File(["data"], "proveedor.txt", { type: "text/plain" });
    await expect(bulkUploadProveedores(file)).rejects.toThrow(
      "Solo se permiten archivos CSV"
    );
  });

  it("devuelve un conteo determinístico cuando el archivo es CSV", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.4);
    const file = new File(["data"], "proveedor.csv", { type: "text/csv" });

    const promise = bulkUploadProveedores(file);
    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.created).toBe(9);
    expect(result.message).toContain("9 proveedores");
  });
});
