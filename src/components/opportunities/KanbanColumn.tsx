import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTranslation } from 'react-i18next'
import type { OpportuniteWithRelations } from '@/lib/types'
import type { Stage } from '@/config/pipeline'
import { STAGE_BY_ID } from '@/config/pipeline'
import { cn } from '@/lib/cn'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
  stage: Stage
  opps: OpportuniteWithRelations[]
}

export function KanbanColumn({ stage, opps }: KanbanColumnProps) {
  const { i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const { setNodeRef, isOver } = useDroppable({ id: stage.id, data: { type: 'column', stage: stage.id } })

  const totalEur = opps.reduce((s, o) => s + (o.valeur_estimee ?? 0), 0)

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-semibold text-ink-text">
            {lang === 'fr' ? stage.label_fr : stage.label_en}
          </span>
          <span className="text-xs text-muted">{opps.length}</span>
        </div>
        {opps.length > 0 && (
          <span className="text-xs text-muted">{totalEur.toLocaleString('fr-FR')}</span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[120px] flex-1 flex-col gap-2 rounded-lg border border-line-dark/60 bg-ink-soft/40 p-2 transition',
          isOver && 'border-gold/50 bg-ink-soft',
        )}
      >
        <SortableContext items={opps.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          {opps.map((o) => (
            <KanbanCard key={o.id} opp={o} />
          ))}
        </SortableContext>
        {opps.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-line-dark/50 py-6 text-xs text-muted">
            —
          </div>
        )}
      </div>
    </div>
  )
}

export function stageColor(id: string): string {
  return STAGE_BY_ID[id as keyof typeof STAGE_BY_ID]?.color ?? '#8a8275'
}