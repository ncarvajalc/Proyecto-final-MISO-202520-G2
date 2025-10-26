import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createProductLocationFormTestContext } from "./warehouseFormTestUtils";

const { initialize, renderForm, selectProduct, getProduct, mocks } =
  createProductLocationFormTestContext(12);

describe("ProductLocationForm - Acceptance", () => {
  initialize();

  it("permite completar el flujo y cerrar el modal", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    mocks.getProductLocation.mockResolvedValue({
      sku: getProduct().sku,
      bodega: "Bodega Central",
      zona: "A1",
      encontrado: true,
    });

    renderForm({ onOpenChange });

    await selectProduct(user);
    await user.click(screen.getByRole("button", { name: /consultar/i }));
    expect(await screen.findByText("Bodega Central")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
