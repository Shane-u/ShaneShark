import { clsx, type ClassValue } from 'clsx'

/**
 * Tailwind-safe class name merger.
 * Wraps clsx so we can align with shadcn/ui expectations without pulling an extra dependency.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

