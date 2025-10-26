import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useProductSkus } from "@/hooks/useProductSkus";
import {
  LocationResultCard,
  SkuSelect,
  WarehouseDialogActions,
} from "./shared";

interface ProductWarehouseLocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductWarehouseLocationForm({
  open,
  onOpenChange,
}: ProductWarehouseLocationFormProps) {
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [selectedBodega, setSelectedBodega] = useState<string>("");
  const [locationResult, setLocationResult] =
    useState<ProductWarehouseLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Fetch all products (with large limit to get all SKUs)
  const { data: productosData, isLoading: isLoadingProductos } =
    useProductSkus(open);

  // Fetch all warehouses
  const { data: bodegasData, isLoading: isLoadingBodegas } = useQuery({
    queryKey: ["bodegas"],
    queryFn: getBodegas,
    enabled: open,
  });

  const handleLocalizar = async () => {
    if (!selectedSku || !selectedBodega) {
      toast.error("Por favor seleccione un producto y una bodega");
      return;
    }

    setIsLocating(true);
    setLocationResult(null);

    try {
      const result = await getProductLocationInWarehouse({
        sku: selectedSku,
        bodegaId: selectedBodega,
      });
      setLocationResult(result);

      if (result.encontrado) {
        toast.success(`Producto localizado en zona ${result.zona}`);
      } else {
        toast.warning("Producto no localizado en esta bodega");
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
    setSelectedBodega("");
    setLocationResult(null);
    onOpenChange(false);
  };

  const canLocalizar = !!selectedSku && !!selectedBodega && !isLocating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Consulta de producto en bodega
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Seleccione el producto que quiere consultar
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1 - Select Product */}
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

          {/* Step 2 - Select Warehouse */}
          <div className="mb-4 mt-6">
            <p className="text-sm font-medium">2. Seleccionar bodega</p>
          </div>

          {/* Bodega Select */}
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

          {/* Location Result */}
          {locationResult && (
            <LocationResultCard
              found={locationResult.encontrado}
              successMessage="Su producto se encuentra en la zona:"
              notFoundMessage="Producto no localizado en esta bodega"
            >
              <p className="mt-2 text-2xl font-bold">{locationResult.zona}</p>
            </LocationResultCard>
          )}
        </div>

        <WarehouseDialogActions
          onCancel={handleCancel}
          onConfirm={handleLocalizar}
          canConfirm={canLocalizar}
          isLoading={isLocating}
          confirmLabel="Localizar"
          loadingLabel="Localizando..."
        />
      </DialogContent>
    </Dialog>
  );
}
