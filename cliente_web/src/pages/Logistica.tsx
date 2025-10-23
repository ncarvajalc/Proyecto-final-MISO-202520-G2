import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Typography1 } from "@/components/ui/typography1";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { getVehiculos } from "@/services/logistica.service";
import { RouteGenerationModal } from "@/components/logistica/RouteGenerationModal";
import { ProductWarehouseLocator } from "@/components/logistica/ProductWarehouseLocator";
import { ProductAvailabilityLookup } from "@/components/logistica/ProductAvailabilityLookup";
import { MapPin } from "lucide-react";

const ITEMS_PER_PAGE = 5;

interface SelectedVehicle {
  id: string;
  placa: string;
  conductor: string;
}

export default function Logistica() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<SelectedVehicle | null>(null);

  // Fetch vehículos using TanStack Query with server-side pagination
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vehiculos", currentPage, ITEMS_PER_PAGE],
    queryFn: () => getVehiculos({ page: currentPage, limit: ITEMS_PER_PAGE }),
  });

  const totalPages = data?.totalPages || 0;

  // Button handler
  const handleVerRuta = (
    vehiculoId: string,
    placa: string,
    conductor: string
  ) => {
    setSelectedVehicle({ id: vehiculoId, placa, conductor });
    setIsRouteModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando vehículos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error al cargar los vehículos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 items-center justify-center">
        <Typography1 className="mb-0">Gestión Logística</Typography1>
      </div>

      {/* Inventory lookup cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProductWarehouseLocator />
        <ProductAvailabilityLookup />
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehículo</TableHead>
            <TableHead>Conductor</TableHead>
            <TableHead>N° Entregas</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!data?.data || data.data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No hay vehículos disponibles
              </TableCell>
            </TableRow>
          ) : (
            data.data.map((vehiculo) => (
              <TableRow key={vehiculo.id}>
                <TableCell className="font-medium">{vehiculo.placa}</TableCell>
                <TableCell>{vehiculo.conductor}</TableCell>
                <TableCell>{vehiculo.numeroEntregas}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleVerRuta(
                        vehiculo.id,
                        vehiculo.placa,
                        vehiculo.conductor
                      )
                    }
                    className="h-8 w-8 p-0"
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="sr-only">Ver ruta</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Route Generation Modal */}
      {selectedVehicle && (
        <RouteGenerationModal
          open={isRouteModalOpen}
          onOpenChange={setIsRouteModalOpen}
          vehicleId={selectedVehicle.id}
          vehiclePlaca={selectedVehicle.placa}
          vehicleConductor={selectedVehicle.conductor}
        />
      )}
    </div>
  );
}
