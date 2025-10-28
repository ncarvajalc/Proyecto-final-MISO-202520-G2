import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProductos } from "@/services/productos.service";
import type { Producto } from "@/types/producto";
import { Plus, Upload, ShoppingBag } from "lucide-react";
import { CreateProductoForm } from "@/components/producto/CreateProductoForm";
import { BulkUploadProductosForm } from "@/components/producto/BulkUploadProductosForm";
import { ProductLocationForm } from "@/components/warehouse/ProductLocationForm";
import { ProductWarehouseLocationForm } from "@/components/warehouse/ProductWarehouseLocationForm";
import { ResourcePageLayout } from "@/components/common/ResourcePageLayout";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";

const ITEMS_PER_PAGE = 5;

export default function Productos() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isProductLocationDialogOpen, setIsProductLocationDialogOpen] =
    useState(false);
  const [isWarehouseLocationDialogOpen, setIsWarehouseLocationDialogOpen] =
    useState(false);

  const {
    data,
    isLoading,
    isError,
    currentPage,
    setCurrentPage,
    totalPages,
  } = usePaginatedResource("productos", getProductos, ITEMS_PER_PAGE);

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

  return (
    <ResourcePageLayout<Producto>
      title="Productos"
      actions={
        <>
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
        </>
      }
      loadingMessage="Cargando productos..."
      errorMessage="Error al cargar los productos"
      state={{ isLoading, isError }}
      table={{
        columns: [
          { key: "sku", header: "SKU" },
          { key: "nombre", header: "Nombre" },
          { key: "descripcion", header: "Descripción" },
          { key: "precio", header: "Precio" },
          { key: "especificaciones", header: "Especificaciones" },
          { key: "hoja", header: "Hoja Técnica" },
          { key: "activo", header: "¿Activo?" },
        ],
        data: data?.data,
        emptyMessage: "No hay productos disponibles",
        renderRow: (producto) => (
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
                <div className="space-y-1 text-xs">
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
                <span className="text-xs text-muted-foreground">
                  Sin especificaciones
                </span>
              )}
            </TableCell>
            <TableCell>
              {producto.hojaTecnica ? (
                <div className="space-y-1 text-xs">
                  {producto.hojaTecnica.urlManual && (
                    <div className="cursor-pointer text-brand-600 hover:underline">
                      Manual
                    </div>
                  )}
                  {producto.hojaTecnica.urlHojaInstalacion && (
                    <div className="cursor-pointer text-brand-600 hover:underline">
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
                <span className="text-xs text-muted-foreground">
                  Sin hoja técnica
                </span>
              )}
            </TableCell>
            <TableCell>{producto.activo ? "Sí" : "No"}</TableCell>
          </TableRow>
        ),
      }}
      pagination={{
        currentPage,
        totalPages,
        onPageChange: setCurrentPage,
      }}
    >
      <CreateProductoForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <BulkUploadProductosForm
        open={isBulkUploadDialogOpen}
        onOpenChange={setIsBulkUploadDialogOpen}
      />

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

      <ProductLocationForm
        open={isProductLocationDialogOpen}
        onOpenChange={setIsProductLocationDialogOpen}
      />

      <ProductWarehouseLocationForm
        open={isWarehouseLocationDialogOpen}
        onOpenChange={setIsWarehouseLocationDialogOpen}
      />
    </ResourcePageLayout>
  );
}
