import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import { AsignacionesModal } from "@/components/vendedor/AsignacionesModal";
import type { Vendedor, PlanDeVenta } from "@/types/vendedor";

describe("AsignacionesModal - Acceptance", () => {
  beforeEach(() => {
    faker.seed(103);
  });

  const createFullVendedor = (): Vendedor => {
    return {
      id: faker.string.uuid(),
      nombre: faker.person.fullName(),
      correo: faker.internet.email(),
      fechaContratacion: faker.date.past().toISOString().split("T")[0],
      planDeVenta: {
        identificador: faker.string.alphanumeric(10),
        nombre: faker.commerce.productName(),
        descripcion: faker.lorem.sentence(),
        periodo: "2024-Q1",
        meta: faker.number.float({
          min: 50000,
          max: 100000,
          fractionDigits: 0,
        }),
        unidadesVendidas: faker.number.float({
          min: 20000,
          max: 80000,
          fractionDigits: 0,
        }),
      },
    };
  };

  it("flujo completo: abrir modal, revisar información y cerrar", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const vendedor = createFullVendedor();

    // Paso 1: Renderizar modal cerrado
    const { rerender } = render(
      <AsignacionesModal
        open={false}
        onOpenChange={onOpenChange}
        vendedor={vendedor}
      />
    );

    // Verificar que el modal no está visible
    expect(screen.queryByText("Reporte Vendedor")).not.toBeInTheDocument();

    // Paso 2: Abrir modal
    rerender(
      <AsignacionesModal
        open={true}
        onOpenChange={onOpenChange}
        vendedor={vendedor}
      />
    );

    // Paso 3: Verificar que el modal está visible con el título
    await waitFor(() => {
      expect(screen.getByText("Reporte Vendedor")).toBeInTheDocument();
    });

    // Paso 4: Verificar información del vendedor
    expect(screen.getByText(vendedor.nombre)).toBeInTheDocument();
    expect(screen.getByText(vendedor.correo)).toBeInTheDocument();
    expect(screen.getByText(vendedor.id)).toBeInTheDocument();

    // Paso 5: Verificar plan de venta
    const planDeVenta = vendedor.planDeVenta!;
    expect(screen.getByText(planDeVenta.identificador)).toBeInTheDocument();
    expect(screen.getByText(planDeVenta.unidadesVendidas)).toBeInTheDocument();
    expect(screen.getByText(planDeVenta.meta)).toBeInTheDocument();

    // Paso 6: Verificar cálculo de cumplimiento
    const expectedPercentage = (
      (planDeVenta.unidadesVendidas / planDeVenta.meta) *
      100
    ).toFixed(2);
    expect(screen.getByText(`${expectedPercentage}%`)).toBeInTheDocument();

    // Paso 7: Cerrar modal mediante botón
    const regresarButton = screen.getByRole("button", { name: /regresar/i });
    await user.click(regresarButton);

    // Paso 8: Verificar que se llamó la función de cierre
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("flujo de usuario: comparar múltiples vendedores", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const vendedores: Vendedor[] = [
      // Vendedor con bajo rendimiento
      {
        ...createFullVendedor(),
        nombre: "Juan Pérez",
        planDeVenta: {
          identificador: "PV-001",
          nombre: "Plan Q1",
          descripcion: "Primer trimestre",
          periodo: "2024-Q1",
          meta: 100000,
          unidadesVendidas: 30000, // 30%
        },
      },
      // Vendedor con buen rendimiento
      {
        ...createFullVendedor(),
        nombre: "María García",
        planDeVenta: {
          identificador: "PV-002",
          nombre: "Plan Q1",
          descripcion: "Primer trimestre",
          periodo: "2024-Q1",
          meta: 100000,
          unidadesVendidas: 85000, // 85%
        },
      },
      // Vendedor que superó la meta
      {
        ...createFullVendedor(),
        nombre: "Carlos López",
        planDeVenta: {
          identificador: "PV-003",
          nombre: "Plan Q1",
          descripcion: "Primer trimestre",
          periodo: "2024-Q1",
          meta: 100000,
          unidadesVendidas: 120000, // 120%
        },
      },
    ];

    const { rerender } = render(
      <AsignacionesModal
        open={false}
        onOpenChange={onOpenChange}
        vendedor={null}
      />
    );

    // Verificar cada vendedor
    for (const vendedor of vendedores) {
      onOpenChange.mockClear();

      // Abrir modal para este vendedor
      rerender(
        <AsignacionesModal
          open={true}
          onOpenChange={onOpenChange}
          vendedor={vendedor}
        />
      );

      // Verificar información específica del vendedor
      await waitFor(() => {
        expect(screen.getByText(vendedor.nombre)).toBeInTheDocument();
      });

      const planDeVenta = vendedor.planDeVenta!;
      const expectedPercentage = (
        (planDeVenta.unidadesVendidas / planDeVenta.meta) *
        100
      ).toFixed(2);

      expect(screen.getByText(`${expectedPercentage}%`)).toBeInTheDocument();
      expect(screen.getByText(planDeVenta.identificador)).toBeInTheDocument();

      // Cerrar modal
      await user.click(screen.getByRole("button", { name: /regresar/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);

      // Cerrar efectivamente
      rerender(
        <AsignacionesModal
          open={false}
          onOpenChange={onOpenChange}
          vendedor={vendedor}
        />
      );
    }
  });

  it("flujo de error: vendedor sin plan de venta", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const vendedorSinPlan: Vendedor = {
      id: faker.string.uuid(),
      nombre: faker.person.fullName(),
      correo: faker.internet.email(),
      fechaContratacion: faker.date.past().toISOString().split("T")[0],
      planDeVenta: null,
    };

    render(
      <AsignacionesModal
        open={true}
        onOpenChange={onOpenChange}
        vendedor={vendedorSinPlan}
      />
    );

    // Verificar mensaje de no asignación
    await waitFor(() => {
      expect(
        screen.getByText("Este vendedor no tiene un plan de venta asignado")
      ).toBeInTheDocument();
    });

    // Verificar que no se muestran indicadores
    expect(screen.queryByText("Indicadores Clave")).not.toBeInTheDocument();
    expect(screen.queryByText("Plan de Venta")).not.toBeInTheDocument();
    expect(screen.queryByText("Unidades Vendidas")).not.toBeInTheDocument();
    expect(screen.queryByText("Meta")).not.toBeInTheDocument();

    // Aún debe poder cerrar el modal
    await user.click(screen.getByRole("button", { name: /regresar/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("flujo de cambio de vendedor mientras el modal está abierto", async () => {
    const onOpenChange = vi.fn();

    const vendedor1 = createFullVendedor();
    vendedor1.nombre = "Vendedor Uno";
    vendedor1.planDeVenta!.identificador = "PV-FIRST";

    const vendedor2 = createFullVendedor();
    vendedor2.nombre = "Vendedor Dos";
    vendedor2.planDeVenta!.identificador = "PV-SECOND";

    const { rerender } = render(
      <AsignacionesModal
        open={true}
        onOpenChange={onOpenChange}
        vendedor={vendedor1}
      />
    );

    // Verificar primer vendedor
    expect(screen.getByText("Vendedor Uno")).toBeInTheDocument();
    expect(screen.getByText("PV-FIRST")).toBeInTheDocument();

    // Cambiar a segundo vendedor sin cerrar el modal
    rerender(
      <AsignacionesModal
        open={true}
        onOpenChange={onOpenChange}
        vendedor={vendedor2}
      />
    );

    // Verificar que se actualizó al segundo vendedor
    await waitFor(() => {
      expect(screen.getByText("Vendedor Dos")).toBeInTheDocument();
      expect(screen.getByText("PV-SECOND")).toBeInTheDocument();
    });

    // Verificar que el primer vendedor ya no está
    expect(screen.queryByText("Vendedor Uno")).not.toBeInTheDocument();
    expect(screen.queryByText("PV-FIRST")).not.toBeInTheDocument();
  });

  it("flujo completo con verificación de todos los campos del plan", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const planCompleto: PlanDeVenta = {
      identificador: "PV-2024-Q1-001",
      nombre: "Plan de Ventas Q1 2024",
      descripcion: "Plan estratégico del primer trimestre",
      periodo: "2024-Q1",
      meta: 75000,
      unidadesVendidas: 56250, // 75%
    };

    const vendedor: Vendedor = {
      id: faker.string.uuid(),
      nombre: "Ana Martínez",
      correo: "ana.martinez@empresa.com",
      fechaContratacion: "2023-01-15",
      planDeVenta: planCompleto,
    };

    render(
      <AsignacionesModal
        open={true}
        onOpenChange={onOpenChange}
        vendedor={vendedor}
      />
    );

    // Verificar encabezado
    expect(screen.getByText("Reporte Vendedor")).toBeInTheDocument();

    // Verificar sección de información del vendedor
    const infoLabels = ["ID", "Nombre", "Email"];
    infoLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    expect(screen.getByText(vendedor.id)).toBeInTheDocument();
    expect(screen.getByText(vendedor.nombre)).toBeInTheDocument();
    expect(screen.getByText(vendedor.correo)).toBeInTheDocument();

    // Verificar sección de indicadores
    expect(screen.getByText("Indicadores Clave")).toBeInTheDocument();

    // Verificar todos los campos del plan
    expect(screen.getByText(planCompleto.identificador)).toBeInTheDocument();
    expect(screen.getByText(planCompleto.unidadesVendidas)).toBeInTheDocument();
    expect(screen.getByText(planCompleto.meta)).toBeInTheDocument();

    // Verificar porcentaje
    expect(screen.getByText("75.00%")).toBeInTheDocument();

    // Verificar estructura de labels
    const planLabels = [
      "Plan de Venta",
      "Unidades Vendidas",
      "Meta",
      "Cumplimiento de plan",
    ];
    planLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    // Verificar botón de cierre
    const regresarButton = screen.getByRole("button", { name: /regresar/i });
    expect(regresarButton).toBeEnabled();

    // Cerrar modal
    await user.click(regresarButton);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("flujo de rendimiento: modal responde rápidamente", async () => {
    const onOpenChange = vi.fn();
    const vendedor = createFullVendedor();

    const startTime = performance.now();

    render(
      <AsignacionesModal
        open={true}
        onOpenChange={onOpenChange}
        vendedor={vendedor}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Reporte Vendedor")).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // El modal debe renderizarse en menos de 500ms
    expect(renderTime).toBeLessThan(500);

    // Todos los elementos deben estar presentes
    expect(screen.getByText(vendedor.nombre)).toBeInTheDocument();
    expect(
      screen.getByText(vendedor.planDeVenta!.identificador)
    ).toBeInTheDocument();
  });
});
