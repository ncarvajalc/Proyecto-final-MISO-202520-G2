import type { ReactNode } from "react";
import type { FieldValues, SubmitHandler, UseFormReturn } from "react-hook-form";

import { Form } from "@/components/ui/form";
import { FormDialog } from "@/components/forms/FormDialog";
import { FormActionButtons } from "@/components/forms/FormActionButtons";

export interface EntityFormDialogProps<TFormValues extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  descriptionId?: string;
  descriptionClassName?: string;
  contentClassName?: string;
  form: UseFormReturn<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
  children: ReactNode;
  isSubmitting: boolean;
  onCancel: () => void;
  actionLayout?: "dialog" | "inline";
  submitFirst?: boolean;
  formClassName?: string;
}

export const EntityFormDialog = <TFormValues extends FieldValues,>({
  open,
  onOpenChange,
  title,
  description,
  descriptionId,
  descriptionClassName,
  contentClassName,
  form,
  onSubmit,
  children,
  isSubmitting,
  onCancel,
  actionLayout = "dialog",
  submitFirst = true,
  formClassName = "space-y-6",
}: EntityFormDialogProps<TFormValues>) => (
  <FormDialog
    open={open}
    onOpenChange={onOpenChange}
    title={title}
    description={description}
    descriptionId={descriptionId}
    descriptionClassName={descriptionClassName}
    contentClassName={contentClassName}
  >
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={formClassName}>
        {children}
        <FormActionButtons
          layout={actionLayout}
          submitFirst={submitFirst}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
        />
      </form>
    </Form>
  </FormDialog>
);
