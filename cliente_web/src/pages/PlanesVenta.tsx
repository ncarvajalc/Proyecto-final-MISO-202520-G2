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
import { getPlanesVenta } from "@/services/planesVenta.service";
import { Plus } from "lucide-react";
import { CreatePlanVentaForm } from "@/components/planVenta/CreatePlanVentaForm";

const ITEMS_PER_PAGE = 5;

export default function PlanesVenta() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch planes de venta using TanStack Query with server-side pagination
  const { data, isLoading, isError } = useQuery({
    queryKey: ["planesVenta", currentPage, ITEMS_PER_PAGE],
    queryFn: () => getPlanesVenta({ page: currentPage, limit: ITEMS_PER_PAGE }),
  });

  const totalPages = data?.totalPages || 0;

  // Button handlers
  const handleNuevoPlan = () => {
    setIsCreateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando planes de venta...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error al cargar los planes de venta</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 items-center justify-center">
        <Typography1 className="mb-0">Planes de Venta</Typography1>

        <div className="flex gap-3">
          <Button onClick={handleNuevoPlan}>
            <Plus className="h-4 w-4" />
            Nuevo Plan de Venta
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Periodo</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Meta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!data?.data || data.data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No hay planes de venta disponibles
              </TableCell>
            </TableRow>
          ) : (
            data.data.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  {plan.identificador}
                </TableCell>
                <TableCell>{plan.nombre}</TableCell>
                <TableCell>{plan.periodo}</TableCell>
                <TableCell>{plan.vendedorNombre || plan.vendedorId}</TableCell>
                <TableCell>{plan.meta}</TableCell>
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

      {/* Create Plan de Venta Dialog */}
      <CreatePlanVentaForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
