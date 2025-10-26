import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { getVehiculos } from "@/services/logistica.service";
import { RouteGenerationModal } from "@/components/logistica/RouteGenerationModal";
import { MapPin } from "lucide-react";
import { PageHeader, PageStateMessage } from "@/components/common/PageLayout";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";
import {
  PaginatedTable,
  PaginationControls,
} from "@/components/common/PaginatedTable";

const ITEMS_PER_PAGE = 5;

interface SelectedVehicle {
  id: string;
  placa: string;
  conductor: string;
}

export default function Logistica() {
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<SelectedVehicle | null>(null);

  const {
    data,
    isLoading,
    isError,
    currentPage,
    setCurrentPage,
    totalPages,
  } = usePaginatedResource("vehiculos", getVehiculos, ITEMS_PER_PAGE);

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
    return <PageStateMessage message="Cargando vehículos..." />;
  }

  if (isError) {
    return (
      <PageStateMessage
        message="Error al cargar los vehículos"
        variant="error"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Gestión Logística" />

      <PaginatedTable
        columns={[
          { key: "vehiculo", header: "Vehículo" },
          { key: "conductor", header: "Conductor" },
          { key: "entregas", header: "N° Entregas" },
          { key: "acciones", header: "", className: "w-[100px]" },
        ]}
        data={data?.data}
        emptyMessage="No hay vehículos disponibles"
        renderRow={(vehiculo) => (
          <TableRow key={vehiculo.id}>
            <TableCell className="font-medium">{vehiculo.placa}</TableCell>
            <TableCell>{vehiculo.conductor}</TableCell>
            <TableCell>{vehiculo.numeroEntregas}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleVerRuta(vehiculo.id, vehiculo.placa, vehiculo.conductor)
                }
                className="h-8 w-8 p-0"
              >
                <MapPin className="h-4 w-4" />
                <span className="sr-only">Ver ruta</span>
              </Button>
            </TableCell>
          </TableRow>
        )}
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

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
