import { useState } from "react";

import type { ProductLocation } from "@/types/warehouse";
import { useProductSkus } from "@/hooks/useProductSkus";

type ProductSkusData = ReturnType<typeof useProductSkus>["data"];

export interface WarehouseProductSearchState {
  selectedSku: string;
  setSelectedSku: (sku: string) => void;
  productosData: ProductSkusData;
  isLoadingProductos: boolean;
  locationResult: ProductLocation | null;
  setLocationResult: (location: ProductLocation | null) => void;
  isLocating: boolean;
  setIsLocating: (value: boolean) => void;
  reset: () => void;
}

export function useWarehouseProductSearch(open: boolean): WarehouseProductSearchState {
  const [selectedSku, setSelectedSku] = useState("");
  const [locationResult, setLocationResult] = useState<ProductLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { data: productosData, isLoading: isLoadingProductos } = useProductSkus(open);

  const reset = () => {
    setSelectedSku("");
    setLocationResult(null);
    setIsLocating(false);
  };

  return {
    selectedSku,
    setSelectedSku,
    productosData,
    isLoadingProductos,
    locationResult,
    setLocationResult,
    isLocating,
    setIsLocating,
    reset,
  };
}
