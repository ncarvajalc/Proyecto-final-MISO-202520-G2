import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { bulkUploadProductos } from "@/services/productos.service";
import { Button } from "@/components/ui/button";
import { InputFile } from "@/components/ui/input-file";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BulkUploadProductosFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkUploadProductosForm({
  open,
  onOpenChange,
}: BulkUploadProductosFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: bulkUploadProductos,
    onSuccess: (data) => {
      toast.success("Carga masiva exitosa", {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      setSelectedFile(null);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Error en carga masiva", {
        description: error.detail,
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
    // Create CSV content with simple structure
    const csvContent = `sku,nombre,descripcion,precio,especificaciones,urlManual,urlHojaInstalacion,certificaciones
MED-001,Paracetamol 500mg,Analgésico y antipirético,5000,"[{""nombre"":""Presentación"",""valor"":""Caja x 20""}]",https://ejemplo.com/manual.pdf,https://ejemplo.com/instalacion.pdf,"INVIMA,FDA"
MED-002,Ibuprofeno 400mg,Antiinflamatorio,8500,"[{""nombre"":""Presentación"",""valor"":""Caja x 30""}]",,,INVIMA`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = "plantilla_productos.csv";
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
          <DialogTitle>Carga masiva productos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <p className="text-sm text-muted-foreground">
            Cargue un archivo csv con la información de los productos que desee
            cargar. Descargue la plantilla y súbala con los datos llenos.
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
