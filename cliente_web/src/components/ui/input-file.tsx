import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InputFileProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
}

export function InputFile({
  label,
  id,
  containerClassName,
  className,
  ...props
}: InputFileProps) {
  return (
    <div className={cn("grid w-full items-center gap-3", containerClassName)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input id={id} type="file" className={className} {...props} />
    </div>
  );
}
