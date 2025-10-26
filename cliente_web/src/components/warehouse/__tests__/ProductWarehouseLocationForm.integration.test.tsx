import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createProductWarehouseFormTestContext } from "./warehouseFormTestUtils";

const {
  initialize,
  renderForm,
  chooseOptions,
  getProduct,
  getWarehouse,
  mocks,
} = createProductWarehouseFormTestContext(15);

describe("ProductWarehouseLocationForm - Integration", () => {
  initialize();

  it("muestra un error si el servicio falla", async () => {
    mocks.getProductLocation.mockRejectedValue(new Error("network"));

    renderForm();
    const user = userEvent.setup();

    await chooseOptions(user);
    await user.click(await screen.findByRole("button", { name: /localizar/i }));

    await waitFor(() => {
      expect(mocks.toast.error).toHaveBeenCalledWith(
        "Error al consultar la ubicación del producto"
      );
    });
    expect(mocks.getProductLocation).toHaveBeenCalledWith({
      sku: getProduct().sku,
      bodegaId: getWarehouse().id,
    });
    expect(await screen.findByRole("button", { name: /localizar/i })).toBeEnabled();
  });
});
