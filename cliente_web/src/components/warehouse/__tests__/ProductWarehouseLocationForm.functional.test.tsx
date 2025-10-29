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
} = createProductWarehouseFormTestContext(14);

describe("ProductWarehouseLocationForm - Functional", () => {
  initialize();

  it("muestra la zona cuando el producto es encontrado", async () => {
    const zone = "ZONE";
    mocks.getProductLocation.mockResolvedValue({
      sku: getProduct().sku,
      bodega: getWarehouse().id,
      zona: zone,
      encontrado: true,
    });

    renderForm();
    const user = userEvent.setup();

    await chooseOptions(user);
    await user.click(await screen.findByRole("button", { name: /localizar/i }));

    expect(mocks.getProductLocation).toHaveBeenCalledWith({
      sku: getProduct().sku,
      bodegaId: getWarehouse().id,
    });
    await waitFor(() => {
      expect(screen.getByText(zone)).toBeInTheDocument();
    });
    expect(mocks.toast.success).toHaveBeenCalledWith(
      `Producto localizado en zona ${zone}`
    );
  });

  it("avisa cuando el producto no está en la bodega", async () => {
    mocks.getProductLocation.mockResolvedValue({
      sku: getProduct().sku,
      bodega: getWarehouse().id,
      zona: "N/A",
      encontrado: false,
    });

    renderForm();
    const user = userEvent.setup();

    await chooseOptions(user);
    await user.click(await screen.findByRole("button", { name: /localizar/i }));

    await waitFor(() => {
      expect(mocks.toast.warning).toHaveBeenCalledWith(
        "Producto no localizado en esta bodega"
      );
    });
  });
});
