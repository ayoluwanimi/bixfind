import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "font-body text-sm shadow-lg",
          title: "text-sm font-semibold",
          description: "text-xs text-fg-muted",
        },
      }}
    />
  )
}
