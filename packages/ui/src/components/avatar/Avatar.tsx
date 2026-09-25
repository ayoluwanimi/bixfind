import { useState } from "react"
import { cn } from "../../lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
}

export function Avatar({ className, size = "md", ...props }: AvatarProps) {
  return (
    <div
      className={cn("relative flex shrink-0 overflow-hidden rounded-full", sizeClasses[size], className)}
      {...props}
    />
  )
}

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export function AvatarImage({ className, onError, ...props }: AvatarImageProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) return null

  return (
    <img
      className={cn("aspect-square h-full w-full object-cover", className)}
      onError={(e) => { setHasError(true); onError?.(e) }}
      {...props}
    />
  )
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-brand-50 text-sm font-medium text-brand-500",
        className
      )}
      {...props}
    />
  )
}
