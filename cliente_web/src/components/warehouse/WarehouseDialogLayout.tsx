import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  WarehouseDialogActions,
  type WarehouseDialogActionsProps,
} from "./shared";

export interface WarehouseDialogStep {
  title: string;
  content: ReactNode;
}

export interface WarehouseDialogLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  steps: WarehouseDialogStep[];
  result?: ReactNode;
  actions: WarehouseDialogActionsProps;
}

export function WarehouseDialogLayout({
  open,
  onOpenChange,
  title,
  description,
  steps,
  result,
  actions,
}: WarehouseDialogLayoutProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {steps.map((step, index) => (
            <div key={step.title} className={index > 0 ? "mt-6" : undefined}>
              <p className="mb-3 text-sm font-medium">
                {index + 1}. {step.title}
              </p>
              {step.content}
            </div>
          ))}

          {result}
        </div>

        <WarehouseDialogActions {...actions} />
      </DialogContent>
    </Dialog>
  );
}
