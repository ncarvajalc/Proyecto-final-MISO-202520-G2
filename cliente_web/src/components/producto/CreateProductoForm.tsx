import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, type Control } from "react-hook-form";
import { z } from "zod";
import { createProducto } from "@/services/productos.service";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Plus, Trash2 } from "lucide-react";
import { InlineEntityDialog, renderFormFields } from "@/components/forms";
import { useCreateEntityMutation } from "@/hooks/useCreateEntityMutation";
import { optionalUrlField } from "@/lib/validation";

// Zod validation schema based on acceptance criteria
const formSchema = z.object({
  // Campos mínimos requeridos
  sku: z.string().min(1, {
    message: "El SKU es requerido",
  }),
  nombre: z.string().min(1, {
    message: "El nombre es requerido",
  }),
  descripcion: z.string().min(1, {
    message: "La descripción es requerida",
  }),
  precio: z.number().positive({
    message: "El precio debe ser mayor a 0",
  }),
  // Campos opcionales
  especificaciones: z
    .array(
      z.object({
        nombre: z.string().min(1, "El nombre es requerido"),
        valor: z.string().min(1, "El valor es requerido"),
      })
    )
    .optional(),
  hojaTecnicaUrlManual: optionalUrlField("Debe ser una URL válida"),
  hojaTecnicaUrlInstalacion: optionalUrlField("Debe ser una URL válida"),
  hojaTecnicaCertificaciones: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProductoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const basicProductFields = [
  {
    name: "sku" as const,
    label: "SKU",
    placeholder: "MED-001",
  },
  {
    name: "nombre" as const,
    label: "Nombre",
    placeholder: "Nombre del producto",
  },
  {
    name: "descripcion" as const,
    label: "Descripción",
    placeholder: "Descripción del producto",
  },
];

const hojaTecnicaUrlFields = [
  {
    name: "hojaTecnicaUrlManual" as const,
    label: "URL del manual",
    placeholder: "https://ejemplo.com/manual.pdf",
  },
  {
    name: "hojaTecnicaUrlInstalacion" as const,
    label: "URL de hoja de instalación",
    placeholder: "https://ejemplo.com/instalacion.pdf",
  },
];

const renderHojaTecnicaUrlFields = (
  control: Control<FormValues>,
  disabled: boolean
) =>
  hojaTecnicaUrlFields.map(({ name, label, placeholder }) => (
    <FormField
      key={name}
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="url"
              placeholder={placeholder}
              {...field}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  ));

export function CreateProductoForm({
  open,
  onOpenChange,
}: CreateProductoFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sku: "",
      nombre: "",
      descripcion: "",
      precio: undefined,
      especificaciones: [],
      hojaTecnicaUrlManual: "",
      hojaTecnicaUrlInstalacion: "",
      hojaTecnicaCertificaciones: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "especificaciones",
  });

  const createMutation = useCreateEntityMutation<
    Parameters<typeof createProducto>[0],
    Awaited<ReturnType<typeof createProducto>>
  >({
    mutationFn: createProducto,
    queryKey: ["productos"],
    successMessage: "Producto creado exitosamente",
    errorTitle: "Error al crear producto",
    onSuccess: () => {
      form.reset();
      onOpenChange(false);
    },
  });

  function onSubmit(data: FormValues) {
    // Transform form data to match API structure
    const hasEspecificaciones =
      data.especificaciones && data.especificaciones.length > 0;

    const hasCertificaciones =
      data.hojaTecnicaCertificaciones &&
      data.hojaTecnicaCertificaciones.length > 0;

    const hasHojaTecnica =
      data.hojaTecnicaUrlManual ||
      data.hojaTecnicaUrlInstalacion ||
      hasCertificaciones;

    const productoData = {
      sku: data.sku,
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      activo: true, // Por defecto activo según criterios
      ...(hasEspecificaciones && {
        especificaciones: data.especificaciones,
      }),
      ...(hasHojaTecnica && {
        hojaTecnica: {
          urlManual: data.hojaTecnicaUrlManual || undefined,
          urlHojaInstalacion: data.hojaTecnicaUrlInstalacion || undefined,
          certificaciones: hasCertificaciones
            ? data.hojaTecnicaCertificaciones
            : undefined,
        },
      }),
    };

    createMutation.mutate(productoData);
  }

  const productDialogProps = {
    open,
    onOpenChange,
    form,
    onSubmit,
    isSubmitting: createMutation.isPending,
    formClassName: "space-y-6",
    title: "Crear producto",
    contentClassName: "max-w-2xl max-h-[90vh] overflow-y-auto",
  } as const;

  return (
    <InlineEntityDialog<FormValues> {...productDialogProps}>
      {renderFormFields(form.control, basicProductFields, createMutation.isPending)}

      <FormField
        control={form.control}
        name="precio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Precio</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="5000"
                {...field}
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                disabled={createMutation.isPending}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Especificaciones - Array dinámico */}
      <div className="pt-6 border-t">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Especificaciones (opcional)</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ nombre: "", valor: "" })}
          >
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay especificaciones. Click "Agregar" para añadir una.
          </p>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <FormField
                  control={form.control}
                  name={`especificaciones.${index}.nombre`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`especificaciones.${index}.valor`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Valor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="mt-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hoja Técnica - Campos opcionales */}
      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4">Hoja Técnica (opcional)</h3>

        <div className="space-y-6">
          {renderHojaTecnicaUrlFields(form.control, createMutation.isPending)}

          <FormField
            control={form.control}
            name="hojaTecnicaCertificaciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certificaciones</FormLabel>
                <FormControl>
                  <MultiSelect
                    values={field.value}
                    onValuesChange={field.onChange}
                  >
                    <MultiSelectTrigger className="w-full">
                      <MultiSelectValue placeholder="Selecciona certificaciones" />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      <MultiSelectItem value="INVIMA">INVIMA</MultiSelectItem>
                      <MultiSelectItem value="FDA">FDA</MultiSelectItem>
                      <MultiSelectItem value="ISO 9001">
                        ISO 9001
                      </MultiSelectItem>
                      <MultiSelectItem value="ISO 13485">
                        ISO 13485
                      </MultiSelectItem>
                      <MultiSelectItem value="CE">CE</MultiSelectItem>
                      <MultiSelectItem value="GMP">
                        GMP (Good Manufacturing Practice)
                      </MultiSelectItem>
                      <MultiSelectItem value="OMS">
                        OMS (Organización Mundial de la Salud)
                      </MultiSelectItem>
                      <MultiSelectItem value="COFEPRIS">
                        COFEPRIS
                      </MultiSelectItem>
                    </MultiSelectContent>
                  </MultiSelect>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </InlineEntityDialog>
  );
}
