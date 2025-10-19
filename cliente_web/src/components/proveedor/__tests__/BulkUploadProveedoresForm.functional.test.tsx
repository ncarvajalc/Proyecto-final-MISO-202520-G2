import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react";
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

describe("BulkUploadProveedoresForm - Functional", () => {
  beforeEach(() => {
    faker.seed(202509);
    vi.clearAllMocks();
    mockedBulkUpload.mockReset();
  });

  it("muestra un mensaje de error cuando se selecciona un archivo no CSV", async () => {
    renderComponent();
    await waitFor(() => {
      expect(document.querySelector('input[type="file"]')).not.toBeNull();
    });
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const invalidFile = new File(
      [faker.lorem.paragraph()],
      `${faker.string.alphanumeric({ length: 8 })}.txt`,
      {
        type: "text/plain",
      }
    );

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(mockedBulkUpload).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Archivo inválido", {
        description: "Solo se permiten archivos CSV",
      })
    );
    expect(fileInput.value).toBe("");
  });
});
