import { useTranslation } from 'react-i18next'
import { useOpportunities } from '@/hooks/useOpportunities'
import type { Filters } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { KanbanSquare } from 'lucide-react'
import { KanbanBoard } from '@/components/opportunities/KanbanBoard'

const empty: Filters = { search: '', pays: '', secteur: '', segment: '', ecobank: '' }

export function Pipeline() {
  const { t } = useTranslation()
  const { data, loading, moveStage } = useOpportunities(empty)

  return (
    <div className="p-6">
      <PageHeader title={t('pipeline.title')} subtitle={t('pipeline.subtitle')} />
      {loading ? (
        <Card className="flex justify-center py-16"><Spinner size={28} /></Card>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<KanbanSquare size={32} />}
            title={t('common.empty')}
            description={t('opportunite.new')}
          />
        </Card>
      ) : (
        <KanbanBoard data={data} onMove={moveStage} />
      )}
    </div>
  )
}