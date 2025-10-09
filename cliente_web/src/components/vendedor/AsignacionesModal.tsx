import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Vendedor } from "@/types/vendedor";

interface AsignacionesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedor: Vendedor | null;
}

/**
 * AsignacionesModal Component
 *
 * Displays the sales report (Reporte Vendedor) with plan de venta details.
 * Shows vendedor information and key performance indicators.
 */
export function AsignacionesModal({
  open,
  onOpenChange,
  vendedor,
}: AsignacionesModalProps) {
  if (!vendedor) return null;

  const planDeVenta = vendedor.planDeVenta;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Reporte Vendedor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información del Vendedor */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">ID</label>
              <p className="text-sm text-muted-foreground">{vendedor.id}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nombre
              </label>
              <p className="text-sm text-muted-foreground">{vendedor.nombre}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <p className="text-sm text-muted-foreground">{vendedor.correo}</p>
            </div>
          </div>

          {/* Indicadores Clave */}
          {planDeVenta ? (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Indicadores Clave</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Plan de Venta
                </label>
                <p className="text-sm text-muted-foreground">
                  {planDeVenta.identificador}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Unidades Vendidas
                </label>
                <p className="text-sm text-muted-foreground">
                  {planDeVenta.unidadesVendidas}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Meta
                </label>
                <p className="text-sm text-muted-foreground">
                  {planDeVenta.meta}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Cumplimiento de plan
                </label>
                <p className="text-sm text-muted-foreground">
                  {(
                    (planDeVenta.unidadesVendidas / planDeVenta.meta) *
                    100
                  ).toFixed(2)}
                  %
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center py-4">
                Este vendedor no tiene un plan de venta asignado
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Regresar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
