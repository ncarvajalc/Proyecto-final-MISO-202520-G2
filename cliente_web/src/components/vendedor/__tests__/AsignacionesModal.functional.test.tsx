import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import { AsignacionesModal } from "@/components/vendedor/AsignacionesModal";
import type { PlanDeVenta, Vendedor } from "@/types/vendedor";

describe("AsignacionesModal - Functional", () => {
  beforeEach(() => {
    faker.seed(3025);
  });

  const buildPlan = (overrides: Partial<PlanDeVenta> = {}): PlanDeVenta => ({
    identificador: faker.string.alphanumeric(6).toUpperCase(),
    nombre: faker.commerce.productName(),
    descripcion: faker.commerce.productDescription(),
    periodo: "2025-Q1",
    meta: 42000,
    unidadesVendidas: 21000,
    ...overrides,
  });

  const buildVendedor = (overrides: Partial<Vendedor> = {}): Vendedor => ({
    id: faker.string.uuid(),
    nombre: faker.person.fullName(),
    correo: faker.internet.email(),
    fechaContratacion: faker.date
      .past({ years: 1 })
      .toISOString()
      .split("T")[0],
    planDeVenta: buildPlan(),
    ...overrides,
  });

  it("llama a onOpenChange(false) al presionar el botón Regresar", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const vendedor = buildVendedor();

    render(
      <AsignacionesModal open={true} onOpenChange={onOpenChange} vendedor={vendedor} />
    );

    await user.click(screen.getByRole("button", { name: /regresar/i }));

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("actualiza los indicadores cuando cambia el vendedor proporcionado", () => {
    const vendedorInicial = buildVendedor({
      planDeVenta: buildPlan({ meta: 50000, unidadesVendidas: 10000 }),
    });
    const vendedorActualizado = buildVendedor({
      planDeVenta: buildPlan({ meta: 80000, unidadesVendidas: 60000 }),
    });

    const { rerender } = render(
      <AsignacionesModal open={true} onOpenChange={() => {}} vendedor={vendedorInicial} />
    );

    expect(screen.getByText("20.00%"))
      .withContext("El primer vendedor debería mostrar 20% de cumplimiento")
      .toBeInTheDocument();

    rerender(
      <AsignacionesModal
        open={true}
        onOpenChange={() => {}}
        vendedor={vendedorActualizado}
      />
    );

    expect(screen.getByText("75.00%"))
      .withContext("Al actualizar el vendedor se deben recalcular los porcentajes")
      .toBeInTheDocument();
    expect(screen.getByText("60000")).toBeInTheDocument();
    expect(screen.getByText("80000")).toBeInTheDocument();
  });

  it("esconde la información cuando el modal está cerrado y la muestra al abrirlo", () => {
    const vendedor = buildVendedor({
      planDeVenta: buildPlan({ meta: 100, unidadesVendidas: 0 }),
    });

    const { rerender, container } = render(
      <AsignacionesModal open={false} onOpenChange={() => {}} vendedor={vendedor} />
    );

    expect(container.querySelector("[role='dialog']")).toBeNull();

    rerender(
      <AsignacionesModal open={true} onOpenChange={() => {}} vendedor={vendedor} />
    );

    expect(screen.getByText("0.00%"))
      .withContext("Al abrirse debe mostrar los indicadores calculados")
      .toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
