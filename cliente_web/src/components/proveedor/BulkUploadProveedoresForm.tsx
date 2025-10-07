import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { bulkUploadProveedores } from "@/services/proveedores.service";
import { Button } from "@/components/ui/button";
import { InputFile } from "@/components/ui/input-file";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BulkUploadProveedoresFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkUploadProveedoresForm({
  open,
  onOpenChange,
}: BulkUploadProveedoresFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: bulkUploadProveedores,
    onSuccess: (data) => {
      toast.success("Carga masiva exitosa", {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      setSelectedFile(null);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Error en carga masiva", {
        description: error.message,
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // Validate CSV file type
      if (!file.name.endsWith(".csv")) {
        toast.error("Archivo inválido", {
          description: "Solo se permiten archivos CSV",
        });
        e.target.value = ""; // Reset input
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV content
    const csvContent = `nombre,idTax,direccion,telefono,correo,contacto,estado,certificadoNombre,certificadoCuerpo,certificadoFechaCertificacion,certificadoFechaVencimiento,certificadoUrl
Farmacéutica Ejemplo S.A.,900123456-1,Calle 123 #45-67,+57 1 234 5678,contacto@ejemplo.com,Juan Pérez,Activo,ISO 9001,ICONTEC,2024-01-15,2025-01-15,https://ejemplo.com/cert.pdf
Distribuidora Demo Ltda.,800234567-2,Carrera 45 #12-34,+57 4 345 6789,ventas@demo.com,María García,Activo,,,,,`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = "plantilla_proveedores.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Plantilla descargada", {
      description: "Revisa tu carpeta de descargas",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Selecciona un archivo", {
        description: "Debes seleccionar un archivo CSV para cargar",
      });
      return;
    }

    uploadMutation.mutate(selectedFile);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Carga masiva proveedores</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <p className="text-sm text-muted-foreground">
            Cargue un archivo csv con la información de los proveedores que
            desee cargar. Descargue la plantilla y súbala con los datos llenos.
          </p>

          {/* Step 1: Download Template */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">1. Descargar plantilla</h3>
            <Button
              type="button"
              variant="darker"
              onClick={handleDownloadTemplate}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Descargar plantilla
            </Button>
          </div>

          {/* Step 2: Upload File */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-base font-semibold">2. Subir plantilla</h3>
              <InputFile
                id="csv-file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploadMutation.isPending}
                containerClassName="max-w-full"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado:{" "}
                  <span className="font-medium">{selectedFile.name}</span>
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={uploadMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={uploadMutation.isPending || !selectedFile}
              >
                {uploadMutation.isPending ? "Cargando..." : "Crear"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
