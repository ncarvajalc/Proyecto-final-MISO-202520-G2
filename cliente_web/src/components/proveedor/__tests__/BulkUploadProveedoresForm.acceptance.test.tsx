import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BulkUploadProveedoresForm } from "@/components/proveedor/BulkUploadProveedoresForm";
import { bulkUploadProveedores } from "@/services/proveedores.service";
import { toast } from "sonner";

vi.mock("@/services/proveedores.service", () => ({
  bulkUploadProveedores: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderComponent = () => {
  const queryClient = new QueryClient();
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <BulkUploadProveedoresForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  const formElement = document.querySelector("form");
  formElement?.setAttribute("novalidate", "true");
  return { queryClient, onOpenChange, ...utils };
};

const mockedBulkUpload = vi.mocked(bulkUploadProveedores);
const mockedToast = vi.mocked(toast);

describe("BulkUploadProveedoresForm - Acceptance", () => {
  beforeEach(() => {
    faker.seed(202507);
    vi.clearAllMocks();
    mockedBulkUpload.mockReset();
  });

  it("notifica cuando hubo errores en la carga masiva", async () => {
    const user = userEvent.setup();
    renderComponent();
    await waitFor(() => {
      expect(document.querySelector('input[type="file"]')).not.toBeNull();
    });
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const csvFileName = `${faker.string.alphanumeric({ length: 8 })}.csv`;
    const csvContent = faker.lorem.paragraph();
    const totalRows = faker.number.int({ min: 2, max: 6 });
    const failed = faker.number.int({ min: 1, max: totalRows - 1 });
    const succeeded = totalRows - failed;
    const summaryMessage = `${succeeded} proveedores creados, ${failed} con errores`;
    const summaryDescription = `${succeeded} proveedores creados y ${failed} con errores.`;
    const errorMessage = faker.lorem.words(3);
    const validSupplier = {
      id: faker.number.int({ min: 1, max: 9999 }),
      nombre: faker.company.name(),
      id_tax: faker.string.numeric({ length: 10 }),
      direccion: faker.location.streetAddress(),
      telefono: faker.phone.number(),
      correo: faker.internet.email(),
      contacto: faker.person.fullName(),
      estado: faker.helpers.arrayElement(["Activo", "Inactivo"]),
      certificado: null,
    };

    const file = new File([csvContent], csvFileName, { type: "text/csv" });
    mockedBulkUpload.mockResolvedValue({
      success: false,
      message: summaryMessage,
      file: { filename: csvFileName, contentType: "text/csv", rows: [] },
      summary: {
        totalRows,
        processedRows: totalRows,
        succeeded,
        failed,
      },
      errors: [
        {
          rowNumber: 3,
          errors: [{ loc: ["correo"], msg: errorMessage, type: "value_error" }],
          rawData: null,
        },
      ],
      createdSuppliers: [validSupplier],
    });

    await user.upload(fileInput, file);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith(
        "Carga masiva con observaciones",
        {
          description: summaryDescription,
        }
      );
    });
  });
});
