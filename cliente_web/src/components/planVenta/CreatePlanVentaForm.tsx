import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { createPlanVenta } from "@/services/planesVenta.service";
import { getVendedores } from "@/services/vendedores.service";
import type { PlanVenta } from "@/types/planVenta";
import { FormActionButtons } from "@/components/forms/FormActionButtons";
import { FormInputField } from "@/components/forms/FormInputField";

// Zod schema for validation
const formSchema = z.object({
  identificador: z.string().min(1, {
    message: "El identificador es requerido.",
  }),
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  periodo: z.string().min(1, {
    message: "El periodo es requerido.",
  }),
  descripcion: z.string().min(1, {
    message: "La descripción es requerida.",
  }),
  vendedorId: z.string().min(1, {
    message: "El vendedor es requerido.",
  }),
  meta: z.string().min(1, {
    message: "La meta es requerida.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePlanVentaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlanVentaForm({
  open,
  onOpenChange,
}: CreatePlanVentaFormProps) {
  const queryClient = useQueryClient();
  const [vendedorOpen, setVendedorOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identificador: "",
      nombre: "",
      periodo: "",
      descripcion: "",
      vendedorId: "",
      meta: "",
    },
  });

  // Fetch vendedores for the combobox
  const { data: vendedoresData, isLoading: isLoadingVendedores } = useQuery({
    queryKey: ["vendedores"],
    queryFn: () => getVendedores({ page: 1, limit: 100 }),
  });

  // Mutation for creating plan de venta
  const createMutation = useMutation({
    mutationFn: (
      data: Omit<PlanVenta, "id" | "vendedorNombre" | "unidadesVendidas">
    ) => createPlanVenta(data),
    onSuccess: () => {
      // Invalidate and refetch planes de venta query
      queryClient.invalidateQueries({ queryKey: ["planesVenta"] });

      toast.success("Plan de venta creado exitosamente", {
        description: "El plan de venta ha sido registrado en el sistema.",
      });

      // Close dialog and reset form
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error & { detail?: string }) => {
      const detailMessage = error.detail?.trim();
      toast.error("Error al crear plan de venta", {
        description:
          detailMessage && detailMessage.length > 0
            ? detailMessage
            : "Ocurrió un error al crear el plan de venta.",
      });
    },
  });

  function onSubmit(data: FormValues) {
    // Convert meta from string to number
    const metaNumber = parseFloat(data.meta);

    if (isNaN(metaNumber) || metaNumber <= 0) {
      toast.error("Meta inválida", {
        description: "La meta debe ser un número mayor a 0.",
      });
      return;
    }

    createMutation.mutate({
      identificador: data.identificador,
      nombre: data.nombre,
      periodo: data.periodo,
      descripcion: data.descripcion,
      vendedorId: data.vendedorId,
      meta: metaNumber,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Crear Plan de Venta
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormInputField
              control={form.control}
              name="identificador"
              label="Identificador del Plan"
              placeholder="Identificador del plan"
              disabled={createMutation.isPending}
            />

            <FormInputField
              control={form.control}
              name="nombre"
              label="Nombre"
              placeholder="Plan Ventas Q1 2025"
              disabled={createMutation.isPending}
            />

            <FormInputField
              control={form.control}
              name="periodo"
              label="Periodo"
              placeholder="ej. 01/01/2025 - 31/03/2025"
              disabled={createMutation.isPending}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Descripción
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Se espera que...."
                      {...field}
                      disabled={createMutation.isPending}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vendedor */}
            <FormField
              control={form.control}
              name="vendedorId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium">
                    Vendedor
                  </FormLabel>
                  <Popover
                    modal={false}
                    open={vendedorOpen}
                    onOpenChange={setVendedorOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={vendedorOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={
                            createMutation.isPending || isLoadingVendedores
                          }
                        >
                          {field.value
                            ? vendedoresData?.data.find(
                                (vendedor) => vendedor.id === field.value
                              )?.nombre || "Vendedor no encontrado"
                            : "Seleccione un vendedor"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[400px] p-0"
                      portal={false}
                      side="bottom"
                      align="start"
                    >
                      <Command shouldFilter={true}>
                        <CommandInput
                          placeholder="Buscar vendedor..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>
                            No se encontraron vendedores.
                          </CommandEmpty>
                          <CommandGroup>
                            {vendedoresData?.data.map((vendedor) => (
                              <CommandItem
                                key={vendedor.id}
                                value={vendedor.id}
                                keywords={
                                  [vendedor.nombre, vendedor.correo].filter(
                                    (keyword): keyword is string =>
                                      typeof keyword === "string" &&
                                      keyword.trim().length > 0
                                  )
                                }
                                onSelect={(currentValue) => {
                                  form.setValue("vendedorId", currentValue);
                                  setVendedorOpen(false);
                                }}
                              >
                                <div className="flex flex-col flex-1">
                                  <span>{vendedor.nombre}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {vendedor.correo}
                                  </span>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    field.value === vendedor.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Meta */}
            <FormInputField
              control={form.control}
              name="meta"
              label="Meta"
              type="number"
              placeholder="Cuota en monto ($)"
              disabled={createMutation.isPending}
            />

            <FormActionButtons
              isSubmitting={createMutation.isPending}
              onCancel={() => onOpenChange(false)}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
