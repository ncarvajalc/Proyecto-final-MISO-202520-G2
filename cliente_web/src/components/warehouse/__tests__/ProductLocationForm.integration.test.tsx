import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createProductLocationFormTestContext } from "./warehouseFormTestUtils";

const { initialize, renderForm, selectProduct, getProduct, mocks } =
  createProductLocationFormTestContext(11);

describe("ProductLocationForm - Integration", () => {
  initialize();

  it("muestra un error si la consulta de ubicación falla", async () => {
    mocks.getProductLocation.mockRejectedValue(new Error("network error"));

    const user = userEvent.setup();
    renderForm();

    await selectProduct(user);
    await user.click(screen.getByRole("button", { name: /consultar/i }));

    await waitFor(() => {
      expect(mocks.toast.error).toHaveBeenCalledWith(
        "Error al consultar la ubicación del producto"
      );
    });
    expect(mocks.getProductLocation).toHaveBeenCalledWith({
      sku: getProduct().sku,
    });
    expect(screen.getByRole("button", { name: /consultar/i })).toBeEnabled();
  });
});
