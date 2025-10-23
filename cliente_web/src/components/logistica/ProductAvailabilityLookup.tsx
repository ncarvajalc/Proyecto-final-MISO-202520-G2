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
  consultarDisponibilidadProducto,
  getProductosInventario,
} from "@/services/logistica.service";
import type { LogisticaProducto, ProductAvailability } from "@/types/logistica";

type AvailabilityResult = {
  warehouseName: string | null;
  message: string | null;
};

const PRODUCTOS_QUERY_KEY = ["logistica", "productos", "inventario"] as const;
const DEFAULT_UNAVAILABLE_MESSAGE = "Producto sin disponibilidad en bodega";
const DEFAULT_ERROR_MESSAGE =
  "No se pudo consultar la disponibilidad del producto";

export function ProductAvailabilityLookup() {
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityResult>({
    warehouseName: null,
    message: null,
  });

  const productosQuery = useQuery<LogisticaProducto[]>({
    queryKey: PRODUCTOS_QUERY_KEY,
    queryFn: getProductosInventario,
    staleTime: 5 * 60 * 1000,
  });

  const disponibilidadMutation = useMutation<
    ProductAvailability,
    Error,
    string
  >({
    mutationFn: consultarDisponibilidadProducto,
    onSuccess: (data) => {
      setAvailabilityResult({
        warehouseName: data.warehouseName,
        message:
          data.warehouseName === null
            ? data.message ?? DEFAULT_UNAVAILABLE_MESSAGE
            : null,
      });
    },
    onError: (error) => {
      setAvailabilityResult({
        warehouseName: null,
        message: error.message || DEFAULT_ERROR_MESSAGE,
      });
    },
  });

  useEffect(() => {
    setAvailabilityResult({ warehouseName: null, message: null });
  }, [selectedSku]);

  const productos = useMemo(() => productosQuery.data ?? [], [productosQuery.data]);

  const isConsultarDisabled =
    !selectedSku ||
    productosQuery.isLoading ||
    disponibilidadMutation.isPending;

  const handleConsultar = () => {
    if (!selectedSku) {
      return;
    }

    setAvailabilityResult({ warehouseName: null, message: null });
    disponibilidadMutation.mutate(selectedSku);
  };

  return (
    <Card aria-labelledby="product-availability-heading">
      <CardHeader>
        <CardTitle id="product-availability-heading">
          Localización de productos
        </CardTitle>
        <CardDescription>
          Consulta en qué bodega se encuentra disponible un producto específico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="product-availability-select">Producto (SKU)</Label>
            <Select
              value={selectedSku}
              onValueChange={setSelectedSku}
              disabled={productosQuery.isLoading || productosQuery.isError}
            >
              <SelectTrigger
                id="product-availability-select"
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
                No hay productos registrados en el inventario.
              </p>
            )}
          </div>

          <Button onClick={handleConsultar} disabled={isConsultarDisabled}>
            {disponibilidadMutation.isPending ? "Consultando..." : "Consultar"}
          </Button>

          {(availabilityResult.warehouseName || availabilityResult.message) && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md bg-muted px-4 py-3 text-left"
            >
              {availabilityResult.warehouseName ? (
                <p>
                  Disponible en: {" "}
                  <span className="font-semibold">
                    {availabilityResult.warehouseName}
                  </span>
                </p>
              ) : (
                <p>{availabilityResult.message ?? DEFAULT_UNAVAILABLE_MESSAGE}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
