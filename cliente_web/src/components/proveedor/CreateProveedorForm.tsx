import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProveedor } from "@/services/proveedores.service";
import { FormActionButtons } from "@/components/forms/FormActionButtons";
import { FormInputField } from "@/components/forms/FormInputField";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  DialogDescription,
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

const defaultValues: FormValues = {
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
};

type FieldConfig = {
  name: keyof FormValues;
  label: string;
  placeholder?: string;
  type?: string;
};

const basicFields: FieldConfig[] = [
  { name: "nombre", label: "Nombre", placeholder: "Nombre" },
  { name: "idTax", label: "Id tax", placeholder: "Id tax" },
  { name: "direccion", label: "Dirección", placeholder: "Dirección" },
  { name: "telefono", label: "Teléfono", placeholder: "Teléfono" },
  {
    name: "correo",
    label: "Correo",
    placeholder: "Correo",
    type: "email",
  },
  { name: "contacto", label: "Contacto", placeholder: "Contacto" },
];

const certificateFields: FieldConfig[] = [
  {
    name: "certificadoNombre",
    label: "Nombre certificado",
    placeholder: "Nombre certificado",
  },
  {
    name: "certificadoCuerpo",
    label: "Cuerpo certificador",
    placeholder: "Cuerpo certificador",
  },
  {
    name: "certificadoFechaCertificacion",
    label: "Fecha de certificación",
    type: "date",
  },
  {
    name: "certificadoFechaVencimiento",
    label: "Fecha de vencimiento",
    type: "date",
  },
  {
    name: "certificadoUrl",
    label: "URL del documento",
    type: "url",
    placeholder: "https://ejemplo.com/certificado.pdf",
  },
];

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
    defaultValues,
  });

  const createMutation = useMutation({
    mutationFn: createProveedor,
    onSuccess: () => {
      toast.success("Proveedor creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      form.reset(defaultValues);
      onOpenChange(false);
    },
    onError: (error: Error & { detail?: string }) => {
      const description = error.detail ?? error.message ?? "Error inesperado";
      toast.error("Error al crear proveedor", {
        description,
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
      id_tax: data.idTax,
      direccion: data.direccion,
      telefono: data.telefono,
      correo: data.correo,
      contacto: data.contacto,
      estado: data.estado,
      certificado: hasCertificado
        ? {
            nombre: data.certificadoNombre || "",
            cuerpoCertificador: data.certificadoCuerpo || "",
            fechaCertificacion: data.certificadoFechaCertificacion || "",
            fechaVencimiento: data.certificadoFechaVencimiento || "",
            urlDocumento: data.certificadoUrl || "",
          }
        : null,
    };

    createMutation.mutate(proveedorData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="create-proveedor-description"
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Crear proveedor</DialogTitle>
          <DialogDescription
            id="create-proveedor-description"
            className="sr-only"
          >
            Completa el formulario para registrar un proveedor y guardar su
            información en el sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Campos básicos requeridos */}
            {basicFields.map(({ name, label, placeholder, type }) => (
              <FormInputField
                key={name}
                control={form.control}
                name={name}
                label={label}
                placeholder={placeholder}
                type={type}
                disabled={createMutation.isPending}
              />
            ))}

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                {certificateFields.map(({ name, label, placeholder, type }) => (
                  <FormInputField
                    key={name}
                    control={form.control}
                    name={name}
                    label={label}
                    placeholder={placeholder}
                    type={type}
                    disabled={createMutation.isPending}
                  />
                ))}
              </div>
            </div>

            {/* Buttons */}
            <FormActionButtons
              layout="inline"
              isSubmitting={createMutation.isPending}
              onCancel={() => onOpenChange(false)}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
