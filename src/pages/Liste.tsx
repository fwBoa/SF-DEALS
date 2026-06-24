import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Download } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useOpportunities } from '@/hooks/useOpportunities'
import { useEntreprises } from '@/hooks/useEntreprises'
import type { Opportunite, OpportuniteWithRelations, Filters } from '@/lib/types'
import { countryName } from '@/config/countries'
import { stageLabel, STAGE_BY_ID } from '@/config/pipeline'
import { segmentLabel } from '@/config/segments'
import { sourceLabel } from '@/config/sources'
import { formatMoney } from '@/config/currencies'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FilterBar, emptyFilters } from '@/components/filters/FilterBar'
import { OpportuniteForm } from '@/components/opportunities/OpportuniteForm'
import { exportCsv, timestampSlug } from '@/lib/csv'
import { useToast } from '@/lib/toast'

export function Liste() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const { teamId } = useAuth()
  const toast = useToast()
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const { data, loading, create, update, remove } = useOpportunities(filters)
  const { data: entreprises } = useEntreprises(emptyFilters)

  function handleExport() {
    exportCsv(
      data,
      [
        { header: t('opportunite.intitule'), value: (o) => o.intitule ?? '' },
        { header: t('opportunite.entreprise'), value: (o) => o.entreprise?.nom ?? '' },
        { header: t('opportunite.entreprise') + ' — pays', value: (o) => countryName(o.entreprise?.pays, lang) },
        { header: t('opportunite.etape'), value: (o) => stageLabel(o.etape_pipeline, lang) },
        { header: t('opportunite.valeur'), value: (o) => o.valeur_estimee ?? '' },
        { header: t('opportunite.devise'), value: (o) => o.devise },
        { header: t('opportunite.source'), value: (o) => sourceLabel(o.source, lang) },
        { header: t('opportunite.segment'), value: (o) => segmentLabel(o.segment_abc, lang) },
        { header: t('opportunite.date_prochaine_action'), value: (o) => o.date_prochaine_action ?? '' },
      ],
      `opportunites-${timestampSlug()}`,
    )
    toast.success(t('toast.exported'))
  }

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Opportunite | null>(null)
  const [toDelete, setToDelete] = useState<OpportuniteWithRelations | null>(null)

  return (
    <div className="p-6">
      <PageHeader
        title={t('opportunite.plural')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={loading || data.length === 0}
            >
              <Download size={15} /> {t('common.export')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
              <Plus size={15} /> {t('opportunite.new')}
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <FilterBar value={filters} onChange={setFilters} showSegment />
      </Card>

      <Card>
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{t('common.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line-dark text-xs text-muted">
                  <th className="px-3 py-2 font-medium">{t('opportunite.intitule')}</th>
                  <th className="px-3 py-2 font-medium">{t('opportunite.entreprise')}</th>
                  <th className="px-3 py-2 font-medium">{t('opportunite.etape')}</th>
                  <th className="px-3 py-2 font-medium">{t('opportunite.valeur')}</th>
                  <th className="px-3 py-2 font-medium">{t('opportunite.segment')}</th>
                  <th className="px-3 py-2 font-medium">{t('opportunite.date_prochaine_action')}</th>
                  <th className="px-3 py-2 text-right font-medium">{t('common.edit')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((o) => (
                  <tr key={o.id} className="border-b border-line-dark/50 hover:bg-ink-soft/60">
                    <td className="px-3 py-2.5 font-medium text-ink-text">{o.intitule || '—'}</td>
                    <td className="px-3 py-2.5 text-muted">
                      {o.entreprise ? `${o.entreprise.nom} · ${countryName(o.entreprise.pays, lang)}` : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge color={STAGE_BY_ID[o.etape_pipeline]?.color}>{stageLabel(o.etape_pipeline, lang)}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-gold">{formatMoney(o.valeur_estimee, o.devise)}</td>
                    <td className="px-3 py-2.5 text-muted">{segmentLabel(o.segment_abc, lang)}</td>
                    <td className="px-3 py-2.5 text-muted">{o.date_prochaine_action ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(o); setFormOpen(true) }} className="rounded p-1.5 text-muted hover:text-gold" aria-label={t('common.edit')}>
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setToDelete(o)} className="rounded p-1.5 text-muted hover:text-red-400" aria-label={t('common.delete')}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formOpen && (
        <OpportuniteForm
          open={formOpen}
          initial={editing}
          entrepriseId={null}
          entreprises={entreprises}
          onSubmit={async (input) => {
            if (!teamId) return false
            if (editing) return update(editing.id, input)
            const created = await create({ ...input, team_id: teamId })
            return !!created
          }}
          onClose={() => setFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={t('common.delete')}
        message={t('opportunite.singular') + ' ?'}
        onConfirm={async () => { if (toDelete) await remove(toDelete.id); setToDelete(null) }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}