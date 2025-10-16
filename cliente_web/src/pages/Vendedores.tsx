import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { getVendedores, getVendedor } from "@/services/vendedores.service";
import { Plus, FileText, Loader2 } from "lucide-react";
import { CreateVendedorForm } from "@/components/vendedor/CreateVendedorForm";
import { AsignacionesModal } from "@/components/vendedor/AsignacionesModal";
import type { Vendedor } from "@/types/vendedor";

const ITEMS_PER_PAGE = 5;

export default function Vendedores() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAsignacionesModalOpen, setIsAsignacionesModalOpen] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(
    null
  );
  const [loadingVendedorId, setLoadingVendedorId] = useState<string | null>(
    null
  );

  // Fetch vendedores using TanStack Query with server-side pagination
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendedores", currentPage, ITEMS_PER_PAGE],
    queryFn: () => getVendedores({ page: currentPage, limit: ITEMS_PER_PAGE }),
  });

  const totalPages = data?.totalPages || 0;

  // Button handlers
  const handleNuevoVendedor = () => {
    setIsCreateDialogOpen(true);
  };

  const handleOpenAsignaciones = async (vendedor: Vendedor) => {
    try {
      setLoadingVendedorId(vendedor.id);
      // Fetch the detailed vendedor information with sales plan
      const detailedVendedor = await getVendedor(vendedor.id);
      setSelectedVendedor(detailedVendedor);
      setIsAsignacionesModalOpen(true);
    } catch (error) {
      console.error("Error fetching vendedor details:", error);
      toast.error("No se pudo cargar la información del vendedor");
    } finally {
      setLoadingVendedorId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando vendedores...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error al cargar los vendedores</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 items-center justify-center">
        <Typography1 className="mb-0">Vendedores</Typography1>

        <div className="flex gap-3">
          <Button onClick={handleNuevoVendedor}>
            <Plus className="h-4 w-4" />
            Nuevo vendedor
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead className="text-center">Plan de venta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!data?.data || data.data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No hay vendedores disponibles
              </TableCell>
            </TableRow>
          ) : (
            data.data.map((vendedor) => (
              <TableRow key={vendedor.id}>
                <TableCell className="font-medium">{vendedor.id}</TableCell>
                <TableCell>{vendedor.nombre}</TableCell>
                <TableCell>{vendedor.correo}</TableCell>

                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenAsignaciones(vendedor)}
                    className="h-8 w-8 p-0"
                    disabled={loadingVendedorId === vendedor.id}
                  >
                    {loadingVendedorId === vendedor.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span className="sr-only">Ver asignaciones</span>
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

      {/* Create Vendedor Dialog */}
      <CreateVendedorForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Asignaciones Modal */}
      <AsignacionesModal
        open={isAsignacionesModalOpen}
        onOpenChange={setIsAsignacionesModalOpen}
        vendedor={selectedVendedor}
      />
    </div>
  );
}
