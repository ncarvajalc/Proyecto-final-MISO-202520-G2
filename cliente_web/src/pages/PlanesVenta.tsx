import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { getPlanesVenta } from "@/services/planesVenta.service";
import { Plus } from "lucide-react";
import { CreatePlanVentaForm } from "@/components/planVenta/CreatePlanVentaForm";
import { PageHeader, PageStateMessage } from "@/components/common/PageLayout";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";
import {
  PaginatedTable,
  PaginationControls,
} from "@/components/common/PaginatedTable";

const ITEMS_PER_PAGE = 5;

export default function PlanesVenta() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    currentPage,
    setCurrentPage,
    totalPages,
  } = usePaginatedResource("planesVenta", getPlanesVenta, ITEMS_PER_PAGE);

  // Button handlers
  const handleNuevoPlan = () => {
    setIsCreateDialogOpen(true);
  };

  if (isLoading) {
    return <PageStateMessage message="Cargando planes de venta..." />;
  }

  if (isError) {
    return (
      <PageStateMessage
        message="Error al cargar los planes de venta"
        variant="error"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Planes de Venta"
        actions={
          <Button onClick={handleNuevoPlan}>
            <Plus className="h-4 w-4" />
            Nuevo Plan de Venta
          </Button>
        }
      />

      <PaginatedTable
        columns={[
          { key: "id", header: "ID" },
          { key: "nombre", header: "Nombre" },
          { key: "periodo", header: "Periodo" },
          { key: "vendedor", header: "Vendedor" },
          { key: "meta", header: "Meta" },
        ]}
        data={data?.data}
        emptyMessage="No hay planes de venta disponibles"
        renderRow={(plan) => (
          <TableRow key={plan.id}>
            <TableCell className="font-medium">{plan.identificador}</TableCell>
            <TableCell>{plan.nombre}</TableCell>
            <TableCell>{plan.periodo}</TableCell>
            <TableCell>{plan.vendedorNombre || plan.vendedorId}</TableCell>
            <TableCell>{plan.meta}</TableCell>
          </TableRow>
        )}
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Create Plan de Venta Dialog */}
      <CreatePlanVentaForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
