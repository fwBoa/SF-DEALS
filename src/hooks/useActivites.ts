import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Activite } from '@/lib/types'
import type { ActivityTypeId } from '@/config/activityTypes'
import { useToast } from '@/lib/toast'
import { useTranslation } from 'react-i18next'

export type ActiviteInput = Omit<Activite, 'id' | 'created_at'> & { created_at?: string }

export function useActivites(opportuniteId: string | undefined) {
  const { t } = useTranslation()
  const toast = useToast()
  const [data, setData] = useState<Activite[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!opportuniteId) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('activites')
      .select('*')
      .eq('opportunite_id', opportuniteId)
      .order('date', { ascending: false })
    if (error) {
      toast.error(t('toast.error'))
      setData([])
    } else {
      setData((rows as Activite[]) ?? [])
    }
    setLoading(false)
  }, [opportuniteId, toast, t])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * Crée une activité puis met à jour `opportunites.date_dernier_contact`
   * à la date de l'activité. Renvoie l'activité créée ou null.
   */
  const create = useCallback(
    async (input: {
      team_id: string
      opportunite_id: string
      type: ActivityTypeId
      date: string
      commentaire: string | null
    }) => {
      const { data: created, error } = await supabase
        .from('activites')
        .insert(input)
        .select()
        .single()
      if (error || !created) {
        toast.error(t('toast.error'))
        return null
      }
      // met à jour date_dernier_contact sur l'opportunité
      const { error: updErr } = await supabase
        .from('opportunites')
        .update({ date_dernier_contact: input.date })
        .eq('id', input.opportunite_id)
      if (updErr) {
        // non bloquant : l'activité est créée, on signale juste
        toast.error(t('toast.error'))
      }
      toast.success(t('toast.saved'))
      void load()
      return created as Activite
    },
    [load, toast, t],
  )

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('activites').delete().eq('id', id)
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

  return { data, loading, create, remove, refetch: load }
}