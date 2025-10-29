import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/proveedores.service", () => ({
  bulkUploadProveedores: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { BulkUploadProveedoresForm } from "@/components/proveedor/BulkUploadProveedoresForm";

import { renderWithQueryClient } from "../../../../tests/test-utils";

describe("BulkUploadProveedoresForm - Unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(5);
  });

  const renderForm = () =>
    renderWithQueryClient(
      <BulkUploadProveedoresForm open={true} onOpenChange={vi.fn()} />
    );

  it("muestra las acciones principales", () => {
    renderForm();

    expect(
      screen.getByRole("heading", { name: /carga masiva proveedores/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /descargar plantilla/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear/i })).toBeDisabled();
  });

  it("habilita el botón de carga al seleccionar un archivo", async () => {
    const user = userEvent.setup();
    renderForm();

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();
    const file = new File(
      [faker.lorem.sentence()],
      `${faker.string.alphanumeric(8)}.csv`,
      { type: "text/csv" }
    );
    await user.upload(fileInput!, file);

    expect(screen.getByRole("button", { name: /crear/i })).toBeEnabled();
  });
});
