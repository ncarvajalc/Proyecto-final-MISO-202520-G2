import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getRoutesByVehicle,
  optimizeRoute,
  type Route,
} from "@/services/routes.service";
import { toast } from "sonner";

interface RouteGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehiclePlaca: string;
  vehicleConductor: string;
}

export function RouteGenerationModal({
  open,
  onOpenChange,
  vehicleId,
  vehiclePlaca,
}: RouteGenerationModalProps) {
  const [optimizedRoute, setOptimizedRoute] = useState<Route | null>(null);

  // Fetch routes for the vehicle
  const {
    data: routes,
    isLoading: isLoadingRoutes,
    error: routesError,
  } = useQuery({
    queryKey: ["routes", vehicleId],
    queryFn: () => getRoutesByVehicle(vehicleId),
    enabled: open, // Only fetch when modal is open
  });

  // Find the first pending route
  const pendingRoute = routes?.find((r) => r.status === "pending");

  // Optimize route mutation
  const optimizeMutation = useMutation({
    mutationFn: (routeId: string) => optimizeRoute(routeId),
    onSuccess: (data) => {
      setOptimizedRoute(data);
      toast.success("Ruta optimizada exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al optimizar la ruta");
    },
  });

  const handleGenerate = () => {
    if (!pendingRoute) {
      toast.error("No hay rutas pendientes para este vehículo");
      return;
    }
    optimizeMutation.mutate(pendingRoute.id);
  };

  const handleClose = () => {
    setOptimizedRoute(null);
    onOpenChange(false);
  };

  // Simple route visualization as connected points
  const renderRouteMap = (route: Route) => {
    if (!route.stops || route.stops.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No hay paradas en esta ruta
        </div>
      );
    }

    const stopsWithCoords = route.stops.filter(
      (stop) => stop.latitude !== null && stop.longitude !== null
    );

    if (stopsWithCoords.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          Las paradas no tienen coordenadas
        </div>
      );
    }

    // Calculate SVG viewBox to fit all points
    const lats = stopsWithCoords.map((s) => s.latitude!);
    const lons = stopsWithCoords.map((s) => s.longitude!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Add padding
    const padding = 0.01;
    const viewMinLon = minLon - padding;
    const viewMaxLon = maxLon + padding;
    const viewMinLat = minLat - padding;
    const viewMaxLat = maxLat + padding;

    const width = viewMaxLon - viewMinLon;
    const height = viewMaxLat - viewMinLat;

    // Map lat/lon to SVG coordinates (note: SVG Y axis is inverted)
    const toSvgX = (lon: number) => ((lon - viewMinLon) / width) * 500;
    const toSvgY = (lat: number) => ((viewMaxLat - lat) / height) * 300;

    // Create path string for the route
    const pathData = stopsWithCoords
      .map((stop, index) => {
        const x = toSvgX(stop.longitude!);
        const y = toSvgY(stop.latitude!);
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" ");

    return (
      <div className="border rounded-lg p-4 bg-slate-50">
        <svg
          viewBox="0 0 500 300"
          className="w-full h-[300px] bg-white rounded border"
        >
          {/* Route path */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Stop markers */}
          {stopsWithCoords.map((stop, index) => {
            const x = toSvgX(stop.longitude!);
            const y = toSvgY(stop.latitude!);
            const isFirst = index === 0;
            const isLast = index === stopsWithCoords.length - 1;

            return (
              <g key={stop.id}>
                {/* Circle marker */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={isFirst ? "#10b981" : isLast ? "#ef4444" : "#3b82f6"}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Sequence number */}
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {stop.sequence}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Route summary */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Distancia total:</span>{" "}
            {route.totalDistanceKm.toFixed(2)} km
          </div>
          <div>
            <span className="font-semibold">Tiempo estimado:</span>{" "}
            {(route.estimatedTimeH * 60).toFixed(0)} min
          </div>
          <div>
            <span className="font-semibold">Paradas:</span> {route.stops.length}
          </div>
          <div>
            <span className="font-semibold">Prioridad:</span>{" "}
            <span className="capitalize">{route.priorityLevel}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Generación de Ruta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle info */}
          <div className="text-sm text-muted-foreground">
            <p>
              <span className="font-semibold">Vehículo:</span> {vehiclePlaca}
            </p>
          </div>

          {/* Loading state */}
          {isLoadingRoutes && (
            <div className="text-center py-8 text-muted-foreground">
              Cargando rutas...
            </div>
          )}

          {/* Error state */}
          {routesError && (
            <div className="text-center py-8 text-destructive">
              Error al cargar las rutas
            </div>
          )}

          {/* No routes */}
          {!isLoadingRoutes &&
            !routesError &&
            !pendingRoute &&
            !optimizedRoute && (
              <div className="text-center py-8 text-muted-foreground">
                No hay rutas pendientes para este vehículo
              </div>
            )}

          {/* Generate button */}
          {!optimizedRoute && pendingRoute && (
            <div className="flex justify-center py-4">
              <Button
                onClick={handleGenerate}
                disabled={optimizeMutation.isPending}
                size="lg"
              >
                {optimizeMutation.isPending ? "Generando..." : "Generar"}
              </Button>
            </div>
          )}

          {/* Optimized route visualization */}
          {optimizedRoute && renderRouteMap(optimizedRoute)}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Volver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
