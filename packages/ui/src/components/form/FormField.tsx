import { createContext, useContext, type HTMLAttributes, type ReactNode } from "react"
import type { FieldPath, FieldValues, ControllerRenderProps } from "react-hook-form"
import { useFormContext, Controller } from "react-hook-form"

type FormFieldContextValue<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = {
  name: TName
  field: ControllerRenderProps<TFieldValues, TName>
}

const FormFieldContext = createContext<FormFieldContextValue | undefined>(undefined)

export interface FormFieldProps<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> {
  name: TName
  render: (field: ControllerRenderProps<TFieldValues, TName>) => ReactNode
}

export function FormField<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({
  name,
  render,
}: FormFieldProps<TFieldValues, TName>) {
  const form = useFormContext<TFieldValues>()

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => {
        return (
          <FormFieldContext.Provider value={{ name: name as any, field: field as any }}>
            <FormItemContext.Provider value={{ name: name as any }}>
              {render(field as any)}
            </FormItemContext.Provider>
          </FormFieldContext.Provider>
        )
      }}
    />
  )
}

export { FormFieldContext }

type FormItemContextValue = { name: string; id?: string }

const FormItemContext = createContext<FormItemContextValue>({ name: "" })

export function useFormFieldContext() {
  const fieldContext = useContext(FormFieldContext)
  const itemContext = useContext(FormItemContext)
  const formContext = useFormContext()
  if (!fieldContext) throw new Error("useFormFieldContext should be used within <FormField>")

  const id = itemContext.id || `${fieldContext.name}-${Math.random().toString(36).slice(2, 9)}`
  const error = formContext.formState.errors?.[fieldContext.name]
  const fieldState = formContext.getFieldState(fieldContext.name)

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error,
    fieldState,
    field: fieldContext.field,
  }
}

export { FormItemContext }
