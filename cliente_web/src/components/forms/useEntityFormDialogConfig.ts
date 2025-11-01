import { useCallback, useMemo } from "react";
import type { FieldValues, SubmitHandler, UseFormReturn } from "react-hook-form";

import type { EntityFormDialogProps } from "./EntityFormDialog";

interface UseEntityFormDialogConfigParams<TFormValues extends FieldValues>
  extends Pick<
    EntityFormDialogProps<TFormValues>,
    "open" | "onOpenChange" | "isSubmitting" | "formClassName"
  > {
  form: UseFormReturn<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
  onCancel?: () => void;
  actionLayout?: EntityFormDialogProps<TFormValues>["actionLayout"];
  submitFirst?: EntityFormDialogProps<TFormValues>["submitFirst"];
}

export const useEntityFormDialogConfig = <TFormValues extends FieldValues,>({
  open,
  onOpenChange,
  form,
  onSubmit,
  isSubmitting,
  onCancel,
  actionLayout = "inline",
  submitFirst,
  formClassName,
}: UseEntityFormDialogConfigParams<TFormValues>) => {
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
      return;
    }

    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  return useMemo(
    () => ({
      open,
      onOpenChange,
      form,
      onSubmit,
      isSubmitting,
      onCancel: handleCancel,
      actionLayout,
      ...(submitFirst !== undefined ? { submitFirst } : {}),
      ...(formClassName ? { formClassName } : {}),
    }),
    [
      actionLayout,
      form,
      formClassName,
      handleCancel,
      isSubmitting,
      onOpenChange,
      onSubmit,
      open,
      submitFirst,
    ]
  );
};

export const useInlineEntityFormDialogConfig = <TFormValues extends FieldValues,>(
  params: Omit<UseEntityFormDialogConfigParams<TFormValues>, "actionLayout">
) =>
  useEntityFormDialogConfig<TFormValues>({
    ...params,
    actionLayout: "inline",
  });
