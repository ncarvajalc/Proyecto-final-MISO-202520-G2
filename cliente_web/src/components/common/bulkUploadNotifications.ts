import { toast } from "sonner";

export const showBulkUploadError = (error: Error & { detail?: string }) => {
  toast.error("Error en carga masiva", {
    description: error.detail ?? error.message ?? "Error inesperado",
  });
};
