import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { getVendedores, getVendedor } from "@/services/vendedores.service";
import { Plus, FileText, Loader2 } from "lucide-react";
import { CreateVendedorForm } from "@/components/vendedor/CreateVendedorForm";
import { AsignacionesModal } from "@/components/vendedor/AsignacionesModal";
import type { Vendedor } from "@/types/vendedor";
import { PageHeader, PageStateMessage } from "@/components/common/PageLayout";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";
import {
  PaginatedTable,
  PaginationControls,
} from "@/components/common/PaginatedTable";

const ITEMS_PER_PAGE = 5;

export default function Vendedores() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAsignacionesModalOpen, setIsAsignacionesModalOpen] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(
    null
  );
  const [loadingVendedorId, setLoadingVendedorId] = useState<string | null>(
    null
  );

  const {
    data,
    isLoading,
    isError,
    currentPage,
    setCurrentPage,
    totalPages,
  } = usePaginatedResource("vendedores", getVendedores, ITEMS_PER_PAGE);

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
    return <PageStateMessage message="Cargando vendedores..." />;
  }

  if (isError) {
    return (
      <PageStateMessage
        message="Error al cargar los vendedores"
        variant="error"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Vendedores"
        actions={
          <Button onClick={handleNuevoVendedor}>
            <Plus className="h-4 w-4" />
            Nuevo vendedor
          </Button>
        }
      />

      <PaginatedTable
        columns={[
          { key: "id", header: "ID" },
          { key: "nombre", header: "Nombre" },
          { key: "correo", header: "Correo" },
          { key: "plan", header: "Plan de venta", className: "text-center" },
        ]}
        data={data?.data}
        emptyMessage="No hay vendedores disponibles"
        renderRow={(vendedor) => (
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
        )}
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

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
