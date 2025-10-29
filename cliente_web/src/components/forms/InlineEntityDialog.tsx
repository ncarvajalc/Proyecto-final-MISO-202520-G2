import type { ReactNode } from "react";
import type { FieldValues, SubmitHandler, UseFormReturn } from "react-hook-form";

import { EntityFormDialog } from "./EntityFormDialog";
import { useInlineEntityFormDialogConfig } from "./useEntityFormDialogConfig";

interface InlineEntityDialogProps<TFormValues extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
  isSubmitting: boolean;
  formClassName?: string;
  children: ReactNode;
  title: string;
  contentClassName?: string;
  description?: string;
  descriptionId?: string;
  descriptionClassName?: string;
  onCancel?: () => void;
  submitFirst?: boolean;
}

export const InlineEntityDialog = <TFormValues extends FieldValues,>({
  open,
  onOpenChange,
  form,
  onSubmit,
  isSubmitting,
  formClassName,
  children,
  title,
  contentClassName,
  description,
  descriptionId,
  descriptionClassName,
  onCancel,
  submitFirst,
}: InlineEntityDialogProps<TFormValues>) => {
  const dialogConfig = useInlineEntityFormDialogConfig<TFormValues>({
    open,
    onOpenChange,
    form,
    onSubmit,
    isSubmitting,
    formClassName,
    onCancel,
    submitFirst,
  });

  return (
    <EntityFormDialog<TFormValues>
      {...dialogConfig}
      title={title}
      contentClassName={contentClassName}
      description={description}
      descriptionId={descriptionId}
      descriptionClassName={descriptionClassName}
    >
      {children}
    </EntityFormDialog>
  );
};
