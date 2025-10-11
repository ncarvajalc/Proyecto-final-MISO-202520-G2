import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { faker } from "@faker-js/faker";

const importService = async () =>
  await import("@/services/productos.service");

faker.seed(2025);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("productos.service", () => {
  it("realiza la paginación sobre los datos simulados", async () => {
    const { getProductos } = await importService();
    const page = 1;
    const limit = faker.number.int({ min: 1, max: 3 });
    const promise = getProductos({ page, limit });

    await vi.advanceTimersByTimeAsync(500);
    const result = await promise;

    expect(result.data).toHaveLength(limit);
    expect(result.total).toBeGreaterThan(limit);
    expect(result.totalPages).toBeGreaterThanOrEqual(2);
  });

  it("crea un nuevo producto asignando un id generado", async () => {
    const { createProducto, getProductos } = await importService();

    vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    const payload = {
      sku: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
      nombre: faker.commerce.productName(),
      descripcion: faker.commerce.productDescription(),
      precio: faker.number.int({ min: 1000, max: 50000 }),
      activo: true,
      especificaciones: [
        {
          nombre: faker.commerce.productMaterial(),
          valor: faker.commerce.productAdjective(),
        },
      ],
      hojaTecnica: {
        urlManual: faker.internet.url(),
        certificaciones: [faker.company.catchPhraseAdjective()],
      },
    };

    const promise = createProducto(payload);
    await vi.advanceTimersByTimeAsync(500);
    const result = await promise;

    expect(result.id).toBe("1700000000000");
    expect(result.nombre).toBe(payload.nombre);

    const listPromise = getProductos({ page: 1, limit: 20 });
    await vi.advanceTimersByTimeAsync(500);
    const list = await listPromise;
    expect(list.data.some((producto) => producto.id === result.id)).toBe(true);
  });

  it("actualiza un producto existente combinando la información", async () => {
    const { updateProducto, getProductos } = await importService();

    const listPromise = getProductos({ page: 1, limit: 1 });
    await vi.advanceTimersByTimeAsync(500);
    const listado = await listPromise;
    const producto = listado.data[0];
    const nuevoNombre = faker.commerce.productName();

    const promise = updateProducto(producto.id, {
      nombre: nuevoNombre,
      activo: false,
    });
    await vi.advanceTimersByTimeAsync(500);
    const updated = await promise;

    expect(updated.id).toBe(producto.id);
    expect(updated.nombre).toBe(nuevoNombre);
    expect(updated.activo).toBe(false);
  });

  it("lanza un error al intentar actualizar un producto inexistente", async () => {
    vi.useRealTimers();
    const { updateProducto } = await importService();

    const idInexistente = faker.string.uuid();
    await expect(
      updateProducto(idInexistente, { nombre: faker.commerce.productName() })
    ).rejects.toThrow("Producto not found");
    vi.useFakeTimers();
  });

  it("registra en consola cuando se solicita eliminar un producto válido", async () => {
    const { deleteProducto, getProductos } = await importService();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const listPromise = getProductos({ page: 1, limit: 1 });
    await vi.advanceTimersByTimeAsync(500);
    const listado = await listPromise;
    const producto = listado.data[0];

    const promise = deleteProducto(producto.id);
    await vi.advanceTimersByTimeAsync(500);
    await promise;

    expect(consoleSpy).toHaveBeenCalledWith(
      `Producto ${producto.id} would be deleted`
    );
  });

  it("lanza error cuando se intenta eliminar un producto inexistente", async () => {
    vi.useRealTimers();
    const { deleteProducto } = await importService();

    await expect(deleteProducto(faker.string.uuid())).rejects.toThrowError(
      "Producto not found"
    );
    vi.useFakeTimers();
  });

  it("rechaza la carga masiva cuando el archivo no es CSV", async () => {
    vi.useRealTimers();
    const { bulkUploadProductos } = await importService();

    await expect(
      bulkUploadProductos(
        new File(
          [faker.lorem.paragraph()],
          `${faker.string.alphanumeric({ length: 8 })}.txt`,
          { type: "text/plain" }
        )
      )
    ).rejects.toThrow("Solo se permiten archivos CSV");
    vi.useFakeTimers();
  });

  it("devuelve un número de productos creados de forma determinística", async () => {
    const { bulkUploadProductos } = await importService();

    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const promise = bulkUploadProductos(
      new File(
        [faker.lorem.paragraph()],
        `${faker.string.alphanumeric({ length: 8 })}.csv`,
        { type: "text/csv" }
      )
    );
    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.created).toBe(10);
    expect(result.message).toContain("10 productos creados");
  });
});
