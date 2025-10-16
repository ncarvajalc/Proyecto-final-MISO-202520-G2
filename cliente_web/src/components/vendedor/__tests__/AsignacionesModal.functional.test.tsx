import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import { AsignacionesModal } from "@/components/vendedor/AsignacionesModal";
import type { Vendedor } from "@/types/vendedor";

describe("AsignacionesModal - Functional", () => {
  beforeEach(() => {
    faker.seed(102);
  });

  const createVendedorWithProgress = (progressPercentage: number): Vendedor => {
    const meta = 100000;
    const unidadesVendidas = (meta * progressPercentage) / 100;

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
        meta,
        unidadesVendidas,
      },
    };
  };

  describe("visualización de progreso del plan", () => {
    it("muestra el progreso en estado inicial (0%)", () => {
      const vendedor = createVendedorWithProgress(0);

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={vi.fn()}
          vendedor={vendedor}
        />
      );

      expect(screen.getByText("0.00%")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument(); // unidades vendidas
      expect(screen.getByText("100000")).toBeInTheDocument(); // meta
    });

    it("muestra progreso bajo (25%)", () => {
      const vendedor = createVendedorWithProgress(25);

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={vi.fn()}
          vendedor={vendedor}
        />
      );

      expect(screen.getByText("25.00%")).toBeInTheDocument();
      expect(screen.getByText("25000")).toBeInTheDocument();
    });

    it("muestra progreso medio (50%)", () => {
      const vendedor = createVendedorWithProgress(50);

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={vi.fn()}
          vendedor={vendedor}
        />
      );

      expect(screen.getByText("50.00%")).toBeInTheDocument();
      expect(screen.getByText("50000")).toBeInTheDocument();
    });

    it("muestra progreso alto (90%)", () => {
      const vendedor = createVendedorWithProgress(90);

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={vi.fn()}
          vendedor={vendedor}
        />
      );

      expect(screen.getByText("90.00%")).toBeInTheDocument();
      expect(screen.getByText("90000")).toBeInTheDocument();
    });

    it("muestra meta cumplida (100%)", () => {
      const vendedor = createVendedorWithProgress(100);

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={vi.fn()}
          vendedor={vendedor}
        />
      );

      expect(screen.getByText("100.00%")).toBeInTheDocument();
      // When 100% both values are the same (100000), so we check for multiple instances
      const metaElements = screen.getAllByText("100000");
      expect(metaElements).toHaveLength(2); // Unidades Vendidas and Meta
    });

    it("muestra meta superada (120%)", () => {
      const vendedor = createVendedorWithProgress(120);

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={vi.fn()}
          vendedor={vendedor}
        />
      );

      expect(screen.getByText("120.00%")).toBeInTheDocument();
      expect(screen.getByText("120000")).toBeInTheDocument(); // unidades vendidas
      expect(screen.getByText("100000")).toBeInTheDocument(); // meta
    });
  });

  describe("interacción del usuario con el modal", () => {
    it("permite cerrar el modal mediante el botón Regresar", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const vendedor = createVendedorWithProgress(75);

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={onOpenChange}
          vendedor={vendedor}
        />
      );

      const regresarButton = screen.getByRole("button", { name: /regresar/i });
      expect(regresarButton).toBeInTheDocument();
      expect(regresarButton).toBeEnabled();

      await user.click(regresarButton);

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("no cierra el modal al hacer clic dentro del contenido", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const vendedor = createVendedorWithProgress(75);

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={onOpenChange}
          vendedor={vendedor}
        />
      );

      // Click en el título
      await user.click(screen.getByText("Reporte Vendedor"));

      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe("manejo de casos extremos", () => {
    it("maneja divisiones por cero cuando meta es 0", () => {
      const vendedor: Vendedor = {
        id: faker.string.uuid(),
        nombre: faker.person.fullName(),
        correo: faker.internet.email(),
        fechaContratacion: faker.date.past().toISOString().split("T")[0],
        planDeVenta: {
          identificador: "TEST-001",
          nombre: "Test Plan",
          descripcion: "Test",
          periodo: "2024-Q1",
          meta: 0,
          unidadesVendidas: 100,
        },
      };

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={vi.fn()}
          vendedor={vendedor}
        />
      );

      // Debería mostrar Infinity o NaN manejado apropiadamente
      // En este caso, el cálculo (100/0)*100 = Infinity
      const percentage = screen
        .getByText(/Cumplimiento de plan/i)
        .closest("div")
        ?.querySelector("p")?.textContent;

      expect(percentage).toBeDefined();
    });

    it("maneja números decimales correctamente", () => {
      const vendedor: Vendedor = {
        id: faker.string.uuid(),
        nombre: faker.person.fullName(),
        correo: faker.internet.email(),
        fechaContratacion: faker.date.past().toISOString().split("T")[0],
        planDeVenta: {
          identificador: "TEST-001",
          nombre: "Test Plan",
          descripcion: "Test",
          periodo: "2024-Q1",
          meta: 75000,
          unidadesVendidas: 33333.33,
        },
      };

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={vi.fn()}
          vendedor={vendedor}
        />
      );

      // (33333.33 / 75000) * 100 = 44.44%
      expect(screen.getByText("44.44%")).toBeInTheDocument();
    });

    it("renderiza correctamente con valores muy grandes", () => {
      const vendedor: Vendedor = {
        id: faker.string.uuid(),
        nombre: faker.person.fullName(),
        correo: faker.internet.email(),
        fechaContratacion: faker.date.past().toISOString().split("T")[0],
        planDeVenta: {
          identificador: "TEST-LARGE",
          nombre: "Plan Grande",
          descripcion: "Plan con números grandes",
          periodo: "2024-Q1",
          meta: 99999999,
          unidadesVendidas: 50000000,
        },
      };

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={vi.fn()}
          vendedor={vendedor}
        />
      );

      expect(screen.getByText("99999999")).toBeInTheDocument();
      expect(screen.getByText("50000000")).toBeInTheDocument();
      expect(screen.getByText("50.00%")).toBeInTheDocument();
    });
  });

  describe("formato y presentación de datos", () => {
    it("mantiene el formato de dos decimales en el porcentaje", () => {
      const vendedor = createVendedorWithProgress(33.333);

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={vi.fn()}
          vendedor={vendedor}
        />
      );

      // Debe redondear a dos decimales
      expect(screen.getByText("33.33%")).toBeInTheDocument();
    });

    it("muestra correctamente la información del vendedor en la sección superior", () => {
      const vendedor = createVendedorWithProgress(75);

      render(
        <AsignacionesModal
          open={true}
          onOpenChange={vi.fn()}
          vendedor={vendedor}
        />
      );

      // Verificar labels de información del vendedor
      expect(screen.getByText("ID")).toBeInTheDocument();
      expect(screen.getByText("Nombre")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();

      // Verificar valores
      expect(screen.getByText(vendedor.id)).toBeInTheDocument();
      expect(screen.getByText(vendedor.nombre)).toBeInTheDocument();
      expect(screen.getByText(vendedor.correo)).toBeInTheDocument();
    });
  });
});
