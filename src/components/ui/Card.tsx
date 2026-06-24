import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line-dark bg-ink-soft p-5',
        className,
      )}
      {...props}
    />
  )
}