import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Typography1 } from "@/components/ui/typography1";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { getProductos } from "@/services/productos.service";
import { Plus, Upload, ShoppingBag } from "lucide-react";

const ITEMS_PER_PAGE = 5;

export default function Productos() {
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch productos using TanStack Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ["productos"],
    queryFn: getProductos,
  });

  // Client-side pagination
  const paginatedData = useMemo(() => {
    if (!data?.data) return [];

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return data.data.slice(startIndex, endIndex);
  }, [data, currentPage]);

  const totalPages = Math.ceil((data?.total || 0) / ITEMS_PER_PAGE);

  // Button handlers (to be implemented later)
  const handleNuevoProducto = () => {
    console.log("Nuevo producto clicked");
    // TODO: Implement create producto functionality
  };

  const handleCargaMasiva = () => {
    console.log("Carga masiva clicked");
    // TODO: Implement bulk upload functionality
  };

  const handleStock = () => {
    console.log("Stock clicked");
    // TODO: Implement stock management functionality
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando productos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error al cargar los productos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 items-center justify-center">
        <Typography1 className="mb-0">Productos</Typography1>

        <div className="flex gap-3">
          <Button onClick={handleNuevoProducto}>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
          <Button onClick={handleCargaMasiva} variant="darker">
            <Upload className="h-4 w-4" />
            Carga masiva
          </Button>
          <Button onClick={handleStock} variant="lighter">
            <ShoppingBag className="h-4 w-4" />
            Stock
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Especificaciones</TableHead>
            <TableHead>Hoja Técnica</TableHead>
            <TableHead>¿Activo?</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground"
              >
                No hay productos disponibles
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell className="font-medium">{producto.sku}</TableCell>
                <TableCell>{producto.nombre}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {producto.descripcion}
                </TableCell>
                <TableCell>
                  ${producto.precio.toLocaleString("es-CO")}
                </TableCell>
                <TableCell>
                  {producto.especificaciones &&
                  producto.especificaciones.length > 0 ? (
                    <div className="text-xs space-y-1">
                      {producto.especificaciones.slice(0, 2).map((esp, idx) => (
                        <div key={idx} className="text-muted-foreground">
                          <span className="font-medium">{esp.nombre}:</span>{" "}
                          {esp.valor}
                        </div>
                      ))}
                      {producto.especificaciones.length > 2 && (
                        <div className="text-muted-foreground">
                          +{producto.especificaciones.length - 2} más
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Sin especificaciones
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {producto.hojaTecnica ? (
                    <div className="text-xs space-y-1">
                      {producto.hojaTecnica.urlManual && (
                        <div className="text-brand-600 hover:underline cursor-pointer">
                          Manual
                        </div>
                      )}
                      {producto.hojaTecnica.urlHojaInstalacion && (
                        <div className="text-brand-600 hover:underline cursor-pointer">
                          Instalación
                        </div>
                      )}
                      {producto.hojaTecnica.certificaciones && (
                        <div className="text-muted-foreground">
                          ✓ {producto.hojaTecnica.certificaciones}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Sin hoja técnica
                    </span>
                  )}
                </TableCell>
                <TableCell>{producto.activo ? "Sí" : "No"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
