import { toast as sonnerToast } from "sonner"
import type { ExternalToast } from "sonner"

export function toast(message: string, data?: ExternalToast) {
  return sonnerToast(message, {
    ...data,
    className: "font-body text-sm",
  })
}

toast.success = (message: string, data?: ExternalToast) => sonnerToast.success(message, data)
toast.error = (message: string, data?: ExternalToast) => sonnerToast.error(message, data)
toast.info = (message: string, data?: ExternalToast) => sonnerToast.info(message, data)
toast.warning = (message: string, data?: ExternalToast) => sonnerToast.warning(message, data)
toast.dismiss = (id?: string | number) => sonnerToast.dismiss(id)
toast.promise = sonnerToast.promise

export type { ExternalToast }
