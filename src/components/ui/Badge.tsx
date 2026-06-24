import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface BadgeProps {
  children: ReactNode
  color?: string
  className?: string
}

export function Badge({ children, color, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        className,
      )}
      style={
        color
          ? { borderColor: `${color}55`, color, backgroundColor: `${color}14` }
          : undefined
      }
    >
      {children}
    </span>
  )
}