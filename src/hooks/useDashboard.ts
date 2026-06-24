import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { OpportuniteWithRelations } from '@/lib/types'
import type { CountryCode } from '@/config/countries'
import type { StageId } from '@/config/pipeline'
import { PIPELINE_STAGES, WON_STAGE, LOST_STAGE, OPEN_STAGES } from '@/config/pipeline'
import type { DeviseId } from '@/config/currencies'
import { DEVISES, toEur } from '@/config/currencies'
import { useToast } from '@/lib/toast'
import { useTranslation } from 'react-i18next'

export interface CountryCount {
  code: CountryCode
  count: number
}

export interface StageCount {
  stage: StageId
  count: number
}

export interface DeviseTotal {
  devise: DeviseId
  /** Somme brute dans la devise d'origine (ouvrable). */
  raw: number
  /** Équivalent EUR (ouvrable). */
  eur: number
}

export interface DashboardMetrics {
  totalProspects: number
  totalOpportunities: number
  byCountry: CountryCount[]
  byStage: StageCount[]
  /** Valeur ouvrable par devise. */
  openByDevise: DeviseTotal[]
  /** Valeur ouvrable totale en équivalent EUR. */
  openValueEur: number
  /** Valeur gagnée totale en équivalent EUR. */
  wonValueEur: number
  /** Taux de conversion = Gagné / (Gagné + Perdu). */
  conversionRate: number | null
}

function compute(opps: OpportuniteWithRelations[], prospects: number): DashboardMetrics {
  // Prospects par pays (compte des opportunités distinctes par pays d'entreprise)
  const countryMap = new Map<CountryCode, number>()
  for (const o of opps) {
    const code = o.entreprise?.pays
    if (!code) continue
    countryMap.set(code, (countryMap.get(code) ?? 0) + 1)
  }
  const byCountry: CountryCount[] = [...countryMap.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)

  // Répartition par étape (toutes les étapes du pipeline, même à 0)
  const stageMap = new Map<StageId, number>()
  for (const s of PIPELINE_STAGES) stageMap.set(s.id, 0)
  for (const o of opps) stageMap.set(o.etape_pipeline, (stageMap.get(o.etape_pipeline) ?? 0) + 1)
  const byStage: StageCount[] = PIPELINE_STAGES.map((s) => ({ stage: s.id, count: stageMap.get(s.id) ?? 0 }))

  // Valeur ouvrable par devise + équivalent EUR
  const openByDevise: DeviseTotal[] = DEVISES.map((d) => {
    const raw = opps
      .filter((o) => OPEN_STAGES.some((s) => s.id === o.etape_pipeline) && o.devise === d.id)
      .reduce((s, o) => s + (o.valeur_estimee ?? 0), 0)
    return { devise: d.id, raw, eur: toEur(raw, d.id) }
  }).filter((d) => d.raw > 0)

  const openValueEur = openByDevise.reduce((s, d) => s + d.eur, 0)

  const wonValueEur = opps
    .filter((o) => o.etape_pipeline === WON_STAGE.id)
    .reduce((s, o) => s + toEur(o.valeur_estimee ?? 0, o.devise), 0)

  const won = opps.filter((o) => o.etape_pipeline === WON_STAGE.id).length
  const lost = opps.filter((o) => o.etape_pipeline === LOST_STAGE.id).length
  const conversionRate = won + lost > 0 ? won / (won + lost) : null

  return {
    totalProspects: prospects,
    totalOpportunities: opps.length,
    byCountry: byCountry,
    byStage,
    openByDevise,
    openValueEur,
    wonValueEur,
    conversionRate,
  }
}

export function useDashboard() {
  const { t } = useTranslation()
  const toast = useToast()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [oppRes, entRes] = await Promise.all([
        supabase
          .from('opportunites')
          .select('*, entreprise:entreprises(*), contact_principal:contacts(*)')
          .order('date_prochaine_action', { ascending: true, nullsFirst: false }),
        supabase.from('entreprises').select('id', { count: 'exact', head: true }),
      ])
      if (oppRes.error || entRes.error) {
        if (!cancelled) toast.error(t('toast.error'))
      } else if (!cancelled) {
        setMetrics(compute((oppRes.data as OpportuniteWithRelations[]) ?? [], entRes.count ?? 0))
      }
      if (!cancelled) setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [toast, t])

  return { metrics, loading }
}