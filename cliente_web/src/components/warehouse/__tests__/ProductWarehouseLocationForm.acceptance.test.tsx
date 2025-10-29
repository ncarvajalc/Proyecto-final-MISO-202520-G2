import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createProductWarehouseFormTestContext } from "./warehouseFormTestUtils";

const {
  initialize,
  renderForm,
  chooseOptions,
  getProduct,
  getWarehouse,
  mocks,
} = createProductWarehouseFormTestContext(16);

describe("ProductWarehouseLocationForm - Acceptance", () => {
  initialize();

  it("permite completar el flujo y cerrar el modal", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    mocks.getProductLocation.mockResolvedValue({
      sku: getProduct().sku,
      bodega: getWarehouse().id,
      zona: "ZONE",
      encontrado: true,
    });

    renderForm({ onOpenChange });

    await chooseOptions(user);
    await user.click(await screen.findByRole("button", { name: /localizar/i }));

    expect(await screen.findByText("ZONE")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
