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

import { renderWithQueryClient } from "../../../../tests/test-utils";

describe("BulkUploadProveedoresForm - Acceptance", () => {
  const mockBulkUpload = vi.mocked(bulkUploadProveedores);
  let successMessage: string;

  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(8);
    successMessage = faker.lorem.sentence();
    mockBulkUpload.mockResolvedValue({
      message: successMessage,
      summary: { succeeded: 2, failed: 0 },
      errors: [],
    } as never);
  });

  it("permite completar la carga y cerrar el modal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithQueryClient(
      <BulkUploadProveedoresForm open={true} onOpenChange={onOpenChange} />
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
      expect(mockBulkUpload).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
