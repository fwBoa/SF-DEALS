import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AlertCircle, CalendarClock, Bell } from 'lucide-react'
import { useReminders, type Reminder } from '@/hooks/useReminders'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { countryName } from '@/config/countries'
import { stageLabel } from '@/config/pipeline'
import { formatMoney } from '@/config/currencies'
import { cn } from '@/lib/cn'

function ReminderRow({ r, lang }: { r: Reminder; lang: 'fr' | 'en' }) {
  const { t } = useTranslation()
  const label = r.overdue
    ? t('rappels.days_ago', { count: Math.abs(r.daysLeft) })
    : t('rappels.days_in', { count: r.daysLeft })

  return (
    <Link
      to={`/opportunites/${r.id}`}
      className="flex items-center gap-3 rounded-lg border border-line-dark/60 bg-ink p-3 transition hover:border-gold/50"
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          r.overdue ? 'bg-red-500/15 text-red-400' : 'bg-gold/10 text-gold',
        )}
      >
        {r.overdue ? <AlertCircle size={16} /> : <CalendarClock size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-text">
          {r.intitule || r.entreprise?.nom || '—'}
        </p>
        <p className="truncate text-xs text-muted">
          {r.entreprise?.nom} · {countryName(r.entreprise?.pays, lang)} ·{' '}
          {stageLabel(r.etape_pipeline, lang)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            'text-xs font-semibold',
            r.overdue ? 'text-red-400' : 'text-muted',
          )}
        >
          {r.date_prochaine_action} · {label}
        </span>
        {r.valeur_estimee != null && (
          <span className="text-xs text-gold">{formatMoney(r.valeur_estimee, r.devise)}</span>
        )}
      </div>
    </Link>
  )
}

function Section({
  title,
  count,
  items,
  lang,
  accent,
}: {
  title: string
  count: number
  items: Reminder[]
  lang: 'fr' | 'en'
  accent?: 'red' | 'gold'
}) {
  if (items.length === 0) return null
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h2
          className={cn(
            'font-serif text-base',
            accent === 'red' ? 'text-red-400' : 'text-ink-text',
          )}
        >
          {title}
        </h2>
        <Badge color={accent === 'red' ? '#f87171' : '#c9a44d'}>{count}</Badge>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((r) => (
          <ReminderRow key={r.id} r={r} lang={lang} />
        ))}
      </div>
    </div>
  )
}

export function Rappels() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const { overdue, upcoming, loading } = useReminders(14)

  return (
    <div className="p-6">
      <PageHeader title={t('rappels.title')} subtitle={t('rappels.subtitle')} accent="—" />

      {loading ? (
        <Card className="flex justify-center py-16"><Spinner size={28} /></Card>
      ) : overdue.length === 0 && upcoming.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bell size={32} />}
            title={t('rappels.no_actions')}
            description={t('rappels.subtitle')}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Section
            title={t('rappels.overdue')}
            count={overdue.length}
            items={overdue}
            lang={lang}
            accent="red"
          />
          <Section
            title={t('rappels.upcoming')}
            count={upcoming.length}
            items={upcoming}
            lang={lang}
            accent="gold"
          />
        </div>
      )}
    </div>
  )
}