import React, { useEffect, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import { AsignacionesModal } from "@/components/vendedor/AsignacionesModal";
import type { PlanDeVenta, Vendedor } from "@/types/vendedor";

describe("AsignacionesModal - Acceptance", () => {
  beforeEach(() => {
    faker.seed(5025);
  });

  const buildPlan = (overrides: Partial<PlanDeVenta> = {}): PlanDeVenta => ({
    identificador: overrides.identificador ?? faker.string.alphanumeric(10),
    nombre: overrides.nombre ?? faker.commerce.productName(),
    descripcion: overrides.descripcion ?? faker.commerce.productDescription(),
    periodo: overrides.periodo ?? "2025-Q3",
    meta: overrides.meta ?? 75000,
    unidadesVendidas: overrides.unidadesVendidas ?? 56250,
  });

  const buildVendedor = (overrides: Partial<Vendedor> = {}): Vendedor => ({
    id: overrides.id ?? faker.string.uuid(),
    nombre: overrides.nombre ?? faker.person.fullName(),
    correo: overrides.correo ?? faker.internet.email(),
    fechaContratacion:
      overrides.fechaContratacion ??
      faker.date.past({ years: 4 }).toISOString().split("T")[0],
    planDeVenta:
      Object.prototype.hasOwnProperty.call(overrides, "planDeVenta")
        ? (overrides.planDeVenta ?? null)
        : buildPlan(),
  });

  type Reporte = { id: string; resumen: string; vendedor: Vendedor };

  const ReportsExperience = ({
    reportes,
    loadReport,
  }: {
    reportes: Reporte[];
    loadReport: (id: string) => Promise<Vendedor>;
  }) => {
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [vendedor, setVendedor] = useState<Vendedor | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (!selectedId) {
        return;
      }
      setLoading(true);
      loadReport(selectedId)
        .then((data) => {
          setVendedor(data);
          setOpen(true);
        })
        .finally(() => setLoading(false));
    }, [loadReport, selectedId]);

    return (
      <div>
        <h1>Reportes de vendedores</h1>
        <ul>
          {reportes.map((reporte) => (
            <li key={reporte.id}>
              <button onClick={() => setSelectedId(reporte.id)}>
                Consultar reporte de {reporte.vendedor.nombre}
              </button>
              <span>{reporte.resumen}</span>
            </li>
          ))}
        </ul>

        {loading && <p>Cargando reporte…</p>}

        <AsignacionesModal
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (!value) {
              setVendedor(null);
              setSelectedId(null);
            }
          }}
          vendedor={vendedor}
        />
      </div>
    );
  };

  it("permite al usuario consultar un reporte y ver los indicadores", async () => {
    const reporte = {
      id: faker.string.uuid(),
      resumen: "Reporte disponible",
      vendedor: buildVendedor({
        nombre: "Daniela Ríos",
        planDeVenta: buildPlan({ identificador: "PV-RIOS", meta: 90000, unidadesVendidas: 81000 }),
      }),
    } satisfies Reporte;

    const loadReport = vi.fn(async () => reporte.vendedor);
    const user = userEvent.setup();

    render(<ReportsExperience reportes={[reporte]} loadReport={loadReport} />);

    await user.click(
      screen.getByRole("button", { name: /Consultar reporte de Daniela Ríos/i })
    );

    await waitFor(() => {
      expect(loadReport).toHaveBeenCalledWith(reporte.id);
      expect(screen.getByText("PV-RIOS")).toBeInTheDocument();
    });

    expect(screen.getByText("81000")).toBeInTheDocument();
    expect(screen.queryByText("Cargando reporte…")).not.toBeInTheDocument();
    expect(screen.getByText("90000")).toBeInTheDocument();
    expect(screen.getByText("90.00%"))
      .withContext("El cálculo de cumplimiento debe ser visible en el reporte")
      .toBeInTheDocument();
  });

  it("informa cuando el vendedor no tiene plan de venta asociado", async () => {
    const vendedorSinPlan = buildVendedor({ nombre: "Rosa Mejía", planDeVenta: null });
    const reporte = {
      id: faker.string.uuid(),
      resumen: "Sin plan",
      vendedor: vendedorSinPlan,
    } satisfies Reporte;

    const loadReport = vi.fn(async () => vendedorSinPlan);
    const user = userEvent.setup();

    render(<ReportsExperience reportes={[reporte]} loadReport={loadReport} />);

    await user.click(
      screen.getByRole("button", { name: /Consultar reporte de Rosa Mejía/i })
    );

    expect(
      await screen.findByText(/este vendedor no tiene un plan de venta asignado/i)
    ).toBeInTheDocument();
  });

  it("restablece la selección al cerrar el modal", async () => {
    const vendedor = buildVendedor();
    const reportes: Reporte[] = [
      {
        id: faker.string.uuid(),
        resumen: "Disponible",
        vendedor,
      },
    ];
    const loadReport = vi.fn(async () => vendedor);
    const user = userEvent.setup();

    render(<ReportsExperience reportes={reportes} loadReport={loadReport} />);

    await user.click(screen.getByRole("button", { name: /Consultar reporte/i }));
    expect(await screen.findByText("Reporte Vendedor")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /regresar/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Consultar reporte/i }));
    expect(await screen.findByText("Reporte Vendedor")).toBeInTheDocument();
    expect(loadReport).toHaveBeenCalledTimes(2);
  });
});
