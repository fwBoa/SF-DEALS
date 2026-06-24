import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { CalendarClock, GripVertical } from 'lucide-react'
import type { OpportuniteWithRelations } from '@/lib/types'
import { countryName } from '@/config/countries'
import { formatMoney } from '@/config/currencies'
import { cn } from '@/lib/cn'

interface KanbanCardProps {
  opp: OpportuniteWithRelations
  isOverlay?: boolean
}

export function KanbanCard({ opp, isOverlay }: KanbanCardProps) {
  const { i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opp.id,
    data: { type: 'card', stage: opp.etape_pipeline },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const overdue =
    opp.date_prochaine_action && new Date(opp.date_prochaine_action) < new Date(new Date().toDateString())

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-lg border border-line-dark bg-ink p-3 shadow-sm',
        isDragging && 'opacity-40',
        isOverlay && 'shadow-xl ring-1 ring-gold/40',
      )}
    >
      <div className="flex items-start gap-1.5">
        <button
          className="mt-0.5 cursor-grab text-muted hover:text-gold active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Déplacer"
        >
          <GripVertical size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-text">{opp.intitule || opp.entreprise?.nom || '—'}</p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {opp.entreprise?.nom} · {countryName(opp.entreprise?.pays, lang)}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {opp.valeur_estimee != null ? (
          <span className="text-xs font-semibold text-gold">{formatMoney(opp.valeur_estimee, opp.devise)}</span>
        ) : (
          <span />
        )}
        {opp.date_prochaine_action && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs',
              overdue ? 'text-red-400' : 'text-muted',
            )}
          >
            <CalendarClock size={12} />
            {opp.date_prochaine_action}
          </span>
        )}
      </div>
    </div>
  )
}