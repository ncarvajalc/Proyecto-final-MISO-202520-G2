import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { createVendedor } from "@/services/vendedores.service";

// Zod schema for validation
const formSchema = z.object({
  id: z.string().min(1, {
    message: "El ID es requerido.",
  }),
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
      id: "",
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
            {/* ID */}
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VND-001"
                      {...field}
                      disabled={createMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nombre */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre del vendedor"
                      {...field}
                      disabled={createMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="correo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email"
                      {...field}
                      disabled={createMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
