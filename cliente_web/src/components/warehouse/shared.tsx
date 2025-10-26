import type { ReactNode } from "react";

import { AlertCircle, Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SkuOption {
  id: string;
  sku: string;
  nombre?: string;
}

interface SkuSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  isLoading: boolean;
  options?: SkuOption[];
  placeholder?: string;
  emptyLabel?: string;
}

export const SkuSelect = ({
  value,
  onValueChange,
  isLoading,
  options,
  placeholder = "Seleccione un SKU",
  emptyLabel = "No hay productos disponibles",
}: SkuSelectProps) => (
  <div className="space-y-2">
    <Label htmlFor="sku">SKU</Label>
    <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
      <SelectTrigger id="sku">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Cargando productos...
          </SelectItem>
        ) : options && options.length > 0 ? (
          options.map((producto) => (
            <SelectItem key={producto.id} value={producto.sku}>
              {producto.sku}
              {producto.nombre ? ` - ${producto.nombre}` : ""}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-products" disabled>
            {emptyLabel}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  </div>
);

interface LocationResultCardProps {
  found: boolean;
  successMessage: string;
  notFoundMessage: string;
  children?: ReactNode;
  successIcon?: ReactNode;
  warningIcon?: ReactNode;
}

export const LocationResultCard = ({
  found,
  successMessage,
  notFoundMessage,
  children,
  successIcon,
  warningIcon,
}: LocationResultCardProps) => (
  <div
    className={`mt-4 rounded-lg border p-4 ${
      found ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"
    }`}
  >
    <div className="flex items-start gap-3">
      {found
        ? successIcon ?? (
            <MapPin className="mt-0.5 h-5 w-5 text-green-600" />
          )
        : warningIcon ?? (
            <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600" />
          )}
      <div className="flex-1">
        <p className="text-sm font-medium">
          {found ? successMessage : notFoundMessage}
        </p>
        {found && children}
      </div>
    </div>
  </div>
);

interface WarehouseDialogActionsProps {
  onCancel: () => void;
  onConfirm: () => void;
  canConfirm: boolean;
  isLoading: boolean;
  confirmLabel: string;
  loadingLabel: string;
}

export const WarehouseDialogActions = ({
  onCancel,
  onConfirm,
  canConfirm,
  isLoading,
  confirmLabel,
  loadingLabel,
}: WarehouseDialogActionsProps) => (
  <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
    <Button onClick={onCancel} variant="outline" type="button" disabled={isLoading}>
      Cancelar
    </Button>
    <Button
      onClick={onConfirm}
      disabled={!canConfirm}
      className="min-w-[120px]"
      type="button"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        confirmLabel
      )}
    </Button>
  </DialogFooter>
);

