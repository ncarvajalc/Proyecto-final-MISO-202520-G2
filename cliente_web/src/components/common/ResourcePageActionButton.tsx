import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface ResourcePageActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}

export const ResourcePageActionButton = ({
  onClick,
  icon,
  children,
}: ResourcePageActionButtonProps) => (
  <Button onClick={onClick}>
    {icon}
    {children}
  </Button>
);
