import { useState, useMemo } from "react";
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

const ITEMS_PER_PAGE = 5;

export default function Proveedores() {
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch proveedores using TanStack Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ["proveedores"],
    queryFn: getProveedores,
  });

  // Client-side pagination
  const paginatedData = useMemo(() => {
    if (!data?.data) return [];

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return data.data.slice(startIndex, endIndex);
  }, [data, currentPage]);

  const totalPages = Math.ceil((data?.total || 0) / ITEMS_PER_PAGE);

  // Button handlers (to be implemented later)
  const handleNuevoProveedor = () => {
    console.log("Nuevo proveedor clicked");
    // TODO: Implement create proveedor functionality
  };

  const handleCargaMasiva = () => {
    console.log("Carga masiva clicked");
    // TODO: Implement bulk upload functionality
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
      <div className="rounded-lg border">
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
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No hay proveedores disponibles
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((proveedor) => (
                <TableRow key={proveedor.id}>
                  <TableCell className="font-medium">
                    {proveedor.nombre}
                  </TableCell>
                  <TableCell>{proveedor.idTax}</TableCell>
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
      </div>

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
    </div>
  );
}
