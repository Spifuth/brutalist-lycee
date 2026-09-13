// Vendored shadcn/ui primitive -- overwritten on the next shadcn update.
// Do not restyle here; colour and shape live in globals.css -- see STYLE.md
// §4 for the colour tokens, §1-2 for radius and borders.
import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
