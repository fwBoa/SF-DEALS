import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { LANGS, type Lang } from '@/i18n'

export function LanguageToggle() {
  const { i18n } = useTranslation()
  const current = (i18n.resolvedLanguage as Lang) ?? 'fr'

  return (
    <div className="flex items-center rounded-md border border-line-dark text-xs">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => i18n.changeLanguage(l)}
          className={cn(
            'px-2.5 py-1 uppercase transition',
            current === l ? 'bg-gold text-ink' : 'text-muted hover:text-ink-text',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}