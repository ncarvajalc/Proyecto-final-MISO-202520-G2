import type { ReactNode } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CsvUploadDialogForm } from "@/components/common/CsvUploadDialog";
import { useCsvUploadDialog } from "@/hooks/useCsvUploadDialog";

interface BulkUploadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BulkUploadSuccessParams<TData> {
  data: TData;
  queryClient: ReturnType<typeof useQueryClient>;
  resetSelection: () => void;
  closeDialog: (afterClose?: () => void) => void;
  onOpenChange: (open: boolean) => void;
}

interface BulkUploadConfig<TData, TError extends Error> {
  title: string;
  description: ReactNode;
  templateContent: string;
  templateFileName: string;
  upload: (file: File) => Promise<TData>;
  onSuccess: (params: BulkUploadSuccessParams<TData>) => void;
  onError: (error: TError) => void;
  context?: string;
  queryKey: string;
}

export const createCsvBulkUploadForm = <
  TData,
  TError extends Error & { detail?: string } = Error,
>(config: BulkUploadConfig<TData, TError>) => {
  const {
    title,
    description,
    templateContent,
    templateFileName,
    upload,
    onSuccess,
    onError,
    context,
    queryKey,
  } = config;

  return function CsvBulkUploadForm({
    open,
    onOpenChange,
  }: BulkUploadFormProps) {
    const queryClient = useQueryClient();

    const {
      selectedFile,
      handleFileChange,
      handleDownloadTemplate,
      resetSelection,
      closeDialog,
    } = useCsvUploadDialog({
      onClose: onOpenChange,
      templateContent,
      templateFileName,
    });

    const uploadMutation = useMutation<TData, TError, File>({
      mutationFn: upload,
      onSuccess: (data) => {
        onSuccess({
          data,
          queryClient,
          resetSelection,
          closeDialog,
          onOpenChange,
        });
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        resetSelection();
        onOpenChange(false);
      },
      onError,
    });

    const dialogProps = {
      open,
      onOpenChange,
      onDownloadTemplate: handleDownloadTemplate,
      onSubmitFile: uploadMutation.mutate,
      onCancelDialog: () => closeDialog(() => uploadMutation.reset()),
      onFileChange: handleFileChange,
      selectedFile,
      isSubmitting: uploadMutation.isPending,
      title,
      description,
      context,
    };

    return <CsvUploadDialogForm {...dialogProps} />;
  };
};

