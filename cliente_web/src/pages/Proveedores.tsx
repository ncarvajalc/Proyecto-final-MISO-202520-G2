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
import { getProveedores } from "@/services/proveedores.service";
import { Paperclip, Plus } from "lucide-react";
import { CreateProveedorForm } from "@/components/proveedor/CreateProveedorForm";
import { BulkUploadProveedoresForm } from "@/components/proveedor/BulkUploadProveedoresForm";

const ITEMS_PER_PAGE = 5;

export default function Proveedores() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);

  // Fetch proveedores using TanStack Query with server-side pagination
  const { data, isLoading, isError } = useQuery({
    queryKey: ["proveedores", currentPage, ITEMS_PER_PAGE],
    queryFn: () => getProveedores({ page: currentPage, limit: ITEMS_PER_PAGE }),
  });

  const totalPages = data?.totalPages || 0;

  // Button handlers
  const handleNuevoProveedor = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCargaMasiva = () => {
    setIsBulkUploadDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando proveedores...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error al cargar los proveedores</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 items-center justify-center">
        <Typography1 className="mb-0">Proveedores</Typography1>

        <div className="flex gap-3">
          <Button onClick={handleNuevoProveedor}>
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Button>
          <Button onClick={handleCargaMasiva} variant="darker">
            <Paperclip className="h-4 w-4" />
            Carga masiva
          </Button>
        </div>
      </div>

      {/* Table */}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Id Tax</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!data?.data || data.data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground"
              >
                No hay proveedores disponibles
              </TableCell>
            </TableRow>
          ) : (
            data.data.map((proveedor) => (
              <TableRow key={proveedor.id}>
                <TableCell className="font-medium">
                  {proveedor.nombre}
                </TableCell>
                <TableCell>{proveedor.id_tax}</TableCell>
                <TableCell>{proveedor.direccion}</TableCell>
                <TableCell>{proveedor.telefono}</TableCell>
                <TableCell>{proveedor.correo}</TableCell>
                <TableCell>{proveedor.contacto}</TableCell>
                <TableCell>{proveedor.estado}</TableCell>
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
