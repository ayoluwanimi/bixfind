import { cn } from "../../lib/utils"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

export function Separator({ className, orientation = "horizontal", decorative, ...props }: SeparatorProps) {
  const semanticProps = decorative ? { role: "none" as const } : { role: "separator" as const, "aria-orientation": orientation }

  return (
    <div
      className={cn(
        "shrink-0 bg-bg-dark/10",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...semanticProps}
      {...props}
    />
  )
}
