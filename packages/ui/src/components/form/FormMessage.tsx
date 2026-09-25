import { cn } from "../../lib/utils"
import { useFormFieldContext } from "./FormField"

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function FormMessage({ className, children, ...props }: FormMessageProps) {
  const { error, formMessageId } = useFormFieldContext()
  const message = error ? String(error.message ?? "") : children

  if (!message) return null

  return (
    <p
      id={formMessageId}
      className={cn("text-sm font-medium text-semantic-danger", className)}
      {...props}
    >
      {message}
    </p>
  )
}
