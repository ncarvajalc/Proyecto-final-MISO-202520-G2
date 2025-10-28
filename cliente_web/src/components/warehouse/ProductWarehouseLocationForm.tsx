import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  getBodegas,
  getProductLocationInWarehouse,
} from "@/services/warehouse.service";
import type { ProductWarehouseLocation } from "@/types/warehouse";
import { toast } from "sonner";
import { useWarehouseProductSearch } from "@/hooks/useWarehouseProductSearch";
import { WarehouseDialogLayout } from "./WarehouseDialogLayout";
import * as WarehouseDialog from "./dialogUtils";

interface ProductWarehouseLocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductWarehouseLocationForm({
  open,
  onOpenChange,
}: ProductWarehouseLocationFormProps) {
  const productSearch = useWarehouseProductSearch(open);
  const [selectedBodega, setSelectedBodega] = useState<string>("");

  // Fetch all warehouses
  const { data: bodegasData, isLoading: isLoadingBodegas } = useQuery({
    queryKey: ["bodegas"],
    queryFn: getBodegas,
    enabled: open,
  });

  const handleLocalizar = async () => {
    if (!productSearch.selectedSku || !selectedBodega) {
      toast.error("Por favor seleccione un producto y una bodega");
      return;
    }
    await WarehouseDialog.runLocationRequest<ProductWarehouseLocation>({
      locate: () =>
        getProductLocationInWarehouse({
          sku: productSearch.selectedSku,
          bodegaId: selectedBodega,
        }),
      setIsLocating: productSearch.setIsLocating,
      setLocationResult: productSearch.setLocationResult as unknown as (
        value: ProductWarehouseLocation | null
      ) => void,
      onFound: (result) =>
        toast.success(`Producto localizado en zona ${result.zona}`),
      onNotFound: () =>
        toast.warning("Producto no localizado en esta bodega"),
      onError: (error) => {
        console.error("Error locating product:", error);
        toast.error("Error al consultar la ubicación del producto");
      },
    });
  };

  const resetState = () => {
    productSearch.reset();
    setSelectedBodega("");
  };
  const { handleDialogChange, handleCancel } = WarehouseDialog.useWarehouseDialogControls(
    resetState,
    onOpenChange
  );

  const steps = [
    WarehouseDialog.createSkuSelectionStep({
      value: productSearch.selectedSku,
      onValueChange: productSearch.setSelectedSku,
      isLoading: productSearch.isLoadingProductos,
      options: productSearch.productosData?.data,
    }),
    {
      title: "Seleccionar bodega",
      content: (
        <div className="space-y-2">
          <Label htmlFor="bodega">Bodega</Label>
          <Select
            value={selectedBodega}
            onValueChange={setSelectedBodega}
            disabled={isLoadingBodegas}
          >
            <SelectTrigger id="bodega">
              <SelectValue placeholder="Seleccione una bodega" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingBodegas ? (
                <SelectItem value="loading" disabled>
                  Cargando bodegas...
                </SelectItem>
              ) : bodegasData && bodegasData.length > 0 ? (
                bodegasData.map((bodega) => (
                  <SelectItem key={bodega.id} value={bodega.id}>
                    {bodega.nombre}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-bodegas" disabled>
                  No hay bodegas disponibles
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      ),
    },
  ];
  const zoneDialogActionConfig = {
    labels: {
      confirm: "Localizar",
      loading: "Localizando...",
    },
    onCancel: handleCancel,
    onConfirm: handleLocalizar,
    canConfirm:
      !!productSearch.selectedSku &&
      !!selectedBodega &&
      !productSearch.isLocating,
    isLoading: productSearch.isLocating,
  } as const;
  const baseWarehouseLayout = {
    open,
    onOpenChange: handleDialogChange,
    title: "Consulta de producto en bodega",
    description: "Seleccione el producto que quiere consultar",
    steps,
  } as const;
  const warehouseDialogLayoutProps = WarehouseDialog.useWarehouseDialogLayoutProps({
    ...baseWarehouseLayout,
    result: productSearch.locationResult,
    renderResult: WarehouseDialog.renderZoneResult,
    actions: zoneDialogActionConfig,
  });

  return <WarehouseDialogLayout {...warehouseDialogLayoutProps} />;
}
