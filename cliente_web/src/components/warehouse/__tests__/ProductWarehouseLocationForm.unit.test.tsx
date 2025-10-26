import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createProductWarehouseFormTestContext } from "./warehouseFormTestUtils";

const { initialize, renderForm, chooseOptions } =
  createProductWarehouseFormTestContext(13);

describe("ProductWarehouseLocationForm - Unit", () => {
  initialize();

  it("muestra los selectores de producto y bodega", async () => {
    renderForm();

    expect(
      screen.getByRole("heading", { name: /consulta de producto/i })
    ).toBeInTheDocument();
    expect(await screen.findByRole("combobox", { name: "SKU" })).toBeDefined();
    expect(await screen.findByRole("combobox", { name: "Bodega" })).toBeDefined();
  });

  it("habilita el botón cuando hay un producto y una bodega seleccionados", async () => {
    renderForm();
    const user = userEvent.setup();

    await chooseOptions(user);
    expect(
      await screen.findByRole("button", { name: /localizar/i })
    ).toBeEnabled();
  });
});
