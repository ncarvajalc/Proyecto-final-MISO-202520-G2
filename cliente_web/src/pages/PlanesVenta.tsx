import { TableCell, TableRow } from "@/components/ui/table";
import { getPlanesVenta } from "@/services/planesVenta.service";
import type { PlanVenta } from "@/types/planVenta";
import { Plus } from "lucide-react";
import { CreatePlanVentaForm } from "@/components/planVenta/CreatePlanVentaForm";
import { ResourcePageLayout } from "@/components/common/ResourcePageLayout";
import { ResourcePageActionButton } from "@/components/common/ResourcePageActionButton";
import { useDialogState } from "@/hooks/useDialogState";
import { useResourcePageData } from "@/hooks/useResourcePageData";

const PLANES_PAGINATION = { pageSize: 5 } as const;

const createPlanTable = (planes?: PlanVenta[]) => ({
  columns: [
    { key: "id", header: "ID" },
    { key: "nombre", header: "Nombre" },
    { key: "periodo", header: "Periodo" },
    { key: "vendedor", header: "Vendedor" },
    { key: "meta", header: "Meta" },
  ],
  data: planes,
  emptyMessage: "No hay planes de venta disponibles",
  renderRow: (plan: PlanVenta) => (
    <TableRow key={plan.id}>
      <TableCell className="font-medium">{plan.identificador}</TableCell>
      <TableCell>{plan.nombre}</TableCell>
      <TableCell>{plan.periodo}</TableCell>
      <TableCell>{plan.vendedorNombre || plan.vendedorId}</TableCell>
      <TableCell>{plan.meta}</TableCell>
    </TableRow>
  ),
});

export default function PlanesVenta() {
  const planPageData = useResourcePageData<PlanVenta>({
    resourceKey: "planesVenta",
    fetcher: getPlanesVenta,
    itemsPerPage: PLANES_PAGINATION.pageSize,
  });
  const planData = planPageData.data;
  const planLayoutConfig = planPageData.layoutConfig;
  const {
    isOpen: isCreateDialogOpen,
    setIsOpen: setIsCreateDialogOpen,
    openDialog: openCreateDialog,
  } = useDialogState();

  // Button handlers
  const handleNuevoPlan = () => {
    openCreateDialog();
  };

  const layoutProps = {
    title: "Planes de Venta",
    actions: (
      <ResourcePageActionButton
        onClick={handleNuevoPlan}
        icon={<Plus className="h-4 w-4" />}
      >
        Nuevo Plan de Venta
      </ResourcePageActionButton>
    ),
    loadingMessage: "Cargando planes de venta...",
    errorMessage: "Error al cargar los planes de venta",
    state: planLayoutConfig.state,
    table: createPlanTable(planData?.data),
    pagination: planLayoutConfig.pagination,
  } as const;

  return (
    <ResourcePageLayout<PlanVenta> {...layoutProps}>
      <CreatePlanVentaForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </ResourcePageLayout>
  );
}
