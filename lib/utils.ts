// The standard shadcn/ui class helper. Not ours, and not worth expanding.
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** clsx joins the classes, tailwind-merge drops the earlier of any two that set the same property. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
