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
  return {
    ApiClient: vi.fn().mockImplementation(() => ({
      post: postMock,
      get: getMock,
    })),
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
    vi.stubEnv("VITE_PROVEEDORES_API_URL", apiUrl);
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
    vi.stubEnv("VITE_PROVEEDORES_API_URL", apiUrl);
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
  afterEach(() => {
    vi.useRealTimers();
    vi.spyOn(Math, "random").mockRestore?.();
  });

  it("rechaza archivos que no sean CSV", async () => {
    const file = new File(
      [faker.lorem.paragraph()],
      `${faker.string.alphanumeric({ length: 8 })}.txt`,
      { type: "text/plain" }
    );
    await expect(bulkUploadProveedores(file)).rejects.toThrow(
      "Solo se permiten archivos CSV"
    );
  });

  it("devuelve un conteo determinístico cuando el archivo es CSV", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.4);
    const file = new File(
      [faker.lorem.paragraph()],
      `${faker.string.alphanumeric({ length: 8 })}.csv`,
      { type: "text/csv" }
    );

    const promise = bulkUploadProveedores(file);
    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.created).toBe(9);
    expect(result.message).toContain("9 proveedores");
  });
});
