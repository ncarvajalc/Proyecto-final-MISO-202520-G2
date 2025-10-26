import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getProductos } from "@/services/productos.service";
import {
  getBodegas,
  getProductLocationInWarehouse,
} from "@/services/warehouse.service";
import type { ProductWarehouseLocation } from "@/types/warehouse";
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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
  const { data: productosData, isLoading: isLoadingProductos } = useQuery({
    queryKey: ["productos-skus"],
    queryFn: () => getProductos({ page: 1, limit: 1000 }),
    enabled: open,
  });

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

  const canLocalizar = selectedSku && selectedBodega && !isLocating;

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
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Select
              value={selectedSku}
              onValueChange={setSelectedSku}
              disabled={isLoadingProductos}
            >
              <SelectTrigger id="sku">
                <SelectValue placeholder="Seleccione un SKU" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingProductos ? (
                  <SelectItem value="loading" disabled>
                    Cargando productos...
                  </SelectItem>
                ) : productosData?.data && productosData.data.length > 0 ? (
                  productosData.data.map((producto) => (
                    <SelectItem key={producto.id} value={producto.sku}>
                      {producto.sku} - {producto.nombre}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-products" disabled>
                    No hay productos disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

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
            <div
              className={`mt-4 p-4 rounded-lg border ${
                locationResult.encontrado
                  ? "bg-green-50 border-green-200"
                  : "bg-orange-50 border-orange-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {locationResult.encontrado ? (
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {locationResult.encontrado
                      ? "Su producto se encuentra en la zona:"
                      : "Producto no localizado en esta bodega"}
                  </p>
                  {locationResult.encontrado && (
                    <p className="text-2xl font-bold mt-2">
                      {locationResult.zona}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <Button onClick={handleCancel} variant="outline" type="button">
            Cancelar
          </Button>
          <Button
            onClick={handleLocalizar}
            disabled={!canLocalizar}
            className="min-w-[120px]"
          >
            {isLocating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Localizando...
              </>
            ) : (
              "Localizar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
