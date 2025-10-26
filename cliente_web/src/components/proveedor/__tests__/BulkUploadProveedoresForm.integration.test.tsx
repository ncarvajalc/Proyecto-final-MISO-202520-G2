import { faker } from "@faker-js/faker";
import { screen, waitFor } from "@testing-library/react";
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
import { bulkUploadProveedores } from "@/services/proveedores.service";
import { toast } from "sonner";

import { renderWithQueryClient } from "../../../../tests/test-utils";

describe("BulkUploadProveedoresForm - Integration", () => {
  const mockBulkUpload = vi.mocked(bulkUploadProveedores);
  const mockToast = vi.mocked(toast);
  let successMessage: string;

  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(7);
    successMessage = faker.lorem.sentence();
    mockBulkUpload.mockResolvedValue({
      message: successMessage,
      summary: { succeeded: 2, failed: 0 },
      errors: [],
    } as never);
  });

  it("envía el archivo seleccionado al servicio", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(
      <BulkUploadProveedoresForm open={true} onOpenChange={vi.fn()} />
    );

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();

    const file = new File(
      [faker.lorem.paragraph()],
      `${faker.string.alphanumeric(8)}.csv`,
      { type: "text/csv" }
    );
    await user.upload(fileInput!, file);
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      const [firstCall] = mockBulkUpload.mock.calls;
      expect(firstCall?.[0]).toBe(file);
      expect(mockToast.success).toHaveBeenCalledWith("Carga masiva exitosa", {
        description: successMessage,
      });
    });
  });
});
