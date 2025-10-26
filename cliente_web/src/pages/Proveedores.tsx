import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { getProveedores } from "@/services/proveedores.service";
import { Paperclip, Plus } from "lucide-react";
import { CreateProveedorForm } from "@/components/proveedor/CreateProveedorForm";
import { BulkUploadProveedoresForm } from "@/components/proveedor/BulkUploadProveedoresForm";
import { PageHeader, PageStateMessage } from "@/components/common/PageLayout";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";
import {
  PaginatedTable,
  PaginationControls,
} from "@/components/common/PaginatedTable";

const ITEMS_PER_PAGE = 5;

export default function Proveedores() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    currentPage,
    setCurrentPage,
    totalPages,
  } = usePaginatedResource("proveedores", getProveedores, ITEMS_PER_PAGE);

  // Button handlers
  const handleNuevoProveedor = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCargaMasiva = () => {
    setIsBulkUploadDialogOpen(true);
  };

  if (isLoading) {
    return <PageStateMessage message="Cargando proveedores..." />;
  }

  if (isError) {
    return (
      <PageStateMessage
        message="Error al cargar los proveedores"
        variant="error"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Proveedores"
        actions={
          <>
            <Button onClick={handleNuevoProveedor}>
              <Plus className="h-4 w-4" />
              Nuevo proveedor
            </Button>
            <Button onClick={handleCargaMasiva} variant="darker">
              <Paperclip className="h-4 w-4" />
              Carga masiva
            </Button>
          </>
        }
      />

      <PaginatedTable
        columns={[
          { key: "nombre", header: "Nombre" },
          { key: "idTax", header: "Id Tax" },
          { key: "direccion", header: "Dirección" },
          { key: "telefono", header: "Teléfono" },
          { key: "correo", header: "Correo" },
          { key: "contacto", header: "Contacto" },
          { key: "estado", header: "Estado" },
        ]}
        data={data?.data}
        emptyMessage="No hay proveedores disponibles"
        renderRow={(proveedor) => (
          <TableRow key={proveedor.id}>
            <TableCell className="font-medium">{proveedor.nombre}</TableCell>
            <TableCell>{proveedor.id_tax}</TableCell>
            <TableCell>{proveedor.direccion}</TableCell>
            <TableCell>{proveedor.telefono}</TableCell>
            <TableCell>{proveedor.correo}</TableCell>
            <TableCell>{proveedor.contacto}</TableCell>
            <TableCell>{proveedor.estado || "Inactivo"}</TableCell>
          </TableRow>
        )}
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Create Proveedor Dialog */}
      <CreateProveedorForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Bulk Upload Proveedores Dialog */}
      <BulkUploadProveedoresForm
        open={isBulkUploadDialogOpen}
        onOpenChange={setIsBulkUploadDialogOpen}
      />
    </div>
  );
}
