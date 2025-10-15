import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

import { createProveedor } from "@/services/proveedores.service";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});

describe("createProveedor service - Integration", () => {
  it("envía el payload y recibe la respuesta del backend", async () => {
    faker.seed(309);
    const apiUrl = "http://localhost:4011";
    vi.stubEnv("VITE_PROVEEDORES_API_URL", apiUrl);

    const payload = {
      nombre: faker.company.name(),
      id_tax: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
      direccion: faker.location.streetAddress(),
      telefono: faker.phone.number(),
      correo: faker.internet.email(),
      contacto: faker.person.fullName(),
      estado: faker.helpers.arrayElement(["Activo", "Inactivo"] as const),
      certificado: null,
    };

    server.use(
      http.post(`${apiUrl}/proveedores`, async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual(payload);
        return HttpResponse.json({ id: 1, ...body }, { status: 201 });
      })
    );

    const response = await createProveedor(payload);
    expect(response).toMatchObject({ id: 1, ...payload });
  });

  it("propaga el error de conflicto del backend", async () => {
    faker.seed(310);
    const apiUrl = "http://localhost:4011";
    vi.stubEnv("VITE_PROVEEDORES_API_URL", apiUrl);

    const payload = {
      nombre: faker.company.name(),
      id_tax: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
      direccion: faker.location.streetAddress(),
      telefono: faker.phone.number(),
      correo: faker.internet.email(),
      contacto: faker.person.fullName(),
      estado: "Activo" as const,
      certificado: null,
    };

    const detail = "Ya existe un proveedor con el mismo id_tax";
    server.use(
      http.post(`${apiUrl}/proveedores`, async () =>
        HttpResponse.json({ detail }, { status: 409 })
      )
    );

    await expect(createProveedor(payload)).rejects.toMatchObject({
      message: detail,
      detail,
    });
  });
});
