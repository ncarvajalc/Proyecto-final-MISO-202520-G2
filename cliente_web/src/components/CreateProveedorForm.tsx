import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProveedor } from "@/services/proveedores.service";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Zod validation schema based on acceptance criteria
const formSchema = z.object({
  // Campos mínimos requeridos
  nombre: z.string().min(1, {
    message: "El nombre es requerido",
  }),
  idTax: z.string().min(1, {
    message: "El Tax ID es requerido",
  }),
  direccion: z.string().min(1, {
    message: "La dirección es requerida",
  }),
  telefono: z.string().min(1, {
    message: "El teléfono es requerido",
  }),
  correo: z
    .string()
    .email({
      message: "Debe ser un correo electrónico válido",
    })
    .min(1, {
      message: "El correo es requerido",
    }),
  contacto: z.string().min(1, {
    message: "El contacto es requerido",
  }),
  estado: z.enum(["Activo", "Inactivo"]),
  // Campos opcionales del certificado
  certificadoNombre: z.string().optional(),
  certificadoCuerpo: z.string().optional(),
  certificadoFechaCertificacion: z.string().optional(),
  certificadoFechaVencimiento: z.string().optional(),
  certificadoUrl: z
    .string()
    .url({
      message: "Debe ser una URL válida",
    })
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProveedorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProveedorForm({
  open,
  onOpenChange,
}: CreateProveedorFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      idTax: "",
      direccion: "",
      telefono: "",
      correo: "",
      contacto: "",
      estado: "Activo",
      certificadoNombre: "",
      certificadoCuerpo: "",
      certificadoFechaCertificacion: "",
      certificadoFechaVencimiento: "",
      certificadoUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: createProveedor,
    onSuccess: () => {
      toast.success("Proveedor creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Error al crear proveedor", {
        description: error.message,
      });
    },
  });

  function onSubmit(data: FormValues) {
    // Transform form data to match API structure
    const hasCertificado =
      data.certificadoNombre ||
      data.certificadoCuerpo ||
      data.certificadoFechaCertificacion ||
      data.certificadoFechaVencimiento ||
      data.certificadoUrl;

    const proveedorData = {
      nombre: data.nombre,
      idTax: data.idTax,
      direccion: data.direccion,
      telefono: data.telefono,
      correo: data.correo,
      contacto: data.contacto,
      estado: data.estado,
      ...(hasCertificado && {
        certificado: {
          nombre: data.certificadoNombre || "",
          cuerpoCertificador: data.certificadoCuerpo || "",
          fechaCertificacion: data.certificadoFechaCertificacion || "",
          fechaVencimiento: data.certificadoFechaVencimiento || "",
          urlDocumento: data.certificadoUrl || "",
        },
      }),
    };

    createMutation.mutate(proveedorData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear proveedor</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Campos básicos requeridos */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idTax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Id tax</FormLabel>
                  <FormControl>
                    <Input placeholder="Id tax" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="Teléfono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="correo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Correo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contacto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contacto</FormLabel>
                  <FormControl>
                    <Input placeholder="Contacto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Certificado - Campos opcionales */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">Certificado</h3>

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="certificadoNombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre certificado</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre certificado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificadoCuerpo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cuerpo certificado</FormLabel>
                      <FormControl>
                        <Input placeholder="Cuerpo certificado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificadoFechaCertificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de certificación</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificadoFechaVencimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de vencimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificadoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL del documento</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://ejemplo.com/certificado.pdf"
                          {...field}
                        />
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
