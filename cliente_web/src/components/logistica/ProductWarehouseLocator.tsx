import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getBodegas,
  getProductosInventario,
  localizarProductoEnBodega,
} from "@/services/logistica.service";
import type {
  Bodega,
  LogisticaProducto,
  ProductWarehouseLocation,
} from "@/types/logistica";

type LookupResult = {
  location: string | null;
  message: string | null;
};

const PRODUCTOS_QUERY_KEY = ["logistica", "productos", "inventario"] as const;
const BODEGAS_QUERY_KEY = ["logistica", "bodegas"] as const;

const DEFAULT_ERROR_MESSAGE =
  "No se pudo localizar el producto en la bodega seleccionada";

export function ProductWarehouseLocator() {
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [selectedBodega, setSelectedBodega] = useState<string>("");
  const [lookupResult, setLookupResult] = useState<LookupResult>({
    location: null,
    message: null,
  });

  const productosQuery = useQuery<LogisticaProducto[]>({
    queryKey: PRODUCTOS_QUERY_KEY,
    queryFn: getProductosInventario,
    staleTime: 5 * 60 * 1000,
  });

  const bodegasQuery = useQuery<Bodega[]>({
    queryKey: BODEGAS_QUERY_KEY,
    queryFn: getBodegas,
    staleTime: 5 * 60 * 1000,
  });

  const localizarMutation = useMutation<
    ProductWarehouseLocation,
    Error,
    { sku: string; warehouseId: string }
  >({
    mutationFn: localizarProductoEnBodega,
    onSuccess: (data) => {
      setLookupResult({
        location: data.location,
        message: data.location ? null : data.message ?? null,
      });
    },
    onError: (error) => {
      setLookupResult({
        location: null,
        message: error.message || DEFAULT_ERROR_MESSAGE,
      });
    },
  });

  useEffect(() => {
    setLookupResult({ location: null, message: null });
  }, [selectedSku, selectedBodega]);

  const productos = useMemo(() => productosQuery.data ?? [], [productosQuery.data]);
  const bodegas = useMemo(() => bodegasQuery.data ?? [], [bodegasQuery.data]);

  const isLocateDisabled =
    !selectedSku ||
    !selectedBodega ||
    localizarMutation.isPending ||
    productosQuery.isLoading ||
    bodegasQuery.isLoading;

  const handleLocate = () => {
    if (!selectedSku || !selectedBodega) {
      return;
    }

    setLookupResult({ location: null, message: null });
    localizarMutation.mutate({ sku: selectedSku, warehouseId: selectedBodega });
  };

  return (
    <Card aria-labelledby="product-warehouse-locator-heading">
      <CardHeader>
        <CardTitle id="product-warehouse-locator-heading">
          Consulta de productos en bodega
        </CardTitle>
        <CardDescription>
          Selecciona un SKU y una bodega para conocer la ubicación exacta del producto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="product-warehouse-locator-product">
              Producto (SKU)
            </Label>
            <Select
              value={selectedSku}
              onValueChange={setSelectedSku}
              disabled={productosQuery.isLoading || productosQuery.isError}
            >
              <SelectTrigger
                id="product-warehouse-locator-product"
                aria-label="Seleccionar producto"
              >
                <SelectValue
                  placeholder={
                    productosQuery.isLoading
                      ? "Cargando productos..."
                      : "Selecciona un producto"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {productos.map((producto) => (
                  <SelectItem key={producto.sku} value={producto.sku}>
                    {producto.sku} - {producto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {productosQuery.isError && (
              <p className="text-sm text-destructive">
                No se pudieron cargar los productos.
              </p>
            )}
            {!productosQuery.isLoading && productos.length === 0 && !productosQuery.isError && (
              <p className="text-sm text-muted-foreground">
                No hay productos disponibles para localizar.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="product-warehouse-locator-warehouse">Bodega</Label>
            <Select
              value={selectedBodega}
              onValueChange={setSelectedBodega}
              disabled={bodegasQuery.isLoading || bodegasQuery.isError}
            >
              <SelectTrigger
                id="product-warehouse-locator-warehouse"
                aria-label="Seleccionar bodega"
              >
                <SelectValue
                  placeholder={
                    bodegasQuery.isLoading
                      ? "Cargando bodegas..."
                      : "Selecciona una bodega"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {bodegas.map((bodega) => (
                  <SelectItem key={bodega.id} value={bodega.id}>
                    {bodega.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {bodegasQuery.isError && (
              <p className="text-sm text-destructive">
                No se pudieron cargar las bodegas.
              </p>
            )}
            {!bodegasQuery.isLoading && bodegas.length === 0 && !bodegasQuery.isError && (
              <p className="text-sm text-muted-foreground">
                No hay bodegas disponibles.
              </p>
            )}
          </div>

          <Button onClick={handleLocate} disabled={isLocateDisabled}>
            {localizarMutation.isPending ? "Localizando..." : "Localizar"}
          </Button>

          {(lookupResult.location || lookupResult.message) && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md bg-muted px-4 py-3 text-left"
            >
              {lookupResult.location ? (
                <p>
                  Ubicación encontrada: {" "}
                  <span className="font-semibold">{lookupResult.location}</span>
                </p>
              ) : (
                <p>{lookupResult.message ?? DEFAULT_ERROR_MESSAGE}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
