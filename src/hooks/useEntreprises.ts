import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Entreprise, Filters } from '@/lib/types'
import { useToast } from '@/lib/toast'
import { useTranslation } from 'react-i18next'

export type EntrepriseInput = Omit<Entreprise, 'id' | 'created_at' | 'updated_at'>
/** Champs éditables du formulaire (sans team_id, ajouté par la page). */
export type EntrepriseFields = Omit<EntrepriseInput, 'team_id'>

export function useEntreprises(filters: Filters) {
  const { t } = useTranslation()
  const toast = useToast()
  const [data, setData] = useState<Entreprise[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('entreprises').select('*').order('nom')
    if (filters.pays) q = q.eq('pays', filters.pays)
    if (filters.secteur) q = q.eq('secteur', filters.secteur)
    if (filters.ecobank === 'yes') q = q.eq('presence_ecobank', true)
    if (filters.ecobank === 'no') q = q.eq('presence_ecobank', false)
    if (filters.search.trim()) q = q.ilike('nom', `%${filters.search.trim()}%`)
    const { data, error } = await q
    if (error) toast.error(t('toast.error'))
    setData(data ?? [])
    setLoading(false)
  }, [filters.pays, filters.secteur, filters.ecobank, filters.search, toast, t])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (input: EntrepriseInput) => {
      const { data, error } = await supabase.from('entreprises').insert(input).select().single()
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
    async (id: string, input: Partial<EntrepriseInput>) => {
      const { error } = await supabase.from('entreprises').update(input).eq('id', id)
      if (error) {
        toast.error(t('toast.error'))
        return false
      }
      toast.success(t('toast.saved'))
      void load()
      return true
    },
    [load, toast, t],
  )

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('entreprises').delete().eq('id', id)
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

  return { data, loading, refetch: load, create, update, remove }
}