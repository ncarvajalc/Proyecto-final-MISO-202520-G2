import { faker } from "@faker-js/faker";
import { vi } from "vitest";

import { startHttpServer } from "./httpServerTestUtils";

type VendorRecord = {
  id: string;
  full_name: string;
  email: string;
  hire_date: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

type VendorPlan = {
  identificador: string;
  nombre: string;
  descripcion: string;
  periodo: string;
  meta: number;
  unidades_vendidas: number;
};

export const buildVendor = (): VendorRecord => ({
  id: faker.string.uuid(),
  full_name: faker.person.fullName(),
  email: faker.internet.email(),
  hire_date: faker.date.past().toISOString().split("T")[0],
  status: "active",
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.past().toISOString(),
});

export const buildPlan = (): VendorPlan => ({
  identificador: faker.string.alphanumeric(10),
  nombre: faker.commerce.productName(),
  descripcion: faker.lorem.sentence(),
  periodo: "2025-Q1",
  meta: faker.number.float({ min: 1000, max: 5000, fractionDigits: 0 }),
  unidades_vendidas: faker.number.float({ min: 100, max: 800, fractionDigits: 0 }),
});

export const vendorResponse = (vendor: VendorRecord, plans: VendorPlan[]) => ({
  ...vendor,
  sales_plans: plans,
});

export const vendorListResponse = (vendor: VendorRecord) => ({
  data: [vendor],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
});

export const withVendorServer = async (
  handler: Parameters<typeof startHttpServer>[0],
  run: (apiUrl: string) => Promise<void>
) => {
  const server = await startHttpServer(handler);
  vi.stubEnv("VITE_API_URL", server.url);
  try {
    await run(server.url);
  } finally {
    await server.close();
    vi.unstubAllEnvs();
  }
};
