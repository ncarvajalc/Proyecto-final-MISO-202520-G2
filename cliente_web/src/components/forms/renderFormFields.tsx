import type { Control, FieldPath, FieldValues } from "react-hook-form";

import { FormInputField } from "@/components/forms/FormInputField";

export interface FieldDefinition<TFormValues extends FieldValues> {
  name: FieldPath<TFormValues>;
  label: string;
  placeholder?: string;
  type?: string;
}

export const renderFormFields = <TFormValues extends FieldValues,>(
  control: Control<TFormValues>,
  fields: Array<FieldDefinition<TFormValues>>,
  disabled: boolean
) =>
  fields.map(({ name, label, placeholder, type }) => (
    <FormInputField
      key={name as string}
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      type={type}
      disabled={disabled}
    />
  ));
