import { useCallback } from "react";
import type { ReactNode } from "react";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputFile } from "@/components/ui/input-file";
import { toast } from "sonner";

export interface CsvUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onDownloadTemplate: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
  isSubmitting: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  downloadLabel?: string;
  context?: string;
}

export const CsvUploadDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onDownloadTemplate,
  onSubmit,
  onCancel,
  onFileChange,
  selectedFile,
  isSubmitting,
  submitLabel = "Crear",
  submittingLabel = "Cargando...",
  downloadLabel = "Descargar plantilla",
}: CsvUploadDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">{description}</p>

        <div className="space-y-3">
          <h3 className="text-base font-semibold">1. Descargar plantilla</h3>
          <Button
            type="button"
            variant="darker"
            onClick={onDownloadTemplate}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            {downloadLabel}
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-base font-semibold">2. Subir plantilla</h3>
            <InputFile
              id="csv-file"
              accept={CSV_EXTENSION}
              onChange={onFileChange}
              disabled={isSubmitting}
              containerClassName="max-w-full"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Archivo seleccionado: {" "}
                <span className="font-medium">{selectedFile.name}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedFile}>
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </DialogContent>
  </Dialog>
);

const CSV_EXTENSION = ".csv";

interface CsvUploadDialogFormProps
  extends Omit<CsvUploadDialogProps, "onSubmit" | "onCancel"> {
  onSubmitFile: (file: File) => void;
  onCancelDialog: () => void;
  missingFileTitle?: string;
  missingFileDescription?: string;
}

export const CsvUploadDialogForm = ({
  onSubmitFile,
  onCancelDialog,
  missingFileTitle = "Selecciona un archivo",
  missingFileDescription = "Debes seleccionar un archivo CSV para cargar",
  ...dialogProps
}: CsvUploadDialogFormProps) => {
  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!dialogProps.selectedFile) {
        toast.error(missingFileTitle, {
          description: missingFileDescription,
        });
        return;
      }

      onSubmitFile(dialogProps.selectedFile);
    },
    [dialogProps.selectedFile, missingFileDescription, missingFileTitle, onSubmitFile]
  );

  const handleCancel = useCallback(() => {
    onCancelDialog();
  }, [onCancelDialog]);

  return (
    <CsvUploadDialog
      {...dialogProps}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};

