import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { getVehiculos } from "@/services/logistica.service";
import type { Vehiculo } from "@/types/logistica";
import { RouteGenerationModal } from "@/components/logistica/RouteGenerationModal";
import { MapPin } from "lucide-react";
import { ResourcePageLayout } from "@/components/common/ResourcePageLayout";
import { useResourcePageData } from "@/hooks/useResourcePageData";

const ITEMS_PER_PAGE = 5;

interface SelectedVehicle {
  id: string;
  placa: string;
  conductor: string;
}

export default function Logistica() {
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<SelectedVehicle | null>(null);

  const { data, layoutConfig } = useResourcePageData<Vehiculo>({
    resourceKey: "vehiculos",
    fetcher: getVehiculos,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Button handler
  const handleVerRuta = (
    vehiculoId: string,
    placa: string,
    conductor: string
  ) => {
    setSelectedVehicle({ id: vehiculoId, placa, conductor });
    setIsRouteModalOpen(true);
  };

  const layoutProps = {
    title: "Gestión Logística",
    loadingMessage: "Cargando vehículos...",
    errorMessage: "Error al cargar los vehículos",
    state: layoutConfig.state,
    table: {
      columns: [
        { key: "vehiculo", header: "Vehículo" },
        { key: "conductor", header: "Conductor" },
        { key: "entregas", header: "N° Entregas" },
        { key: "acciones", header: "", className: "w-[100px]" },
      ],
      data: data?.data,
      emptyMessage: "No hay vehículos disponibles",
      renderRow: (vehiculo: Vehiculo) => (
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
      ),
    },
    pagination: layoutConfig.pagination,
  };

  return (
    <ResourcePageLayout<Vehiculo> {...layoutProps}>
      {selectedVehicle && (
        <RouteGenerationModal
          open={isRouteModalOpen}
          onOpenChange={setIsRouteModalOpen}
          vehicleId={selectedVehicle.id}
          vehiclePlaca={selectedVehicle.placa}
          vehicleConductor={selectedVehicle.conductor}
        />
      )}
    </ResourcePageLayout>
  );
}
