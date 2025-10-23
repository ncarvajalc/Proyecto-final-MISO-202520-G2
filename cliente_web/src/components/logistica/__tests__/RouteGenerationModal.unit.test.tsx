import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import { RouteGenerationModal } from "@/components/logistica/RouteGenerationModal";
import {
  getRoutesByVehicle,
  optimizeRoute,
} from "@/services/routes.service";

vi.mock("@/services/routes.service", () => ({
  getRoutesByVehicle: vi.fn(),
  optimizeRoute: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderModal = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const onOpenChange = vi.fn();
  const defaultProps = {
    open: true,
    onOpenChange,
    vehicleId: faker.string.uuid(),
    vehiclePlaca: "ABC-123",
    vehicleConductor: "Juan Pérez",
  };
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouteGenerationModal {...defaultProps} {...props} />
    </QueryClientProvider>
  );
  return { onOpenChange, queryClient, ...utils };
};

describe("RouteGenerationModal - Unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRoutesByVehicle).mockReset();
    vi.mocked(optimizeRoute).mockReset();
    faker.seed(903);
  });

  it("muestra la información del vehículo correctamente", async () => {
    vi.mocked(getRoutesByVehicle).mockResolvedValue([]);

    const placa = "XYZ-789";
    renderModal({ vehiclePlaca: placa });

    expect(screen.getByText("Generación de Ruta")).toBeInTheDocument();
    expect(screen.getByText(/Vehículo:/)).toBeInTheDocument();
    expect(screen.getByText(placa)).toBeInTheDocument();
  });

  it("muestra estado de carga al buscar rutas", async () => {
    vi.mocked(getRoutesByVehicle).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderModal();

    await waitFor(() => {
      expect(screen.getByText("Cargando rutas...")).toBeInTheDocument();
    });
  });

  it("muestra mensaje cuando no hay rutas pendientes", async () => {
    vi.mocked(getRoutesByVehicle).mockResolvedValue([]);

    renderModal();

    await waitFor(() => {
      expect(
        screen.getByText("No hay rutas pendientes para este vehículo")
      ).toBeInTheDocument();
    });
  });

  it("muestra botón Generar cuando hay rutas pendientes", async () => {
    const routeId = faker.string.uuid();
    vi.mocked(getRoutesByVehicle).mockResolvedValue([
      {
        id: routeId,
        vehicleId: faker.string.uuid(),
        date: "2025-10-23",
        totalDistanceKm: 0,
        estimatedTimeH: 0,
        priorityLevel: "normal",
        status: "pending",
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.past().toISOString(),
      },
    ]);

    renderModal();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generar/i })
      ).toBeInTheDocument();
    });
  });

  it("solo muestra rutas con status pending", async () => {
    const pendingRouteId = faker.string.uuid();
    vi.mocked(getRoutesByVehicle).mockResolvedValue([
      {
        id: faker.string.uuid(),
        vehicleId: faker.string.uuid(),
        date: "2025-10-22",
        totalDistanceKm: 25.5,
        estimatedTimeH: 1.5,
        priorityLevel: "normal",
        status: "completed",
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.past().toISOString(),
      },
      {
        id: pendingRouteId,
        vehicleId: faker.string.uuid(),
        date: "2025-10-23",
        totalDistanceKm: 0,
        estimatedTimeH: 0,
        priorityLevel: "normal",
        status: "pending",
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.past().toISOString(),
      },
    ]);

    vi.mocked(optimizeRoute).mockResolvedValue({
      id: pendingRouteId,
      vehicleId: faker.string.uuid(),
      date: "2025-10-23",
      totalDistanceKm: 18.45,
      estimatedTimeH: 0.46,
      priorityLevel: "normal",
      status: "pending",
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.past().toISOString(),
      stops: [],
    });

    const user = userEvent.setup();
    renderModal();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generar/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /generar/i }));

    await waitFor(() => {
      expect(vi.mocked(optimizeRoute)).toHaveBeenCalledWith(pendingRouteId);
    });
  });

  it("deshabilita botón Generar durante la optimización", async () => {
    const routeId = faker.string.uuid();
    vi.mocked(getRoutesByVehicle).mockResolvedValue([
      {
        id: routeId,
        vehicleId: faker.string.uuid(),
        date: "2025-10-23",
        totalDistanceKm: 0,
        estimatedTimeH: 0,
        priorityLevel: "normal",
        status: "pending",
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.past().toISOString(),
      },
    ]);

    vi.mocked(optimizeRoute).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const user = userEvent.setup();
    renderModal();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generar/i })
      ).toBeInTheDocument();
    });

    const generateButton = screen.getByRole("button", { name: /generar/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Generando...")).toBeInTheDocument();
      expect(generateButton).toBeDisabled();
    });
  });

  it("muestra toast de error cuando la optimización falla", async () => {
    const { toast } = await import("sonner");
    const routeId = faker.string.uuid();
    const errorMessage = "Route has no stops to optimize";

    vi.mocked(getRoutesByVehicle).mockResolvedValue([
      {
        id: routeId,
        vehicleId: faker.string.uuid(),
        date: "2025-10-23",
        totalDistanceKm: 0,
        estimatedTimeH: 0,
        priorityLevel: "normal",
        status: "pending",
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.past().toISOString(),
      },
    ]);

    vi.mocked(optimizeRoute).mockRejectedValue(new Error(errorMessage));

    const user = userEvent.setup();
    renderModal();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generar/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /generar/i }));

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(errorMessage);
    });
  });

  it("cierra el modal cuando se hace clic en Volver", async () => {
    vi.mocked(getRoutesByVehicle).mockResolvedValue([]);

    const user = userEvent.setup();
    const { onOpenChange } = renderModal();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /volver/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /volver/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("muestra error cuando getRoutesByVehicle falla", async () => {
    vi.mocked(getRoutesByVehicle).mockRejectedValue(
      new Error("Failed to fetch routes")
    );

    renderModal();

    await waitFor(() => {
      expect(screen.getByText("Error al cargar las rutas")).toBeInTheDocument();
    });
  });

  it("muestra mensaje apropiado cuando no hay rutas pendientes pero hay completadas", async () => {
    vi.mocked(getRoutesByVehicle).mockResolvedValue([
      {
        id: faker.string.uuid(),
        vehicleId: faker.string.uuid(),
        date: "2025-10-22",
        totalDistanceKm: 25.5,
        estimatedTimeH: 1.5,
        priorityLevel: "normal",
        status: "completed",
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.past().toISOString(),
      },
    ]);

    renderModal();

    await waitFor(() => {
      expect(
        screen.getByText("No hay rutas pendientes para este vehículo")
      ).toBeInTheDocument();
    });
  });
});
