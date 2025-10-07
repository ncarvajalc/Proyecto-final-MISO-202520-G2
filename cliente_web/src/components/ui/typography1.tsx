import * as React from "react";
import { cn } from "@/lib/utils";

interface Typography1Props {
  children: React.ReactNode;
  className?: string;
}

function Typography1({ children, className }: Typography1Props) {
  return (
    <h1 className={cn("text-3xl text-primary font-bold mb-8", className)}>
      {children}
    </h1>
  );
}

export { Typography1 };
