import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import { AsignacionesModal } from "@/components/vendedor/AsignacionesModal";
import type { Vendedor, PlanDeVenta } from "@/types/vendedor";

describe("AsignacionesModal - Unit", () => {
  beforeEach(() => {
    faker.seed(100);
  });

  const mockVendedorWithoutPlan: Vendedor = {
    id: faker.string.uuid(),
    nombre: faker.person.fullName(),
    correo: faker.internet.email(),
    fechaContratacion: faker.date.past().toISOString().split("T")[0],
    planDeVenta: null,
  };

  const mockPlanDeVenta: PlanDeVenta = {
    identificador: "PV-2024-Q1",
    nombre: "Plan Primer Trimestre 2024",
    descripcion: "Plan de ventas del primer trimestre",
    periodo: "2024-Q1",
    meta: 50000,
    unidadesVendidas: 35000,
  };

  const mockVendedorWithPlan: Vendedor = {
    ...mockVendedorWithoutPlan,
    planDeVenta: mockPlanDeVenta,
  };

  it("no renderiza nada cuando vendedor es null", () => {
    const { container } = render(
      <AsignacionesModal open={true} onOpenChange={vi.fn()} vendedor={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("muestra la información básica del vendedor", () => {
    render(
      <AsignacionesModal
        open={true}
        onOpenChange={vi.fn()}
        vendedor={mockVendedorWithPlan}
      />
    );

    expect(screen.getByText("Reporte Vendedor")).toBeInTheDocument();
    expect(screen.getByText(mockVendedorWithPlan.id)).toBeInTheDocument();
    expect(screen.getByText(mockVendedorWithPlan.nombre)).toBeInTheDocument();
    expect(screen.getByText(mockVendedorWithPlan.correo)).toBeInTheDocument();
  });

  it("muestra mensaje cuando el vendedor no tiene plan de venta", () => {
    render(
      <AsignacionesModal
        open={true}
        onOpenChange={vi.fn()}
        vendedor={mockVendedorWithoutPlan}
      />
    );

    expect(
      screen.getByText("Este vendedor no tiene un plan de venta asignado")
    ).toBeInTheDocument();
  });

  it("muestra los indicadores clave cuando hay plan de venta", () => {
    render(
      <AsignacionesModal
        open={true}
        onOpenChange={vi.fn()}
        vendedor={mockVendedorWithPlan}
      />
    );

    expect(screen.getByText("Indicadores Clave")).toBeInTheDocument();
    expect(screen.getByText(mockPlanDeVenta.identificador)).toBeInTheDocument();
    expect(
      screen.getByText(mockPlanDeVenta.unidadesVendidas)
    ).toBeInTheDocument();
    expect(screen.getByText(mockPlanDeVenta.meta)).toBeInTheDocument();
  });

  it("calcula correctamente el porcentaje de cumplimiento", () => {
    render(
      <AsignacionesModal
        open={true}
        onOpenChange={vi.fn()}
        vendedor={mockVendedorWithPlan}
      />
    );

    // (35000 / 50000) * 100 = 70.00%
    const expectedPercentage = (
      (mockPlanDeVenta.unidadesVendidas / mockPlanDeVenta.meta) *
      100
    ).toFixed(2);

    expect(screen.getByText(`${expectedPercentage}%`)).toBeInTheDocument();
  });

  it("muestra 0.00% cuando no hay datos de ventas", () => {
    const vendedorSinVentas: Vendedor = {
      ...mockVendedorWithPlan,
      planDeVenta: {
        ...mockPlanDeVenta,
        unidadesVendidas: 0,
      },
    };

    render(
      <AsignacionesModal
        open={true}
        onOpenChange={vi.fn()}
        vendedor={vendedorSinVentas}
      />
    );

    expect(screen.getByText("0.00%")).toBeInTheDocument();
  });

  it("maneja correctamente valores nulos en unidadesVendidas", () => {
    const vendedorConNulos: Vendedor = {
      ...mockVendedorWithPlan,
      planDeVenta: {
        ...mockPlanDeVenta,
        unidadesVendidas: undefined as any,
      },
    };

    render(
      <AsignacionesModal
        open={true}
        onOpenChange={vi.fn()}
        vendedor={vendedorConNulos}
      />
    );

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("0.00%")).toBeInTheDocument();
  });
});
