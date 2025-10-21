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
import { getInformesComerciales } from "@/services/informesComerciales.service";
import { Plus } from "lucide-react";
import { CreateInformeComercialForm } from "@/components/informeComercial/CreateInformeComercialForm";

const ITEMS_PER_PAGE = 5;

export default function InformesComerciales() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch informes comerciales using TanStack Query with server-side pagination
  const { data, isLoading, isError } = useQuery({
    queryKey: ["informesComerciales", currentPage, ITEMS_PER_PAGE],
    queryFn: () =>
      getInformesComerciales({ page: currentPage, limit: ITEMS_PER_PAGE }),
  });

  const totalPages = data?.totalPages || 0;

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
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Cargando informes comerciales...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">
          Error al cargar los informes comerciales
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 items-center justify-center">
        <Typography1 className="mb-0">Informes Comerciales</Typography1>

        <div className="flex gap-3">
          <Button onClick={handleCrearInforme}>
            <Plus className="h-4 w-4" />
            Crear Informe Comercial
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!data?.data || data.data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground"
              >
                No hay informes comerciales disponibles
              </TableCell>
            </TableRow>
          ) : (
            data.data.map((informe) => (
              <TableRow key={informe.id}>
                <TableCell className="font-medium">{informe.id}</TableCell>
                <TableCell>{informe.nombre}</TableCell>
                <TableCell>{formatDate(informe.fecha)}</TableCell>
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

      {/* Create Informe Comercial Dialog */}
      <CreateInformeComercialForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
