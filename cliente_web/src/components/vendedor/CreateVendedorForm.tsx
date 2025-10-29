import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createVendedor } from "@/services/vendedores.service";
import {
  EntityFormDialog,
  renderFormFields,
  type FieldDefinition,
  useInlineEntityFormDialogConfig,
} from "@/components/forms";
import { useCreateEntityMutation } from "@/hooks/useCreateEntityMutation";

// Zod schema for validation
const formSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  correo: z.string().email({
    message: "Debe ser un correo electrónico válido.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateVendedorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const vendedorFields: FieldDefinition<FormValues>[] = [
  {
    name: "nombre",
    label: "Nombre",
    placeholder: "Nombre del vendedor",
  },
  {
    name: "correo",
    label: "Email",
    type: "email",
    placeholder: "Email",
  },
];

export function CreateVendedorForm({
  open,
  onOpenChange,
}: CreateVendedorFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      correo: "",
    },
  });

  const vendorMutationConfig = {
    mutationFn: createVendedor,
    queryKey: ["vendedores"],
    successMessage: "Vendedor creado exitosamente",
    successDescription: "El vendedor ha sido registrado en el sistema.",
    errorTitle: "Error al crear vendedor",
    onSuccess: () => {
      onOpenChange(false);
      form.reset();
    },
  } as const;
  const createMutation = useCreateEntityMutation<
    Parameters<typeof createVendedor>[0],
    Awaited<ReturnType<typeof createVendedor>>
  >(vendorMutationConfig);

  function onSubmit(data: FormValues) {
    createMutation.mutate(data);
  }

  const vendorFieldsContent = renderFormFields(
    form.control,
    vendedorFields,
    createMutation.isPending
  );
  const dialogConfig = useInlineEntityFormDialogConfig<FormValues>({
    open,
    onOpenChange,
    form,
    onSubmit,
    isSubmitting: createMutation.isPending,
    formClassName: "space-y-4",
  });

  return (
    <EntityFormDialog<FormValues> {...dialogConfig} title="Crear vendedor">
      {vendorFieldsContent}
    </EntityFormDialog>
  );
}
