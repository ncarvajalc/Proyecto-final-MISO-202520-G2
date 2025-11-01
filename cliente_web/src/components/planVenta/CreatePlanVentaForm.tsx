import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
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
import {
  renderFormFields,
  type FieldDefinition,
  InlineEntityDialog,
} from "@/components/forms";
import { useCreateEntityMutation } from "@/hooks/useCreateEntityMutation";

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

const planBasicFields: FieldDefinition<FormValues>[] = [
  {
    name: "identificador",
    label: "Identificador del Plan",
    placeholder: "Identificador del plan",
  },
  {
    name: "nombre",
    label: "Nombre",
    placeholder: "Plan Ventas Q1 2025",
  },
  {
    name: "periodo",
    label: "Periodo",
    placeholder: "ej. 01/01/2025 - 31/03/2025",
  },
  {
    name: "meta",
    label: "Meta",
    placeholder: "Cuota en monto ($)",
    type: "number",
  },
];

const getPlanDialogProps = ({
  open,
  onOpenChange,
  form,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ReturnType<typeof useForm<FormValues>>;
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
}) => ({
  open,
  onOpenChange,
  form,
  onSubmit,
  isSubmitting,
  formClassName: "space-y-4",
  title: "Crear Plan de Venta",
});

export function CreatePlanVentaForm({
  open,
  onOpenChange,
}: CreatePlanVentaFormProps) {
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

  const createMutation = useCreateEntityMutation<
    Omit<PlanVenta, "id" | "vendedorNombre" | "unidadesVendidas">,
    Awaited<ReturnType<typeof createPlanVenta>>
  >({
    mutationFn: (payload) => createPlanVenta(payload),
    queryKey: ["planesVenta"],
    successMessage: "Plan de venta creado exitosamente",
    successDescription: "El plan de venta ha sido registrado en el sistema.",
    errorTitle: "Error al crear plan de venta",
    getErrorDescription: (error) => {
      const detail = error.detail?.trim();
      if (detail) {
        return detail;
      }

      return "Ocurrió un error al crear el plan de venta.";
    },
    onSuccess: () => {
      onOpenChange(false);
      form.reset();
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

  const planDialogProps = getPlanDialogProps({
    open,
    onOpenChange,
    form,
    onSubmit,
    isSubmitting: createMutation.isPending,
  });

  return (
    <InlineEntityDialog<FormValues> {...planDialogProps}>
      {renderFormFields(
        form.control,
        planBasicFields,
        createMutation.isPending
      )}

      <FormField
        control={form.control}
        name="descripcion"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Descripción</FormLabel>
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

      <FormField
        control={form.control}
        name="vendedorId"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="text-sm font-medium">Vendedor</FormLabel>
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
                        )?.nombre ?? ""
                      : "Selecciona un vendedor"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar vendedor" />
                  <CommandList>
                    <CommandEmpty>No se encontraron vendedores.</CommandEmpty>
                    <CommandGroup>
                      {vendedoresData?.data.map((vendedor) => (
                        <CommandItem
                          key={vendedor.id}
                          value={vendedor.nombre}
                          onSelect={() => {
                            field.onChange(vendedor.id);
                            setVendedorOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              vendedor.id === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {vendedor.nombre}
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
    </InlineEntityDialog>
  );
}
