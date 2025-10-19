import React, { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { faker } from "@faker-js/faker";

import { AsignacionesModal } from "@/components/vendedor/AsignacionesModal";
import type { PlanDeVenta, Vendedor } from "@/types/vendedor";

describe("AsignacionesModal - Integration", () => {
  beforeEach(() => {
    faker.seed(4025);
  });

  const buildPlan = (overrides: Partial<PlanDeVenta> = {}): PlanDeVenta => ({
    identificador: overrides.identificador ?? faker.string.alphanumeric(6),
    nombre: overrides.nombre ?? faker.commerce.productName(),
    descripcion: overrides.descripcion ?? faker.commerce.productDescription(),
    periodo: overrides.periodo ?? "2025-Q2",
    meta: overrides.meta ?? 60000,
    unidadesVendidas: overrides.unidadesVendidas ?? 45000,
  });

  const buildVendedor = (overrides: Partial<Vendedor> = {}): Vendedor => ({
    id: overrides.id ?? faker.string.uuid(),
    nombre: overrides.nombre ?? faker.person.fullName(),
    correo: overrides.correo ?? faker.internet.email(),
    fechaContratacion:
      overrides.fechaContratacion ??
      faker.date.past({ years: 2 }).toISOString().split("T")[0],
    planDeVenta:
      Object.prototype.hasOwnProperty.call(overrides, "planDeVenta")
        ? (overrides.planDeVenta ?? null)
        : buildPlan(),
  });

  const renderWrapper = (vendedores: Vendedor[]) => {
    const Wrapper = () => {
      const [seleccionado, setSeleccionado] = useState<Vendedor | null>(null);
      const [abierto, setAbierto] = useState(false);

      return (
        <div>
          <ul>
            {vendedores.map((vendedor) => (
              <li key={vendedor.id}>
                <button
                  onClick={() => {
                    setSeleccionado(vendedor);
                    setAbierto(true);
                  }}
                >
                  Ver reporte de {vendedor.nombre}
                </button>
              </li>
            ))}
          </ul>

          <AsignacionesModal
            open={abierto}
            onOpenChange={setAbierto}
            vendedor={seleccionado}
          />
        </div>
      );
    };

    return render(<Wrapper />);
  };

  it("muestra el plan del vendedor seleccionado desde la lista", async () => {
    const vendedores = [
      buildVendedor({
        nombre: "Ana Morales",
        planDeVenta: buildPlan({ identificador: "PV-ACTIVO", unidadesVendidas: 32000, meta: 40000 }),
      }),
      buildVendedor({ nombre: "Luis Fernández", planDeVenta: null }),
    ];
    const user = userEvent.setup();

    expect(vendedores[0].planDeVenta).not.toBeNull();
    expect(vendedores[1].planDeVenta).toBeNull();

    renderWrapper(vendedores);

    await user.click(screen.getByRole("button", { name: /Ana Morales/i }));

    expect(await screen.findByText("PV-ACTIVO")).toBeInTheDocument();
    expect(screen.getByText("32000")).toBeInTheDocument();
    expect(screen.getByText("40000")).toBeInTheDocument();
    expect(screen.getByText("80.00%"))
      .withContext("El porcentaje debe calcularse para el vendedor seleccionado")
      .toBeInTheDocument();
  });

  it("permite cambiar entre vendedores y muestra el estado correspondiente", async () => {
    const vendedores = [
      buildVendedor({
        nombre: "Laura Herrera",
        planDeVenta: buildPlan({ identificador: "PV-LAURA", meta: 90000, unidadesVendidas: 90000 }),
      }),
      buildVendedor({ nombre: "Mario Soto", planDeVenta: null }),
    ];
    const user = userEvent.setup();

    expect(vendedores[0].planDeVenta).not.toBeNull();
    expect(vendedores[1].planDeVenta).toBeNull();

    renderWrapper(vendedores);

    await user.click(screen.getByRole("button", { name: /Laura Herrera/i }));
    expect(await screen.findByText("PV-LAURA")).toBeInTheDocument();
    expect(screen.getByText("100.00%"))
      .withContext("Cuando la meta se cumple se muestra 100%")
      .toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /regresar/i }));

    await waitFor(() => {
      expect(screen.queryByText("PV-LAURA")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Mario Soto/i }));

    expect(
      await screen.findByText(/este vendedor no tiene un plan de venta asignado/i)
    ).toBeInTheDocument();
  });

  it("respeta el cierre del modal manteniendo la selección previa", async () => {
    const vendedores = [buildVendedor(), buildVendedor()];
    const user = userEvent.setup();

    const { getAllByRole, queryByRole } = renderWrapper(vendedores);

    const [primerBoton] = getAllByRole("button", { name: /Ver reporte de/i });
    await user.click(primerBoton);
    expect(await screen.findByText("Reporte Vendedor")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /regresar/i }));
    expect(queryByRole("dialog")).not.toBeInTheDocument();
  });
});
