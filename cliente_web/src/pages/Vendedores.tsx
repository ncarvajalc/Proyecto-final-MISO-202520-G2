import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { getVendedores, getVendedor } from "@/services/vendedores.service";
import { Plus, FileText, Loader2 } from "lucide-react";
import { CreateVendedorForm } from "@/components/vendedor/CreateVendedorForm";
import { AsignacionesModal } from "@/components/vendedor/AsignacionesModal";
import type { Vendedor } from "@/types/vendedor";
import { ResourcePageLayout } from "@/components/common/ResourcePageLayout";
import { ResourcePageActionButton } from "@/components/common/ResourcePageActionButton";
import { useResourcePageData } from "@/hooks/useResourcePageData";
import { useDialogState } from "@/hooks/useDialogState";

const VENDEDORES_ITEMS_PER_PAGE = 5;

export default function Vendedores() {
  const {
    isOpen: isCreateDialogOpen,
    setIsOpen: setIsCreateDialogOpen,
    openDialog: openCreateDialog,
  } = useDialogState();
  const [isAsignacionesModalOpen, setIsAsignacionesModalOpen] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(
    null
  );
  const [loadingVendedorId, setLoadingVendedorId] = useState<string | null>(
    null
  );

  const vendedoresPage = useResourcePageData<Vendedor>({
    resourceKey: "vendedores",
    fetcher: getVendedores,
    itemsPerPage: VENDEDORES_ITEMS_PER_PAGE,
  });
  const { data, layoutConfig } = vendedoresPage;

  // Button handlers
  const handleNuevoVendedor = () => {
    openCreateDialog();
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

  const layoutProps = {
    title: "Vendedores",
    actions: (
      <ResourcePageActionButton
        onClick={handleNuevoVendedor}
        icon={<Plus className="h-4 w-4" />}
      >
        Nuevo vendedor
      </ResourcePageActionButton>
    ),
    loadingMessage: "Cargando vendedores...",
    errorMessage: "Error al cargar los vendedores",
    state: layoutConfig.state,
    table: buildVendedorTable({
      data: data?.data,
      onViewAssignments: handleOpenAsignaciones,
      loadingId: loadingVendedorId,
    }),
    pagination: layoutConfig.pagination,
  };

  return (
    <ResourcePageLayout<Vendedor> {...layoutProps}>
      <CreateVendedorForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <AsignacionesModal
        open={isAsignacionesModalOpen}
        onOpenChange={setIsAsignacionesModalOpen}
        vendedor={selectedVendedor}
      />
    </ResourcePageLayout>
  );
}

interface VendedorTableConfig {
  data?: Vendedor[];
  onViewAssignments: (vendedor: Vendedor) => void;
  loadingId: string | null;
}

function buildVendedorTable({
  data,
  onViewAssignments,
  loadingId,
}: VendedorTableConfig) {
  return {
    columns: [
      { key: "id", header: "ID", className: "w-[280px]" },
      { key: "nombre", header: "Nombre" },
      { key: "correo", header: "Correo" },
      { key: "acciones", header: "Acciones", className: "w-[140px]" },
    ],
    data,
    emptyMessage: "No hay vendedores registrados",
    renderRow: (vendedor: Vendedor) => (
      <TableRow key={vendedor.id}>
        <TableCell className="font-mono text-xs">{vendedor.id}</TableCell>
        <TableCell className="font-medium">{vendedor.nombre}</TableCell>
        <TableCell>{vendedor.correo}</TableCell>
        <TableCell>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => onViewAssignments(vendedor)}
            disabled={loadingId === vendedor.id}
          >
            {loadingId === vendedor.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Ver asignaciones
          </Button>
        </TableCell>
      </TableRow>
    ),
  };
}
