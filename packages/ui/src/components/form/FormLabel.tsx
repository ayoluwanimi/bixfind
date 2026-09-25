import { cn } from "../../lib/utils"
import { Label } from "../label/Label"
import { useFormFieldContext } from "./FormField"

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function FormLabel({ className, ...props }: FormLabelProps) {
  const { error, formItemId } = useFormFieldContext()

  return (
    <Label
      className={cn(error && "text-semantic-danger", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}
