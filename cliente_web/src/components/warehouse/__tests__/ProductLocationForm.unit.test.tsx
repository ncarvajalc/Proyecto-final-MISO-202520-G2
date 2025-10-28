import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createProductLocationFormTestContext } from "./warehouseFormTestUtils";

const { initialize, renderForm, selectProduct } =
  createProductLocationFormTestContext(9);

describe("ProductLocationForm - Unit", () => {
  initialize();

  it("renderiza el encabezado y deshabilita la consulta sin selección", async () => {
    renderForm();

    expect(
      screen.getByRole("heading", { name: "Disponibilidad en bodega" })
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /consultar/i })).toBeDisabled();
  });

  it("habilita la consulta cuando el usuario selecciona un producto", async () => {
    const user = userEvent.setup();
    renderForm();

    await selectProduct(user);

    expect(screen.getByRole("button", { name: /consultar/i })).toBeEnabled();
  });
});
