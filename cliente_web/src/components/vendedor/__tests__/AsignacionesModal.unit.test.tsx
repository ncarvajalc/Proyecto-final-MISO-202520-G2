import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { faker } from "@faker-js/faker";

import { AsignacionesModal } from "@/components/vendedor/AsignacionesModal";
import type { PlanDeVenta, Vendedor } from "@/types/vendedor";

describe("AsignacionesModal - Unit", () => {
  beforeEach(() => {
    faker.seed(2025);
  });

  const buildPlan = (overrides: Partial<PlanDeVenta> = {}): PlanDeVenta => ({
    identificador: faker.string.alphanumeric(8).toUpperCase(),
    nombre: faker.commerce.productName(),
    descripcion: faker.commerce.productDescription(),
    periodo: `${faker.date.future().getFullYear()}-Q1`,
    meta: 50000,
    unidadesVendidas: 27500,
    ...overrides,
  });

  const buildVendedor = (overrides: Partial<Vendedor> = {}): Vendedor => ({
    id: faker.string.uuid(),
    nombre: faker.person.fullName(),
    correo: faker.internet.email(),
    fechaContratacion: faker.date
      .past({ years: 3 })
      .toISOString()
      .split("T")[0],
    planDeVenta: buildPlan(),
    ...overrides,
  });

  it("no renderiza el diálogo cuando no hay vendedor seleccionado", () => {
    const { container } = render(
      <AsignacionesModal open={true} onOpenChange={() => {}} vendedor={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("muestra la información del vendedor y su plan", () => {
    const vendedor = buildVendedor();

    render(
      <AsignacionesModal
        open={true}
        onOpenChange={() => {}}
        vendedor={vendedor}
      />
    );

    expect(screen.getByText("Reporte Vendedor")).toBeInTheDocument();
    expect(screen.getByText(vendedor.id)).toBeInTheDocument();
    expect(screen.getByText(vendedor.nombre)).toBeInTheDocument();
    expect(screen.getByText(vendedor.correo)).toBeInTheDocument();

    const plan = vendedor.planDeVenta!;
    expect(screen.getByText(plan.identificador)).toBeInTheDocument();
    expect(screen.getByText(plan.meta)).toBeInTheDocument();
    expect(screen.getByText(plan.unidadesVendidas ?? 0)).toBeInTheDocument();

    const cumplimiento = ((plan.unidadesVendidas ?? 0) / plan.meta) * 100;
    expect(screen.getByText(`${cumplimiento.toFixed(2)}%`)).toBeInTheDocument();
  });

  it("indica cuando el vendedor no tiene plan de venta asignado", () => {
    const vendedorSinPlan = buildVendedor({ planDeVenta: null });

    render(
      <AsignacionesModal
        open={true}
        onOpenChange={() => {}}
        vendedor={vendedorSinPlan}
      />
    );

    expect(
      screen.getByText("Este vendedor no tiene un plan de venta asignado")
    ).toBeInTheDocument();
  });

  it("muestra ceros cuando las unidades vendidas no están definidas", () => {
    const vendedorConDatosIncompletos = buildVendedor({
      planDeVenta: buildPlan({ unidadesVendidas: undefined as unknown as number }),
    });

    render(
      <AsignacionesModal
        open={true}
        onOpenChange={() => {}}
        vendedor={vendedorConDatosIncompletos}
      />
    );

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("0.00%"))
      .withContext("El porcentaje debe manejar valores falsy como 0.00%")
      .toBeInTheDocument();
  });

  it("evita divisiones inválidas cuando la meta es cero", () => {
    const vendedorConMetaCero = buildVendedor({
      planDeVenta: buildPlan({ meta: 0, unidadesVendidas: 3500 }),
    });

    render(
      <AsignacionesModal
        open={true}
        onOpenChange={() => {}}
        vendedor={vendedorConMetaCero}
      />
    );

    expect(screen.getByText("3500")).toBeInTheDocument();
    expect(screen.getByText("0"))
      .withContext("La meta igual a 0 debe mostrarse en el reporte")
      .toBeInTheDocument();
    expect(screen.getByText("0.00%"))
      .withContext("El porcentaje debe ser 0.00% para evitar divisiones por cero")
      .toBeInTheDocument();
  });
});
