import { faker } from "@faker-js/faker";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { BulkUploadProveedoresForm } from "@/components/proveedor/BulkUploadProveedoresForm";
import { bulkUploadProveedores } from "@/services/proveedores.service";
import { toast } from "sonner";

import { renderWithQueryClient } from "../../../../tests/test-utils";

vi.mock("@/services/proveedores.service", () => ({
  bulkUploadProveedores: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockBulkUpload = vi.mocked(bulkUploadProveedores);
const mockToast = vi.mocked(toast);

const createCsvFile = () =>
  new File(
    [faker.lorem.paragraph()],
    `${faker.string.alphanumeric(8)}.csv`,
    { type: "text/csv" }
  );

const renderForm = (onOpenChange = vi.fn()) =>
  renderWithQueryClient(
    <BulkUploadProveedoresForm open={true} onOpenChange={onOpenChange} />
  );

const uploadSelectedFile = async (user: ReturnType<typeof userEvent.setup>, file: File) => {
  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
  expect(fileInput).not.toBeNull();
  await user.upload(fileInput!, file);
};

const submitForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /crear/i }));
};

const resetBulkUploadMocks = (seed: number) => {
  vi.clearAllMocks();
  faker.seed(seed);
};

export const runBulkUploadProveedoresIntegrationSuite = () => {
  beforeEach(() => {
    resetBulkUploadMocks(7);
    const successMessage = faker.lorem.sentence();
    mockBulkUpload.mockResolvedValue({
      message: successMessage,
      summary: { succeeded: 2, failed: 0 },
      errors: [],
    } as never);
    mockToast.success.mockReset();
  });

  it("envía el archivo seleccionado al servicio", async () => {
    const user = userEvent.setup();
    renderForm();

    const file = createCsvFile();
    await uploadSelectedFile(user, file);
    await submitForm(user);

    await waitFor(() => {
      const [firstCall] = mockBulkUpload.mock.calls;
      expect(firstCall?.[0]).toBe(file);
      expect(mockToast.success).toHaveBeenCalledWith("Carga masiva exitosa", {
        description: expect.any(String),
      });
    });
  });
};

export const runBulkUploadProveedoresAcceptanceSuite = () => {
  beforeEach(() => {
    resetBulkUploadMocks(8);
    mockBulkUpload.mockResolvedValue({
      message: faker.lorem.sentence(),
      summary: { succeeded: 2, failed: 0 },
      errors: [],
    } as never);
  });

  it("permite completar la carga y cerrar el modal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderForm(onOpenChange);

    const file = createCsvFile();
    await uploadSelectedFile(user, file);
    await submitForm(user);

    await waitFor(() => {
      expect(mockBulkUpload).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
};
