import { type ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  accent?: string
  subtitle?: string
  actions?: ReactNode
}

/** En-tête de page : titre Lora avec mot d'accent italique doré optionnel. */
export function PageHeader({ title, accent, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl text-ink-text">
          {title} {accent && <span className="accent-italic">{accent}</span>}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}