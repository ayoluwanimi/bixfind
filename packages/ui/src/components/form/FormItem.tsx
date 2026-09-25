import { useId } from "react"
import { cn } from "../../lib/utils"
import { FormItemContext } from "./FormField"

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function FormItem({ className, ...props }: FormItemProps) {
  const id = useId()

  return (
    <FormItemContext.Provider value={{ name: "", id }}>
      <div className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
}
