import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { createVendedor } from "@/services/vendedores.service";
import { FormActionButtons } from "@/components/forms/FormActionButtons";
import { FormInputField } from "@/components/forms/FormInputField";

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

export function CreateVendedorForm({
  open,
  onOpenChange,
}: CreateVendedorFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      correo: "",
    },
  });

  // Mutation for creating vendedor
  const createMutation = useMutation({
    mutationFn: createVendedor,
    onSuccess: () => {
      // Invalidate and refetch vendedores query
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });

      toast.success("Vendedor creado exitosamente", {
        description: "El vendedor ha sido registrado en el sistema.",
      });

      // Close dialog and reset form
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error & { detail?: string }) => {
      toast.error("Error al crear vendedor", {
        description: error.detail || "Ocurrió un error al crear el vendedor.",
      });
    },
  });

  function onSubmit(data: FormValues) {
    createMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Crear vendedor
          </DialogTitle>
        </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormInputField
                control={form.control}
                name="nombre"
                label="Nombre"
                placeholder="Nombre del vendedor"
                disabled={createMutation.isPending}
              />

              <FormInputField
                control={form.control}
                name="correo"
                label="Email"
                type="email"
                placeholder="Email"
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
