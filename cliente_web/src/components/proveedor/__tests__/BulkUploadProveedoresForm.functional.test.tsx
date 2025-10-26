import { faker } from "@faker-js/faker";
import { fireEvent, screen, waitFor } from "@testing-library/react";
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
import { toast } from "sonner";

import { renderWithQueryClient } from "../../../../tests/test-utils";

describe("BulkUploadProveedoresForm - Functional", () => {
  const mockToast = vi.mocked(toast);

  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(6);
  });

  it("muestra un error cuando el archivo no es CSV", async () => {
    renderWithQueryClient(
      <BulkUploadProveedoresForm open={true} onOpenChange={vi.fn()} />
    );

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();

    const invalidFile = new File(
      [faker.lorem.paragraph()],
      `${faker.string.alphanumeric(8)}.txt`,
      {
        type: "text/plain",
      }
    );

    Object.defineProperty(fileInput!, "files", {
      value: [invalidFile],
      configurable: true,
    });

    fireEvent.change(fileInput!);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Archivo inválido", {
        description: "Solo se permiten archivos CSV",
      });
    });
    expect(screen.getByRole("button", { name: /crear/i })).toBeDisabled();
  });
});
