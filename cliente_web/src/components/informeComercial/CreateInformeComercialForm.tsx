import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormActionButtons } from "@/components/forms/FormActionButtons";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createInformeComercial } from "@/services/informesComerciales.service";
import type { InformeComercial } from "@/types/informeComercial";

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

export function CreateInformeComercialForm({
  open,
  onOpenChange,
}: CreateInformeComercialFormProps) {
  const queryClient = useQueryClient();
  const [createdInforme, setCreatedInforme] = useState<InformeComercial | null>(
    null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: createInformeComercial,
    onSuccess: (data) => {
      setCreatedInforme(data);
      toast.success("Informe comercial creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["informesComerciales"] });
    },
    onError: (error: Error & { detail?: string }) => {
      const description = error.detail ?? error.message ?? "Error inesperado";
      toast.error("Error al crear informe comercial", {
        description,
      });
    },
  });

  function onSubmit(data: FormValues) {
    createMutation.mutate({
      nombre: data.nombre,
    });
  }

  function handleClose() {
    form.reset();
    setCreatedInforme(null);
    onOpenChange(false);
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format number
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Informe Comercial</DialogTitle>
        </DialogHeader>

        {!createdInforme ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="ej. IC-2025-Q1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormActionButtons
                isSubmitting={createMutation.isPending}
                onCancel={handleClose}
                submitFirst={false}
              />
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            {/* Nombre del informe creado */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nombre
              </p>
              <p className="text-base">{createdInforme.nombre}</p>
            </div>

            {/* Indicadores Clave */}
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
              <Button onClick={handleClose}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
