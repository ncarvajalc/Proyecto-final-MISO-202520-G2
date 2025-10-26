import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { faker } from "@faker-js/faker";

import {
  createProveedor,
  getProveedores,
  bulkUploadProveedores,
} from "@/services/proveedores.service";

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

describe("createProveedor service", () => {
  let apiUrl: string;

  faker.seed(209);

  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
    vi.unstubAllEnvs();
    apiUrl = faker.internet.url();
    vi.stubEnv("VITE_API_URL", apiUrl);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("envía el payload al endpoint esperado", async () => {
    const estado = faker.helpers.arrayElement(["Activo", "Inactivo"]) as
      | "Activo"
      | "Inactivo";
    const payload = {
      nombre: faker.company.name(),
      id_tax: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
      direccion: faker.location.streetAddress(),
      telefono: faker.phone.number(),
      correo: faker.internet.email(),
      contacto: faker.person.firstName(),
      estado,
      certificado: null,
    };

    const responseData = { ...payload, id: faker.number.int({ min: 1, max: 999 }) };
    postMock.mockResolvedValue(responseData);

    const result = await createProveedor(payload);

    const { ApiClient } = await import("@/lib/api-client");
    expect(ApiClient).toHaveBeenCalledWith(apiUrl);
    expect(postMock).toHaveBeenCalledWith("/proveedores", payload);
    expect(result).toEqual(responseData);
  });
});

describe("getProveedores service", () => {
  let apiUrl: string;

  beforeEach(() => {
    getMock.mockReset();
    vi.unstubAllEnvs();
    apiUrl = faker.internet.url();
    vi.stubEnv("VITE_API_URL", apiUrl);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("transforma una respuesta en array a paginación", async () => {
    const proveedores = Array.from({ length: 3 }, () => ({
      id: faker.number.int({ min: 1, max: 1000 }),
      nombre: faker.company.name(),
      id_tax: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
      direccion: faker.location.streetAddress(),
      telefono: faker.phone.number(),
      correo: faker.internet.email(),
      contacto: faker.person.firstName(),
      estado: faker.helpers.arrayElement(["Activo", "Inactivo"] as const),
      certificado: null,
    }));
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
  let apiUrl: string;

  beforeEach(() => {
    postMock.mockReset();
    vi.unstubAllEnvs();
    apiUrl = faker.internet.url();
    vi.stubEnv("VITE_API_URL", apiUrl);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("envía el archivo como multipart/form-data al endpoint esperado", async () => {
    const file = new File(["contenido"], "proveedores.csv", { type: "text/csv" });
    const responseData = {
      success: true,
      message: "2 proveedores creados, 0 con errores",
      file: { filename: "proveedores.csv", contentType: "text/csv", rows: [] },
      summary: { totalRows: 2, processedRows: 2, succeeded: 2, failed: 0 },
      errors: [],
      createdSuppliers: [],
    };

    postMock.mockResolvedValue(responseData);

    const result = await bulkUploadProveedores(file);

    const { ApiClient } = await import("@/lib/api-client");
    expect(ApiClient).toHaveBeenCalledWith(apiUrl);
    expect(postMock).toHaveBeenCalledWith(
      "/proveedores/bulk-upload",
      expect.any(FormData),
      expect.objectContaining({
        headers: { "Content-Type": "multipart/form-data" },
      })
    );

    const formDataArg = postMock.mock.calls[0][1] as FormData;
    const entries = Array.from(formDataArg.entries());
    expect(entries).toHaveLength(1);
    expect(entries[0][0]).toBe("file");
    expect(entries[0][1]).toBeInstanceOf(File);
    expect((entries[0][1] as File).name).toBe("proveedores.csv");

    expect(result).toEqual(responseData);
  });

  it("propaga errores cuando la API responde con fallo", async () => {
    const file = new File(["contenido"], "proveedores.csv", { type: "text/csv" });
    const apiError = new Error("falló el backend");
    postMock.mockRejectedValue(apiError);

    await expect(bulkUploadProveedores(file)).rejects.toThrow("falló el backend");
  });
});
