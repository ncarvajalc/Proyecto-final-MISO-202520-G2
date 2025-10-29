import { TableCell, TableRow } from "@/components/ui/table";
import { getInformesComerciales } from "@/services/informesComerciales.service";
import type { InformeComercial } from "@/types/informeComercial";
import { Plus } from "lucide-react";
import { CreateInformeComercialForm } from "@/components/informeComercial/CreateInformeComercialForm";
import { ResourcePageLayout } from "@/components/common/ResourcePageLayout";
import { ResourcePageActionButton } from "@/components/common/ResourcePageActionButton";
import { useResourcePageData } from "@/hooks/useResourcePageData";
import { useDialogState } from "@/hooks/useDialogState";

const ITEMS_PER_PAGE = 5;

export default function InformesComerciales() {
  const {
    isOpen: isCreateDialogOpen,
    setIsOpen: setIsCreateDialogOpen,
    openDialog: openCreateDialog,
  } = useDialogState();

  const { data, layoutConfig } = useResourcePageData<InformeComercial>({
    resourceKey: "informesComerciales",
    fetcher: getInformesComerciales,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Button handlers
  const handleCrearInforme = () => {
    openCreateDialog();
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

  const layoutProps = {
    title: "Informes Comerciales",
    actions: (
      <ResourcePageActionButton
        onClick={handleCrearInforme}
        icon={<Plus className="h-4 w-4" />}
      >
        Crear Informe Comercial
      </ResourcePageActionButton>
    ),
    loadingMessage: "Cargando informes comerciales...",
    errorMessage: "Error al cargar los informes comerciales",
    state: layoutConfig.state,
    table: {
      columns: [
        { key: "id", header: "ID" },
        { key: "nombre", header: "Nombre" },
        { key: "fecha", header: "Fecha" },
      ],
      data: data?.data,
      emptyMessage: "No hay informes comerciales disponibles",
      renderRow: (informe: InformeComercial) => (
        <TableRow key={informe.id}>
          <TableCell className="font-medium">{informe.id}</TableCell>
          <TableCell>{informe.nombre}</TableCell>
          <TableCell>{formatDate(informe.fecha)}</TableCell>
        </TableRow>
      ),
    },
    pagination: layoutConfig.pagination,
  };

  return (
    <ResourcePageLayout<InformeComercial> {...layoutProps}>
      <CreateInformeComercialForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </ResourcePageLayout>
  );
}
