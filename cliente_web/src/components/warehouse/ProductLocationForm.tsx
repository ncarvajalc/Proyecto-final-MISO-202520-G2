import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProductLocation } from "@/services/warehouse.service";
import type { ProductLocation } from "@/types/warehouse";
import { toast } from "sonner";
import { useProductSkus } from "@/hooks/useProductSkus";
import { LocationResultCard, SkuSelect, WarehouseDialogActions } from "./shared";

interface ProductLocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductLocationForm({
  open,
  onOpenChange,
}: ProductLocationFormProps) {
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [locationResult, setLocationResult] = useState<ProductLocation | null>(
    null
  );
  const [isLocating, setIsLocating] = useState(false);

  // Fetch all products (with large limit to get all SKUs)
  const { data: productosData, isLoading: isLoadingProductos } =
    useProductSkus(open);

  const handleLocalizar = async () => {
    if (!selectedSku) {
      toast.error("Por favor seleccione un producto");
      return;
    }

    setIsLocating(true);
    setLocationResult(null);

    try {
      const result = await getProductLocation({
        sku: selectedSku,
      });
      setLocationResult(result);

      if (result.encontrado) {
        toast.success(
          `Producto localizado en ${result.bodega}, zona ${result.zona}`
        );
      } else {
        toast.warning("Producto no localizado en ninguna bodega");
      }
    } catch (error) {
      console.error("Error locating product:", error);
      toast.error("Error al consultar la ubicación del producto");
    } finally {
      setIsLocating(false);
    }
  };

  const handleCancel = () => {
    setSelectedSku("");
    setLocationResult(null);
    onOpenChange(false);
  };

  const canLocalizar = !!selectedSku && !isLocating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Disponibilidad en bodega
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Seleccione el producto que quiere consultar
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step indicator */}
          <div className="mb-4">
            <p className="text-sm font-medium">1. Seleccionar producto</p>
          </div>

          {/* SKU Select */}
          <SkuSelect
            value={selectedSku}
            onValueChange={setSelectedSku}
            isLoading={isLoadingProductos}
            options={productosData?.data}
          />

          {/* Location Result */}
          {locationResult && (
            <LocationResultCard
              found={locationResult.encontrado}
              successMessage="Su producto se encuentra en la bodega:"
              notFoundMessage="Producto no localizado en ninguna bodega"
            >
              <p className="mt-2 text-lg font-semibold text-green-700">
                {locationResult.bodega}
              </p>
              <p className="mt-1 text-2xl font-bold">{locationResult.zona}</p>
            </LocationResultCard>
          )}
        </div>

        <WarehouseDialogActions
          onCancel={handleCancel}
          onConfirm={handleLocalizar}
          canConfirm={canLocalizar}
          isLoading={isLocating}
          confirmLabel="Consultar"
          loadingLabel="Consultando..."
        />
      </DialogContent>
    </Dialog>
  );
}
