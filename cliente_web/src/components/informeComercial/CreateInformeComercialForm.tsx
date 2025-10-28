import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { FormDialog } from "@/components/forms/FormDialog";
import { createInformeComercial } from "@/services/informesComerciales.service";
import type { InformeComercial } from "@/types/informeComercial";
import { useCreateEntityMutation } from "@/hooks/useCreateEntityMutation";
import {
  EntityFormDialog,
  renderFormFields,
  useEntityFormDialogConfig,
  type FieldDefinition,
} from "@/components/forms";

// Zod schema for validation
const formSchema = z.object({
  nombre: z
    .string()
    .min(2, {
      message: "El nombre debe tener al menos 2 caracteres.",
    })
    .max(255, {
      message: "El nombre no puede exceder 255 caracteres.",
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateInformeComercialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const informeFields: FieldDefinition<FormValues>[] = [
  {
    name: "nombre",
    label: "Nombre",
    placeholder: "ej. IC-2025-Q1",
  },
];

export function CreateInformeComercialForm({
  open,
  onOpenChange,
}: CreateInformeComercialFormProps) {
  const [createdInforme, setCreatedInforme] = useState<InformeComercial | null>(
    null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
    },
  });

  const createMutation = useCreateEntityMutation<
    Parameters<typeof createInformeComercial>[0],
    Awaited<ReturnType<typeof createInformeComercial>>
  >({
    mutationFn: createInformeComercial,
    queryKey: ["informesComerciales"],
    successMessage: "Informe comercial creado exitosamente",
    errorTitle: "Error al crear informe comercial",
    onSuccess: (data) => {
      setCreatedInforme(data);
      form.reset();
    },
  });

  function onSubmit(data: FormValues) {
    createMutation.mutate({
      nombre: data.nombre,
    });
  }

  const closeDialog = () => {
    form.reset();
    setCreatedInforme(null);
    onOpenChange(false);
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      closeDialog();
      return;
    }

    onOpenChange(true);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format number with two decimal places for consistency
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const dialogConfig = useEntityFormDialogConfig<FormValues>({
    open,
    onOpenChange: handleDialogChange,
    form,
    onSubmit,
    isSubmitting: createMutation.isPending,
    onCancel: closeDialog,
    submitFirst: false,
    formClassName: "space-y-6",
  });

  if (createdInforme) {
    return (
      <FormDialog
        open={open}
        onOpenChange={handleDialogChange}
        title="Informe Comercial"
        contentClassName="sm:max-w-[500px]"
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nombre</p>
            <p className="text-base">{createdInforme.nombre}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Indicadores Clave</h3>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Ventas Totales
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrency(createdInforme.ventasTotales || 0)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Unidades Vendidas
              </p>
              <p className="text-2xl font-semibold">
                {formatNumber(createdInforme.unidadesVendidas || 0)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={closeDialog}>Cerrar</Button>
          </DialogFooter>
        </div>
      </FormDialog>
    );
  }

  return (
    <EntityFormDialog<FormValues>
      {...dialogConfig}
      title="Informe Comercial"
    >
      {renderFormFields(form.control, informeFields, createMutation.isPending)}
    </EntityFormDialog>
  );
}
