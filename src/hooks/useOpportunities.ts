import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { OpportuniteWithRelations, Filters } from '@/lib/types'
import { useToast } from '@/lib/toast'
import { useTranslation } from 'react-i18next'
import type { StageId } from '@/config/pipeline'

export type OpportuniteInput = Omit<
  OpportuniteWithRelations,
  'id' | 'created_at' | 'updated_at' | 'entreprise' | 'contact_principal'
>
/** Champs éditables (team_id, entreprise_id, contact_principal_id fournis par la page/form). */
export type OpportuniteFields = Omit<
  OpportuniteInput,
  'team_id' | 'entreprise_id' | 'contact_principal_id'
>

interface UseOpportunitiesOpts {
  entrepriseId?: string
}

export function useOpportunities(filters: Filters, opts: UseOpportunitiesOpts = {}) {
  const { t } = useTranslation()
  const toast = useToast()
  const [data, setData] = useState<OpportuniteWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('opportunites')
      .select('*, entreprise:entreprises(*), contact_principal:contacts(*)')
      .order('date_prochaine_action', { ascending: true, nullsFirst: false })
    if (opts.entrepriseId) q = q.eq('entreprise_id', opts.entrepriseId)
    if (filters.segment) q = q.eq('segment_abc', filters.segment)
    const { data, error } = await q
    if (error) toast.error(t('toast.error'))

    let rows = (data as OpportuniteWithRelations[]) ?? []
    // Filtres sur colonnes jointes : côté client (volume V1).
    if (filters.pays) rows = rows.filter((o) => o.entreprise?.pays === filters.pays)
    if (filters.secteur) rows = rows.filter((o) => o.entreprise?.secteur === filters.secteur)
    if (filters.ecobank === 'yes') rows = rows.filter((o) => o.entreprise?.presence_ecobank)
    if (filters.ecobank === 'no') rows = rows.filter((o) => !o.entreprise?.presence_ecobank)
    if (filters.search.trim()) {
      const s = filters.search.trim().toLowerCase()
      rows = rows.filter(
        (o) =>
          o.intitule?.toLowerCase().includes(s) ||
          o.entreprise?.nom.toLowerCase().includes(s) ||
          o.contact_principal?.nom.toLowerCase().includes(s),
      )
    }
    setData(rows)
    setLoading(false)
  }, [opts.entrepriseId, filters.segment, filters.pays, filters.secteur, filters.ecobank, filters.search, toast, t])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (input: OpportuniteInput) => {
      const { data, error } = await supabase.from('opportunites').insert(input).select().single()
      if (error) {
        toast.error(t('toast.error'))
        return null
      }
      toast.success(t('toast.saved'))
      void load()
      return data
    },
    [load, toast, t],
  )

  const update = useCallback(
    async (id: string, input: Partial<OpportuniteInput>) => {
      const { error } = await supabase.from('opportunites').update(input).eq('id', id)
      if (error) {
        toast.error(t('toast.error'))
        return false
      }
      void load()
      return true
    },
    [load, toast, t],
  )

  /** Déplacement kanban : update optimiste + rollback. */
  const moveStage = useCallback(
    async (id: string, newStage: StageId) => {
      setData((prev) => prev.map((o) => (o.id === id ? { ...o, etape_pipeline: newStage } : o)))
      const { error } = await supabase
        .from('opportunites')
        .update({ etape_pipeline: newStage })
        .eq('id', id)
      if (error) {
        toast.error(t('toast.error'))
        void load()
        return false
      }
      return true
    },
    [load, toast, t],
  )

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('opportunites').delete().eq('id', id)
      if (error) {
        toast.error(t('toast.error'))
        return false
      }
      toast.success(t('toast.deleted'))
      void load()
      return true
    },
    [load, toast, t],
  )

  const grouped = useMemo(() => {
    // fourni en complément pour le kanban
    return data
  }, [data])

  return { data, grouped, loading, refetch: load, create, update, moveStage, remove }
}