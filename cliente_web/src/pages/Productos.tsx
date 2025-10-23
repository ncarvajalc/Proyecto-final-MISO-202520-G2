import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getProductos } from "@/services/productos.service";
import { Plus, Upload, ShoppingBag } from "lucide-react";
import { CreateProductoForm } from "@/components/producto/CreateProductoForm";
import { BulkUploadProductosForm } from "@/components/producto/BulkUploadProductosForm";
import { ProductLocationForm } from "@/components/warehouse/ProductLocationForm";
import { ProductWarehouseLocationForm } from "@/components/warehouse/ProductWarehouseLocationForm";

const ITEMS_PER_PAGE = 5;

export default function Productos() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isProductLocationDialogOpen, setIsProductLocationDialogOpen] =
    useState(false);
  const [isWarehouseLocationDialogOpen, setIsWarehouseLocationDialogOpen] =
    useState(false);

  // Fetch productos using TanStack Query with server-side pagination
  const { data, isLoading, isError } = useQuery({
    queryKey: ["productos", currentPage, ITEMS_PER_PAGE],
    queryFn: () => getProductos({ page: currentPage, limit: ITEMS_PER_PAGE }),
  });

  const totalPages = data?.totalPages || 0;

  // Button handlers
  const handleNuevoProducto = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCargaMasiva = () => {
    setIsBulkUploadDialogOpen(true);
  };

  const handleStock = () => {
    setIsStockDialogOpen(true);
  };

  const handleDisponibilidad = () => {
    setIsStockDialogOpen(false);
    setIsProductLocationDialogOpen(true);
  };

  const handleLocalizacion = () => {
    setIsStockDialogOpen(false);
    setIsWarehouseLocationDialogOpen(true);
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
          {!data?.data || data.data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground"
              >
                No hay productos disponibles
              </TableCell>
            </TableRow>
          ) : (
            data.data.map((producto) => (
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
                      {producto.hojaTecnica.certificaciones &&
                        producto.hojaTecnica.certificaciones.length > 0 && (
                          <div className="text-muted-foreground">
                            ✓ {producto.hojaTecnica.certificaciones.join(", ")}
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

      {/* Create Producto Dialog */}
      <CreateProductoForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Bulk Upload Productos Dialog */}
      <BulkUploadProductosForm
        open={isBulkUploadDialogOpen}
        onOpenChange={setIsBulkUploadDialogOpen}
      />

      {/* Stock Queries Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Consultas de Stock
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button onClick={handleDisponibilidad} className="w-full" size="lg">
              Disponibilidad en bodega
            </Button>
            <Button
              onClick={handleLocalizacion}
              variant="lighter"
              className="w-full"
              size="lg"
            >
              Localización en bodega
            </Button>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              onClick={() => setIsStockDialogOpen(false)}
              variant="darker"
            >
              Volver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Location Form */}
      <ProductLocationForm
        open={isProductLocationDialogOpen}
        onOpenChange={setIsProductLocationDialogOpen}
      />

      {/* Product Warehouse Location Form */}
      <ProductWarehouseLocationForm
        open={isWarehouseLocationDialogOpen}
        onOpenChange={setIsWarehouseLocationDialogOpen}
      />
    </div>
  );
}
