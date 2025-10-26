import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { getInformesComerciales } from "@/services/informesComerciales.service";
import { Plus } from "lucide-react";
import { CreateInformeComercialForm } from "@/components/informeComercial/CreateInformeComercialForm";
import { PageHeader, PageStateMessage } from "@/components/common/PageLayout";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";
import {
  PaginatedTable,
  PaginationControls,
} from "@/components/common/PaginatedTable";

const ITEMS_PER_PAGE = 5;

export default function InformesComerciales() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    currentPage,
    setCurrentPage,
    totalPages,
  } = usePaginatedResource(
    "informesComerciales",
    getInformesComerciales,
    ITEMS_PER_PAGE
  );

  // Button handlers
  const handleCrearInforme = () => {
    setIsCreateDialogOpen(true);
  };

  // Format date to local format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (isLoading) {
    return <PageStateMessage message="Cargando informes comerciales..." />;
  }

  if (isError) {
    return (
      <PageStateMessage
        message="Error al cargar los informes comerciales"
        variant="error"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Informes Comerciales"
        actions={
          <Button onClick={handleCrearInforme}>
            <Plus className="h-4 w-4" />
            Crear Informe Comercial
          </Button>
        }
      />

      <PaginatedTable
        columns={[
          { key: "id", header: "ID" },
          { key: "nombre", header: "Nombre" },
          { key: "fecha", header: "Fecha" },
        ]}
        data={data?.data}
        emptyMessage="No hay informes comerciales disponibles"
        renderRow={(informe) => (
          <TableRow key={informe.id}>
            <TableCell className="font-medium">{informe.id}</TableCell>
            <TableCell>{informe.nombre}</TableCell>
            <TableCell>{formatDate(informe.fecha)}</TableCell>
          </TableRow>
        )}
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Create Informe Comercial Dialog */}
      <CreateInformeComercialForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
