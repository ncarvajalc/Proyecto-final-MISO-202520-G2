import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createProductLocationFormTestContext } from "./warehouseFormTestUtils";

const { initialize, renderForm, selectProduct, getProduct, mocks } =
  createProductLocationFormTestContext(10);

describe("ProductLocationForm - Functional", () => {
  initialize();

  it("muestra la información de localización cuando la consulta es exitosa", async () => {
    mocks.getProductLocation.mockResolvedValue({
      sku: getProduct().sku,
      bodega: "Bodega Central",
      zona: "A1",
      encontrado: true,
    });

    const user = userEvent.setup();
    renderForm();

    await selectProduct(user);
    await user.click(screen.getByRole("button", { name: /consultar/i }));

    expect(mocks.getProductLocation).toHaveBeenCalledWith({ sku: getProduct().sku });
    await waitFor(() => {
      expect(
        screen.getByText("Su producto se encuentra en la bodega:")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Bodega Central")).toBeInTheDocument();
    expect(mocks.toast.success).toHaveBeenCalledWith(
      "Producto localizado en Bodega Central, zona A1"
    );
  });

  it("notifica cuando el producto no es encontrado", async () => {
    mocks.getProductLocation.mockResolvedValue({
      sku: getProduct().sku,
      bodega: "Bodega Central",
      zona: "A1",
      encontrado: false,
    });

    const user = userEvent.setup();
    renderForm();

    await selectProduct(user);
    await user.click(screen.getByRole("button", { name: /consultar/i }));

    await waitFor(() => {
      expect(mocks.toast.warning).toHaveBeenCalledWith(
        "Producto no localizado en ninguna bodega"
      );
    });
  });
});
