import { useMemo } from "react";
import { getProductLocation } from "@/services/warehouse.service";
import type { ProductLocation } from "@/types/warehouse";
import { toast } from "sonner";
import { useWarehouseProductSearch } from "@/hooks/useWarehouseProductSearch";
import { WarehouseDialogLayout } from "./WarehouseDialogLayout";
import * as LocationDialog from "./dialogUtils";

type ProductLocationLayoutOptions = Parameters<
  typeof LocationDialog.useWarehouseDialogLayoutProps<ProductLocation>
>[0];

const useProductLocationDialogLayout = ({
  open,
  onOpenChange,
  steps,
  result,
  renderResult,
  actions,
}: Omit<ProductLocationLayoutOptions, "title" | "description">) =>
  LocationDialog.useWarehouseDialogLayoutProps({
    open,
    onOpenChange,
    title: "Disponibilidad en bodega",
    description: "Seleccione el producto que quiere consultar",
    steps,
    result,
    renderResult,
    actions,
  });

interface ProductLocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductLocationForm({
  open,
  onOpenChange,
}: ProductLocationFormProps) {
  const {
    selectedSku,
    setSelectedSku,
    productosData,
    isLoadingProductos,
    locationResult,
    setLocationResult,
    isLocating,
    setIsLocating,
    reset,
  } = useWarehouseProductSearch(open);
  const { handleDialogChange, handleCancel } = LocationDialog.useWarehouseDialogControls(
    reset,
    onOpenChange
  );
  const skuSelectionStep = LocationDialog.createSkuSelectionStep({
    value: selectedSku,
    onValueChange: setSelectedSku,
    isLoading: isLoadingProductos,
    options: productosData?.data,
  });
  const steps = [skuSelectionStep];

  const notifyProductNotFound = () =>
    toast.warning("Producto no localizado en ninguna bodega");
  const reportLocationError = (error: unknown) => {
    console.error("Error locating product:", error);
    toast.error("Error al consultar la ubicación del producto");
  };

  const handleLocalizar = async () => {
    if (!selectedSku) {
      toast.error("Por favor seleccione un producto");
      return;
    }
    await LocationDialog.runLocationRequest<ProductLocation>({
      locate: () => getProductLocation({
        sku: selectedSku,
      }),
      setIsLocating,
      setLocationResult,
      onFound: (result) =>
        toast.success(
          `Producto localizado en ${result.bodega}, zona ${result.zona}`
        ),
      onNotFound: notifyProductNotFound,
      onError: reportLocationError,
    });
  };

  const canLocalizar = !!selectedSku && !isLocating;
  const locationDialogActionConfig = useMemo(
    () => ({
      onCancel: handleCancel,
      onConfirm: handleLocalizar,
      canConfirm: canLocalizar,
      isLoading: isLocating,
      labels: {
        confirm: "Consultar",
        loading: "Consultando...",
      },
    }),
    [canLocalizar, handleCancel, handleLocalizar, isLocating]
  );
  const productLocationDialogLayoutProps = useProductLocationDialogLayout({
    open,
    onOpenChange: handleDialogChange,
    steps,
    result: locationResult,
    renderResult: LocationDialog.renderAvailabilityResult,
    actions: locationDialogActionConfig,
  });

  return <WarehouseDialogLayout {...productLocationDialogLayoutProps} />;
}
