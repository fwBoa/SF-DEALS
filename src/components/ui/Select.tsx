import { type SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, className, id, children, ...props },
  ref,
) {
  const selectId = id || props.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-muted">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'rounded-md border border-line-dark bg-ink-soft px-3 py-2 text-sm text-ink-text',
          'focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
})