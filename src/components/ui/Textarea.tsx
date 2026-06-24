import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, className, id, ...props },
  ref,
) {
  const taId = id || props.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={taId} className="text-xs font-medium text-muted">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={taId}
        className={cn(
          'min-h-[80px] rounded-md border border-line-dark bg-ink-soft px-3 py-2 text-sm text-ink-text placeholder:text-muted/60',
          'focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40',
          className,
        )}
        {...props}
      />
    </div>
  )
})