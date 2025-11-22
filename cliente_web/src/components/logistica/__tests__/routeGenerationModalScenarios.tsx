import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faker } from "@faker-js/faker";
import type { ComponentProps } from "react";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

import { RouteGenerationModal } from "@/components/logistica/RouteGenerationModal";
import {
  getRoutesByVehicle,
  optimizeRoute,
} from "@/services/routes.service";
import { toast } from "sonner";

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

const server = setupServer();

const renderModal = (props: Partial<ComponentProps<typeof RouteGenerationModal>> = {}) => {
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
  } satisfies React.ComponentProps<typeof RouteGenerationModal>;
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouteGenerationModal {...defaultProps} {...props} />
    </QueryClientProvider>
  );
  return { onOpenChange, queryClient, ...utils };
};

export const runRouteGenerationModalUnitSuite = () => {
  const mockedGetRoutes = vi.mocked(getRoutesByVehicle);
  const mockedOptimizeRoute = vi.mocked(optimizeRoute);
  const mockedToast = vi.mocked(toast);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetRoutes.mockReset();
    mockedOptimizeRoute.mockReset();
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
    faker.seed(903);
  });

  it("muestra la información del vehículo correctamente", async () => {
    mockedGetRoutes.mockResolvedValue([]);

    const placa = "XYZ-789";
    renderModal({ vehiclePlaca: placa });

    expect(screen.getByText("Generación de Ruta")).toBeInTheDocument();
    expect(screen.getByText(/Vehículo:/)).toBeInTheDocument();
    expect(screen.getByText(placa)).toBeInTheDocument();
  });

  it("muestra estado de carga al buscar rutas", async () => {
    mockedGetRoutes.mockImplementation(() => new Promise(() => {}));

    renderModal();

    await waitFor(() => {
      expect(screen.getByText("Cargando rutas...")).toBeInTheDocument();
    });
  });

  it("muestra mensaje cuando no hay rutas pendientes", async () => {
    mockedGetRoutes.mockResolvedValue([]);

    renderModal();

    await waitFor(() => {
      expect(screen.getByText("No hay rutas pendientes para este vehículo")).toBeInTheDocument();
    });
  });

  it("muestra botón Generar cuando hay rutas pendientes", async () => {
    const routeId = faker.string.uuid();
    mockedGetRoutes.mockResolvedValue([
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
      expect(screen.getByRole("button", { name: /generar/i })).toBeInTheDocument();
    });
  });

  it("solo muestra rutas con status pending", async () => {
    const pendingRouteId = faker.string.uuid();
    mockedGetRoutes.mockResolvedValue([
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

    mockedOptimizeRoute.mockResolvedValue({
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
      expect(screen.getByRole("button", { name: /generar/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /generar/i }));

    await waitFor(() => {
      expect(mockedOptimizeRoute).toHaveBeenCalledWith(pendingRouteId);
    });
  });

  it("deshabilita botón Generar durante la optimización", async () => {
    const routeId = faker.string.uuid();
    mockedGetRoutes.mockResolvedValue([
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

    mockedOptimizeRoute.mockImplementation(() => new Promise(() => {}));

    const user = userEvent.setup();
    renderModal();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /generar/i })).toBeInTheDocument();
    });

    const generateButton = screen.getByRole("button", { name: /generar/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Generando...")).toBeInTheDocument();
      expect(generateButton).toBeDisabled();
    });
  });

  it("muestra toast de error cuando la optimización falla", async () => {
    const mockedToastError = vi.mocked((await import("sonner")).toast.error);
    const routeId = faker.string.uuid();
    const errorMessage = "Route has no stops to optimize";

    mockedGetRoutes.mockResolvedValue([
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

    mockedOptimizeRoute.mockRejectedValue(new Error(errorMessage));

    const user = userEvent.setup();
    renderModal();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /generar/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /generar/i }));

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(errorMessage);
    });
  });

  it("cierra el modal cuando se hace clic en Volver", async () => {
    mockedGetRoutes.mockResolvedValue([]);

    const user = userEvent.setup();
    const { onOpenChange } = renderModal();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /volver/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /volver/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("muestra error cuando getRoutesByVehicle falla", async () => {
    mockedGetRoutes.mockRejectedValue(new Error("Failed to fetch routes"));

    renderModal();

    await waitFor(() => {
      expect(screen.getByText("Error al cargar las rutas")).toBeInTheDocument();
    });
  });

  it("muestra mensaje cuando solo hay rutas completadas", async () => {
    mockedGetRoutes.mockResolvedValue([
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
      expect(screen.getByText("No hay rutas pendientes para este vehículo")).toBeInTheDocument();
    });
  });
};

export const runRouteGenerationModalIntegrationSuite = () => {
  const mockedToast = vi.mocked(toast);

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());
  afterEach(() => {
    server.resetHandlers();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    faker.seed(904);
    mockedToast.success.mockReset();
    mockedToast.error.mockReset();
  });

  it("carga rutas del backend y muestra botón cuando hay rutas pendientes", async () => {
    const apiUrl = "http://localhost:4022";
    vi.stubEnv("VITE_API_URL", apiUrl);

    const vehicleId = faker.string.uuid();
    const routeId = faker.string.uuid();

    server.use(
      http.get(`${apiUrl}/rutas`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("vehicle_id")).toBe(vehicleId);
        return HttpResponse.json({
          data: [
            {
              id: routeId,
              vehicleId,
              date: "2025-10-23",
              totalDistanceKm: 0,
              estimatedTimeH: 0,
              priorityLevel: "normal",
              status: "pending",
              createdAt: faker.date.past().toISOString(),
              updatedAt: faker.date.past().toISOString(),
            },
          ],
        });
      })
    );

    renderModal({ vehicleId });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /generar/i })).toBeInTheDocument();
    });
  });

  it("optimiza ruta end-to-end y muestra visualización", async () => {
    const apiUrl = "http://localhost:4022";
    vi.stubEnv("VITE_API_URL", apiUrl);

    const vehicleId = faker.string.uuid();
    const routeId = faker.string.uuid();
    const clientId1 = faker.string.uuid();
    const clientId2 = faker.string.uuid();

    server.use(
      http.get(`${apiUrl}/rutas`, () =>
        HttpResponse.json({
          data: [
            {
              id: routeId,
              vehicleId,
              date: "2025-10-23",
              totalDistanceKm: 0,
              estimatedTimeH: 0,
              priorityLevel: "normal",
              status: "pending",
              createdAt: faker.date.past().toISOString(),
              updatedAt: faker.date.past().toISOString(),
            },
          ],
        })
      )
    );

    server.use(
      http.post(`${apiUrl}/rutas/${routeId}/optimize`, () =>
        HttpResponse.json({
          id: routeId,
          vehicleId,
          date: "2025-10-23",
          totalDistanceKm: 18.45,
          estimatedTimeH: 0.46,
          priorityLevel: "normal",
          status: "pending",
          createdAt: faker.date.past().toISOString(),
          updatedAt: faker.date.past().toISOString(),
          stops: [
            {
              id: faker.string.uuid(),
              routeId,
              clientId: clientId1,
              sequence: 1,
              estimatedArrival: null,
              delivered: false,
              latitude: 4.6097,
              longitude: -74.0817,
              address: "Calle 127 #15-20, Bogotá",
              createdAt: faker.date.past().toISOString(),
              updatedAt: faker.date.past().toISOString(),
            },
            {
              id: faker.string.uuid(),
              routeId,
              clientId: clientId2,
              sequence: 2,
              estimatedArrival: null,
              delivered: false,
              latitude: 4.6534,
              longitude: -74.0548,
              address: "Autopista Norte #145-30, Bogotá",
              createdAt: faker.date.past().toISOString(),
              updatedAt: faker.date.past().toISOString(),
            },
          ],
        })
      )
    );

    const user = userEvent.setup();
    renderModal({ vehicleId });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /generar/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /generar/i }));

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith("Ruta optimizada exitosamente");
      expect(screen.getByText(/Ruta optimizada/)).toBeInTheDocument();
      expect(screen.getByText(/Calle 127/)).toBeInTheDocument();
      expect(screen.getByText(/Autopista Norte/)).toBeInTheDocument();
    });
  });
};
