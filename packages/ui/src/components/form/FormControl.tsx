import { useFormFieldContext } from "./FormField"
import type { HTMLAttributes } from "react"

export interface FormControlProps extends HTMLAttributes<HTMLDivElement> {}

export function FormControl({ ...props }: FormControlProps) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormFieldContext()

  return (
    <div
      id={formItemId}
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={!!error}
      data-invalid={!!error}
      {...props}
    />
  )
}
