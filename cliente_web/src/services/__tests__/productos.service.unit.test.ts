import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const importService = async () =>
  await import("@/services/productos.service");

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
    const promise = getProductos({ page: 1, limit: 3 });

    await vi.advanceTimersByTimeAsync(500);
    const result = await promise;

    expect(result.data).toHaveLength(3);
    expect(result.total).toBeGreaterThan(3);
    expect(result.totalPages).toBeGreaterThanOrEqual(2);
  });

  it("crea un nuevo producto asignando un id generado", async () => {
    const { createProducto, getProductos } = await importService();

    vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    const payload = {
      sku: "MED-999",
      nombre: "Producto QA",
      descripcion: "Producto de prueba",
      precio: 9999,
      activo: true,
      especificaciones: [{ nombre: "Presentación", valor: "Caja" }],
      hojaTecnica: {
        urlManual: "https://example.com/manual.pdf",
        certificaciones: ["INVIMA"],
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
    const { updateProducto } = await importService();

    const promise = updateProducto("1", {
      nombre: "Paracetamol Actualizado",
      activo: false,
    });
    await vi.advanceTimersByTimeAsync(500);
    const updated = await promise;

    expect(updated.id).toBe("1");
    expect(updated.nombre).toBe("Paracetamol Actualizado");
    expect(updated.activo).toBe(false);
  });

  it("lanza un error al intentar actualizar un producto inexistente", async () => {
    vi.useRealTimers();
    const { updateProducto } = await importService();

    await expect(updateProducto("999", { nombre: "No existe" })).rejects.toThrow(
      "Producto not found"
    );
    vi.useFakeTimers();
  });

  it("registra en consola cuando se solicita eliminar un producto válido", async () => {
    const { deleteProducto } = await importService();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const promise = deleteProducto("1");
    await vi.advanceTimersByTimeAsync(500);
    await promise;

    expect(consoleSpy).toHaveBeenCalledWith("Producto 1 would be deleted");
  });

  it("lanza error cuando se intenta eliminar un producto inexistente", async () => {
    vi.useRealTimers();
    const { deleteProducto } = await importService();

    await expect(deleteProducto("999")).rejects.toThrowError("Producto not found");
    vi.useFakeTimers();
  });

  it("rechaza la carga masiva cuando el archivo no es CSV", async () => {
    vi.useRealTimers();
    const { bulkUploadProductos } = await importService();

    await expect(
      bulkUploadProductos(
        new File(["contenido"], "productos.txt", { type: "text/plain" })
      )
    ).rejects.toThrow("Solo se permiten archivos CSV");
    vi.useFakeTimers();
  });

  it("devuelve un número de productos creados de forma determinística", async () => {
    const { bulkUploadProductos } = await importService();

    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const promise = bulkUploadProductos(
      new File(["contenido"], "productos.csv", { type: "text/csv" })
    );
    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.created).toBe(10);
    expect(result.message).toContain("10 productos creados");
  });
});
