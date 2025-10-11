import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProducto } from "@/services/productos.service";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Plus, Trash2 } from "lucide-react";

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
  hojaTecnicaUrlManual: z
    .string()
    .url({
      message: "Debe ser una URL válida",
    })
    .optional()
    .or(z.literal("")),
  hojaTecnicaUrlInstalacion: z
    .string()
    .url({
      message: "Debe ser una URL válida",
    })
    .optional()
    .or(z.literal("")),
  hojaTecnicaCertificaciones: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProductoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProductoForm({
  open,
  onOpenChange,
}: CreateProductoFormProps) {
  const queryClient = useQueryClient();

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

  const createMutation = useMutation({
    mutationFn: createProducto,
    onSuccess: () => {
      toast.success("Producto creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error & { detail?: string }) => {
      const description = error.detail ?? error.message ?? "Error inesperado";
      toast.error("Error al crear producto", {
        description,
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear producto</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Campos básicos requeridos */}
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="MED-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del producto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder="Descripción del producto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Especificaciones - Array dinámico */}
            <div className="pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Especificaciones (opcional)
                </h3>
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
              <h3 className="text-lg font-semibold mb-4">
                Hoja Técnica (opcional)
              </h3>

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="hojaTecnicaUrlManual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL del manual</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://ejemplo.com/manual.pdf"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hojaTecnicaUrlInstalacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de hoja de instalación</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://ejemplo.com/instalacion.pdf"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            <MultiSelectItem value="INVIMA">
                              INVIMA
                            </MultiSelectItem>
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

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
