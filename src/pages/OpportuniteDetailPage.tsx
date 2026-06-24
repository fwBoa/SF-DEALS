import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { OpportuniteWithRelations } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'
import { useActivites } from '@/hooks/useActivites'
import { useToast } from '@/lib/toast'
import { countryName } from '@/config/countries'
import { stageLabel, STAGE_BY_ID } from '@/config/pipeline'
import { segmentLabel } from '@/config/segments'
import { sourceLabel } from '@/config/sources'
import { formatMoney } from '@/config/currencies'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ActivityTimeline } from '@/components/activites/ActivityTimeline'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="text-sm text-ink-text">{children ?? '—'}</span>
    </div>
  )
}

export function OpportuniteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const { teamId } = useAuth()
  const toast = useToast()

  const [opp, setOpp] = useState<OpportuniteWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: activites, loading: loadingA, create, remove } = useActivites(id)

  async function load() {
    if (!id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('opportunites')
      .select('*, entreprise:entreprises(*), contact_principal:contacts(*)')
      .eq('id', id)
      .single()
    if (error) {
      toast.error(t('toast.error'))
      setOpp(null)
    } else {
      setOpp(data as OpportuniteWithRelations)
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleDelete() {
    if (!opp) return
    const { error } = await supabase.from('opportunites').delete().eq('id', opp.id)
    if (error) {
      toast.error(t('toast.error'))
      return
    }
    toast.success(t('toast.deleted'))
    navigate('/liste')
  }

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title={t('opportunite.singular')} />
        <Card className="flex justify-center py-16"><Spinner size={28} /></Card>
      </div>
    )
  }

  if (!opp) {
    return (
      <div className="p-6">
        <PageHeader title={t('opportunite.singular')} />
        <Card>
          <EmptyState title={t('common.empty')} />
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title={opp.intitule || opp.entreprise?.nom || t('opportunite.singular')}
        subtitle={opp.entreprise?.nom}
        accent="—"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft size={15} /> {t('common.back')}
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={15} /> {t('common.delete')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STAGE_BY_ID[opp.etape_pipeline]?.color }}
            />
            <Badge color={STAGE_BY_ID[opp.etape_pipeline]?.color}>
              {stageLabel(opp.etape_pipeline, lang)}
            </Badge>
            {opp.valeur_estimee != null && (
              <span className="ml-auto font-serif text-xl text-gold">
                {formatMoney(opp.valeur_estimee, opp.devise)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('opportunite.entreprise')}>
              {opp.entreprise ? (
                <span>
                  {opp.entreprise.nom}
                  <span className="text-muted"> · {countryName(opp.entreprise.pays, lang)}</span>
                </span>
              ) : null}
            </Field>
            <Field label={t('opportunite.contact_principal')}>
              {opp.contact_principal?.nom ?? '—'}
            </Field>
            <Field label={t('opportunite.segment')}>
              {segmentLabel(opp.segment_abc, lang)}
            </Field>
            <Field label={t('opportunite.source')}>{sourceLabel(opp.source, lang)}</Field>
            <Field label={t('opportunite.date_dernier_contact')}>
              {opp.date_dernier_contact ?? '—'}
            </Field>
            <Field label={t('opportunite.date_prochaine_action')}>
              {opp.date_prochaine_action ?? '—'}
            </Field>
          </div>
          {opp.notes && (
            <div className="mt-4 border-t border-line-dark/50 pt-3">
              <span className="text-xs uppercase tracking-wide text-muted">
                {t('opportunite.notes')}
              </span>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-text">{opp.notes}</p>
            </div>
          )}
        </Card>

        <ActivityTimeline
          activites={activites}
          loading={loadingA}
          lastContact={opp.date_dernier_contact}
          onCreate={async (input) => {
            if (!teamId || !id) return null
            const res = await create({ ...input, team_id: teamId, opportunite_id: id })
            void load() // rafraîchit date_dernier_contact
            return res
          }}
          onDelete={async (aid) => {
            await remove(aid)
            void load()
          }}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={t('common.delete')}
        message={t('opportunite.singular') + ' ?'}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}