import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FormActionButtonsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  submitLabel?: string;
  submittingLabel?: string;
  cancelLabel?: string;
  layout?: "dialog" | "inline";
  className?: string;
  submitDisabled?: boolean;
  cancelDisabled?: boolean;
  submitFirst?: boolean;
}

export const FormActionButtons = ({
  isSubmitting,
  onCancel,
  submitLabel = "Crear",
  submittingLabel = "Creando...",
  cancelLabel = "Cancelar",
  layout = "dialog",
  className,
  submitDisabled = false,
  cancelDisabled = false,
  submitFirst = true,
}: FormActionButtonsProps) => {
  const primaryButton = (
    <Button type="submit" disabled={isSubmitting || submitDisabled}>
      {isSubmitting ? submittingLabel : submitLabel}
    </Button>
  );

  const secondaryButton = (
    <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      disabled={isSubmitting || cancelDisabled}
    >
      {cancelLabel}
    </Button>
  );

  const buttons = submitFirst ? (
    <>
      {primaryButton}
      {secondaryButton}
    </>
  ) : (
    <>
      {secondaryButton}
      {primaryButton}
    </>
  );

  if (layout === "inline") {
    return (
      <div className={cn("flex justify-end gap-3 pt-4", className)}>
        {buttons}
      </div>
    );
  }

  return <DialogFooter className={cn("gap-2", className)}>{buttons}</DialogFooter>;
};

