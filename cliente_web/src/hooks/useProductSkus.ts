import { useQuery } from "@tanstack/react-query";

import { getProductos } from "@/services/productos.service";

export const useProductSkus = (enabled: boolean) =>
  useQuery({
    queryKey: ["productos-skus"],
    queryFn: () => getProductos({ page: 1, limit: 1000 }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

