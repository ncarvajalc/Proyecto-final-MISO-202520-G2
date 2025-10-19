import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("BulkUploadProveedoresForm - Unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedBulkUpload.mockReset();
  });

  it("deshabilita el envío cuando no se ha seleccionado un archivo", async () => {
    const user = userEvent.setup();
    renderComponent();

    const submitButton = screen.getByRole("button", { name: /crear/i });
    expect(submitButton).toBeDisabled();

    await user.click(submitButton);

    expect(mockedBulkUpload).not.toHaveBeenCalled();
    expect(mockedToast.error).not.toHaveBeenCalled();
  });
});
