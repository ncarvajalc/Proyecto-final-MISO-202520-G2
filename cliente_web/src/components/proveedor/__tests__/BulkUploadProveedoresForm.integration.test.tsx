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
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const onOpenChange = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <BulkUploadProveedoresForm open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  const formElement = document.querySelector("form");
  formElement?.setAttribute("novalidate", "true");
  return { queryClient, invalidateSpy, onOpenChange, ...utils };
};

const mockedBulkUpload = vi.mocked(bulkUploadProveedores);
const mockedToast = vi.mocked(toast);

describe("BulkUploadProveedoresForm - Integration", () => {
  beforeEach(() => {
    faker.seed(202508);
    vi.clearAllMocks();
    mockedBulkUpload.mockReset();
  });

  it("envía el archivo al servicio y cierra el diálogo en caso de éxito", async () => {
    const user = userEvent.setup();
    const { invalidateSpy, onOpenChange } = renderComponent();
    await waitFor(() => {
      expect(document.querySelector('input[type="file"]')).not.toBeNull();
    });
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const csvFileName = `${faker.string.alphanumeric({ length: 8 })}.csv`;
    const csvContent = faker.lorem.paragraph();
    const totalRows = faker.number.int({ min: 2, max: 6 });
    const succeeded = totalRows;
    const failed = 0;
    const summaryMessage = `${succeeded} proveedores creados, ${failed} con errores`;
    const newSuppliers = faker.helpers.multiple(
      () => ({
        id: faker.number.int({ min: 1, max: 9999 }),
        nombre: faker.company.name(),
        id_tax: faker.string.numeric({ length: 10 }),
        direccion: faker.location.streetAddress(),
        telefono: faker.phone.number(),
        correo: faker.internet.email(),
        contacto: faker.person.fullName(),
        estado: faker.helpers.arrayElement(["Activo", "Inactivo"]),
        certificado: null,
      }),
      { count: faker.number.int({ min: 1, max: 3 }) }
    );

    const file = new File([csvContent], csvFileName, { type: "text/csv" });
    mockedBulkUpload.mockResolvedValue({
      success: true,
      message: summaryMessage,
      file: { filename: csvFileName, contentType: "text/csv", rows: [] },
      summary: {
        totalRows,
        processedRows: totalRows,
        succeeded,
        failed,
      },
      errors: [],
      createdSuppliers: newSuppliers,
    });

    await user.upload(fileInput, file);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(mockedBulkUpload).toHaveBeenCalledTimes(1);
    });
    const [calledFile] = mockedBulkUpload.mock.calls[0];
    expect((calledFile as File).name).toBe(csvFileName);

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith("Carga masiva exitosa", {
        description: summaryMessage,
      });
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["proveedores"] })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
