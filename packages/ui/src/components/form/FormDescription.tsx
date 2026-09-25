import { cn } from "../../lib/utils"
import { useFormFieldContext } from "./FormField"

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function FormDescription({ className, ...props }: FormDescriptionProps) {
  const { formDescriptionId } = useFormFieldContext()

  return (
    <p
      id={formDescriptionId}
      className={cn("text-sm text-fg-muted", className)}
      {...props}
    />
  )
}
