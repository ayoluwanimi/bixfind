import { createContext, useContext, useId, type HTMLAttributes } from "react"
import type { FieldValues, UseFormReturn } from "react-hook-form"

type FormContextValue<TFieldValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TFieldValues>
}

const FormContext = createContext<FormContextValue | undefined>(undefined)

export interface FormProps<TFieldValues extends FieldValues> extends HTMLAttributes<HTMLFormElement> {
  form: UseFormReturn<TFieldValues>
  onSubmit?: (values: TFieldValues) => void
}

export function Form<TFieldValues extends FieldValues>({ form, onSubmit, children, ...props }: FormProps<TFieldValues>) {
  return (
    <FormContext.Provider value={{ form }}>
      <form onSubmit={onSubmit ? form.handleSubmit(onSubmit) : undefined} {...props}>
        {children}
      </form>
    </FormContext.Provider>
  )
}

export function useFormField() {
  const context = useContext(FormContext)
  if (!context) throw new Error("useFormField must be used within a Form")
  return context
}

export { FormContext }
