import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import { AsignacionesModal } from "@/components/vendedor/AsignacionesModal";
import type { Vendedor, PlanDeVenta } from "@/types/vendedor";

describe("AsignacionesModal - Integration", () => {
  beforeEach(() => {
    faker.seed(101);
  });

  const createMockVendedor = (withPlan: boolean = true): Vendedor => {
    const planDeVenta: PlanDeVenta | null = withPlan
      ? {
          identificador: faker.string.alphanumeric(10),
          nombre: faker.commerce.productName(),
          descripcion: faker.lorem.sentence(),
          periodo: `${faker.date.future().getFullYear()}-Q${faker.number.int({
            min: 1,
            max: 4,
          })}`,
          meta: faker.number.float({
            min: 10000,
            max: 100000,
            fractionDigits: 0,
          }),
          unidadesVendidas: faker.number.float({
            min: 0,
            max: 100000,
            fractionDigits: 0,
          }),
        }
      : null;

    return {
      id: faker.string.uuid(),
      nombre: faker.person.fullName(),
      correo: faker.internet.email(),
      fechaContratacion: faker.date.past().toISOString().split("T")[0],
      planDeVenta,
    };
  };

  it("cierra el modal al hacer clic en el botón Regresar", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const vendedor = createMockVendedor();

    render(
      <AsignacionesModal
        open={true}
        onOpenChange={onOpenChange}
        vendedor={vendedor}
      />
    );

    const regresarButton = screen.getByRole("button", { name: /regresar/i });
    await user.click(regresarButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("muestra todos los campos del plan de venta correctamente", () => {
    const vendedor = createMockVendedor();
    const { planDeVenta } = vendedor;

    render(
      <AsignacionesModal
        open={true}
        onOpenChange={vi.fn()}
        vendedor={vendedor}
      />
    );

    // Verificar que todos los campos están presentes
    expect(screen.getByText(planDeVenta!.identificador)).toBeInTheDocument();
    expect(screen.getByText(planDeVenta!.unidadesVendidas)).toBeInTheDocument();
    expect(screen.getByText(planDeVenta!.meta)).toBeInTheDocument();

    // Verificar labels
    expect(screen.getByText("Plan de Venta")).toBeInTheDocument();
    expect(screen.getByText("Unidades Vendidas")).toBeInTheDocument();
    expect(screen.getByText("Meta")).toBeInTheDocument();
    expect(screen.getByText("Cumplimiento de plan")).toBeInTheDocument();
  });

  it("calcula y muestra diferentes niveles de cumplimiento", () => {
    const scenarios = [
      { unidadesVendidas: 25000, meta: 50000, expected: "50.00%" }, // 50%
      { unidadesVendidas: 75000, meta: 100000, expected: "75.00%" }, // 75%
      { unidadesVendidas: 50000, meta: 50000, expected: "100.00%" }, // 100%
      { unidadesVendidas: 60000, meta: 50000, expected: "120.00%" }, // 120%
    ];

    scenarios.forEach(({ unidadesVendidas, meta, expected }) => {
      const vendedor: Vendedor = {
        ...createMockVendedor(),
        planDeVenta: {
          identificador: "TEST-001",
          nombre: "Test Plan",
          descripcion: "Test",
          periodo: "2024-Q1",
          meta,
          unidadesVendidas,
        },
      };

      const { unmount } = render(
        <AsignacionesModal
          open={true}
          onOpenChange={vi.fn()}
          vendedor={vendedor}
        />
      );

      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it("renderiza correctamente con meta cumplida (100%+)", () => {
    const vendedor: Vendedor = {
      ...createMockVendedor(),
      planDeVenta: {
        identificador: "PV-2024-Q1",
        nombre: "Plan Exitoso",
        descripcion: "Plan con meta cumplida",
        periodo: "2024-Q1",
        meta: 50000,
        unidadesVendidas: 55000, // 110% de cumplimiento
      },
    };

    render(
      <AsignacionesModal
        open={true}
        onOpenChange={vi.fn()}
        vendedor={vendedor}
      />
    );

    expect(screen.getByText("110.00%")).toBeInTheDocument();
  });

  it("no renderiza el modal cuando está cerrado", () => {
    const vendedor = createMockVendedor();

    const { container } = render(
      <AsignacionesModal
        open={false}
        onOpenChange={vi.fn()}
        vendedor={vendedor}
      />
    );

    // El Dialog de shadcn/ui no renderiza nada cuando está cerrado
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it("mantiene los datos del vendedor al cambiar el estado del modal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const vendedor = createMockVendedor();

    const { rerender } = render(
      <AsignacionesModal
        open={true}
        onOpenChange={onOpenChange}
        vendedor={vendedor}
      />
    );

    // Verificar que los datos están presentes
    expect(screen.getByText(vendedor.nombre)).toBeInTheDocument();
    expect(
      screen.getByText(vendedor.planDeVenta!.identificador)
    ).toBeInTheDocument();

    // Simular cierre
    await user.click(screen.getByRole("button", { name: /regresar/i }));

    // Re-abrir el modal
    rerender(
      <AsignacionesModal
        open={true}
        onOpenChange={onOpenChange}
        vendedor={vendedor}
      />
    );

    // Verificar que los datos siguen presentes
    await waitFor(() => {
      expect(screen.getByText(vendedor.nombre)).toBeInTheDocument();
      expect(
        screen.getByText(vendedor.planDeVenta!.identificador)
      ).toBeInTheDocument();
    });
  });
});
