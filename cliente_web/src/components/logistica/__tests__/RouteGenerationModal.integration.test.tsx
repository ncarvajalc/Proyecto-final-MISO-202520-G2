import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { faker } from "@faker-js/faker";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

import { RouteGenerationModal } from "@/components/logistica/RouteGenerationModal";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "sonner";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const renderModal = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const onOpenChange = vi.fn();
  const vehicleId = faker.string.uuid();
  const defaultProps = {
    open: true,
    onOpenChange,
    vehicleId,
    vehiclePlaca: "ABC-123",
    vehicleConductor: "Juan Pérez",
  };
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouteGenerationModal {...defaultProps} {...props} />
    </QueryClientProvider>
  );
  return { onOpenChange, queryClient, vehicleId, ...utils };
};

describe("RouteGenerationModal - Integration", () => {
  const mockedToast = vi.mocked(toast);

  beforeEach(() => {
    faker.seed(904);
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
      expect(
        screen.getByRole("button", { name: /generar/i })
      ).toBeInTheDocument();
    });
  });

  it("optimiza ruta end-to-end y muestra visualización", async () => {
    const apiUrl = "http://localhost:4022";
    vi.stubEnv("VITE_API_URL", apiUrl);

    const vehicleId = faker.string.uuid();
    const routeId = faker.string.uuid();
    const clientId1 = faker.string.uuid();
    const clientId2 = faker.string.uuid();

    // Mock GET /rutas to return pending route
    server.use(
      http.get(`${apiUrl}/rutas`, () => {
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

    // Mock POST /rutas/{id}/optimize to return optimized route
    server.use(
      http.post(`${apiUrl}/rutas/${routeId}/optimize`, () => {
        return HttpResponse.json({
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
        });
      })
    );

    const user = userEvent.setup();
    renderModal({ vehicleId });

    // Wait for routes to load
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generar/i })
      ).toBeInTheDocument();
    });

    // Click generate button
    await user.click(screen.getByRole("button", { name: /generar/i }));

    // Wait for optimization to complete and visualization to appear
    await waitFor(
      () => {
        expect(mockedToast.success).toHaveBeenCalledWith(
          "Ruta optimizada exitosamente"
        );
        expect(screen.getByText(/Distancia total:/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify all metrics are displayed
    expect(screen.getByText(/18.45 km/)).toBeInTheDocument();
    expect(screen.getByText(/Tiempo estimado:/)).toBeInTheDocument();
    expect(screen.getByText(/28 min/)).toBeInTheDocument(); // 0.46 * 60 = 27.6 ~ 28
    expect(screen.getByText(/Paradas:/)).toBeInTheDocument();

    // Verify SVG map is rendered
    const svgs = document.querySelectorAll("svg");
    const routeSvg = Array.from(svgs).find(
      (svg) => svg.getAttribute("viewBox") === "0 0 500 300"
    );
    expect(routeSvg).toBeTruthy();
  });

  it("maneja error de backend correctamente", async () => {
    const apiUrl = "http://localhost:4022";
    vi.stubEnv("VITE_API_URL", apiUrl);

    const vehicleId = faker.string.uuid();
    const routeId = faker.string.uuid();
    const errorDetail = "Route has no stops to optimize";

    server.use(
      http.get(`${apiUrl}/rutas`, () => {
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
      }),
      http.post(`${apiUrl}/rutas/${routeId}/optimize`, () => {
        return HttpResponse.json({ detail: errorDetail }, { status: 400 });
      })
    );

    const user = userEvent.setup();
    renderModal({ vehicleId });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generar/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /generar/i }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(errorDetail);
    });

    // Verify visualization is not shown
    expect(screen.queryByText(/Distancia total:/)).not.toBeInTheDocument();
  });

  it("maneja rutas sin coordenadas correctamente", async () => {
    const apiUrl = "http://localhost:4022";
    vi.stubEnv("VITE_API_URL", apiUrl);

    const vehicleId = faker.string.uuid();
    const routeId = faker.string.uuid();

    server.use(
      http.get(`${apiUrl}/rutas`, () => {
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
      }),
      http.post(`${apiUrl}/rutas/${routeId}/optimize`, () => {
        return HttpResponse.json({
          id: routeId,
          vehicleId,
          date: "2025-10-23",
          totalDistanceKm: 0,
          estimatedTimeH: 0,
          priorityLevel: "normal",
          status: "pending",
          createdAt: faker.date.past().toISOString(),
          updatedAt: faker.date.past().toISOString(),
          stops: [
            {
              id: faker.string.uuid(),
              routeId,
              clientId: faker.string.uuid(),
              sequence: 1,
              estimatedArrival: null,
              delivered: false,
              latitude: null,
              longitude: null,
              address: "Sin dirección",
              createdAt: faker.date.past().toISOString(),
              updatedAt: faker.date.past().toISOString(),
            },
          ],
        });
      })
    );

    const user = userEvent.setup();
    renderModal({ vehicleId });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generar/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /generar/i }));

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalled();
    });

    // Should show message about missing coordinates
    await waitFor(() => {
      expect(
        screen.getByText("Las paradas no tienen coordenadas")
      ).toBeInTheDocument();
    });
  });

  it("solo carga rutas cuando el modal está abierto", async () => {
    const apiUrl = "http://localhost:4022";
    vi.stubEnv("VITE_API_URL", apiUrl);

    const vehicleId = faker.string.uuid();
    let requestCount = 0;

    server.use(
      http.get(`${apiUrl}/rutas`, () => {
        requestCount++;
        return HttpResponse.json({ data: [] });
      })
    );

    // Render with modal closed
    const { rerender } = renderModal({ vehicleId, open: false });

    // Wait a bit to ensure no request is made
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(requestCount).toBe(0);

    // Re-render with modal open
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        <RouteGenerationModal
          open={true}
          onOpenChange={vi.fn()}
          vehicleId={vehicleId}
          vehiclePlaca="ABC-123"
          vehicleConductor="Juan Pérez"
        />
      </QueryClientProvider>
    );

    // Now request should be made
    await waitFor(() => {
      expect(requestCount).toBe(1);
    });
  });
});
