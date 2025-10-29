import type { ReactNode } from "react";

import { Typography1 } from "@/components/ui/typography1";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, actions }: PageHeaderProps) => (
  <div className="flex flex-col items-center justify-center gap-4">
    <Typography1 className="mb-0">{title}</Typography1>
    {actions ? <div className="flex gap-3">{actions}</div> : null}
  </div>
);

interface PageStateMessageProps {
  message: string;
  variant?: "muted" | "error";
}

export const PageStateMessage = ({
  message,
  variant = "muted",
}: PageStateMessageProps) => (
  <div className="flex h-full items-center justify-center">
    <p
      className={
        variant === "error" ? "text-destructive" : "text-muted-foreground"
      }
    >
      {message}
    </p>
  </div>
);

