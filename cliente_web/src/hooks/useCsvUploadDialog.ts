import { useCallback, useState } from "react";

import { toast } from "sonner";

const CSV_EXTENSION = ".csv";

export interface CsvUploadDialogConfig {
  onClose: (open: boolean) => void;
  templateContent: string;
  templateFileName: string;
  templateToastMessage?: string;
}

export const useCsvUploadDialog = ({
  onClose,
  templateContent,
  templateFileName,
  templateToastMessage = "Revisa tu carpeta de descargas",
}: CsvUploadDialogConfig) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetSelection = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      if (!file.name.toLowerCase().endsWith(CSV_EXTENSION)) {
        toast.error("Archivo inválido", {
          description: "Solo se permiten archivos CSV",
        });
        event.target.value = "";
        return;
      }

      setSelectedFile(file);
    },
    []
  );

  const handleDownloadTemplate = useCallback(() => {
    const blob = new Blob([templateContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = templateFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Plantilla descargada", {
      description: templateToastMessage,
    });
  }, [templateContent, templateFileName, templateToastMessage]);

  const closeDialog = useCallback(
    (resetMutation?: () => void) => {
      resetSelection();
      resetMutation?.();
      onClose(false);
    },
    [onClose, resetSelection]
  );

  return {
    selectedFile,
    setSelectedFile,
    handleFileChange,
    handleDownloadTemplate,
    resetSelection,
    closeDialog,
  };
};

