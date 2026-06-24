import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Contact, ContactWithEntreprise } from '@/lib/types'
import { useToast } from '@/lib/toast'
import { useTranslation } from 'react-i18next'

export type ContactInput = Omit<Contact, 'id' | 'created_at' | 'updated_at'>
/** Champs éditables (team_id et entreprise_id fournis par la page). */
export type ContactFields = Omit<ContactInput, 'team_id' | 'entreprise_id'>

interface UseContactsOpts {
  entrepriseId?: string
  /** Jointure avec l'entreprise (page Contacts). */
  withEntreprise?: boolean
}

export function useContacts({ entrepriseId, withEntreprise }: UseContactsOpts = {}) {
  const { t } = useTranslation()
  const toast = useToast()
  const [data, setData] = useState<Contact[] | ContactWithEntreprise[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const select = withEntreprise ? '*, entreprise:entreprises(id,nom,pays)' : '*'
    let q = supabase.from('contacts').select(select).order('nom')
    if (entrepriseId) q = q.eq('entreprise_id', entrepriseId)
    const { data, error } = await q
    if (error) toast.error(t('toast.error'))
    setData((data ?? []) as unknown as Contact[] | ContactWithEntreprise[])
    setLoading(false)
  }, [entrepriseId, withEntreprise, toast, t])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (input: ContactInput) => {
      const { data, error } = await supabase.from('contacts').insert(input).select().single()
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
    async (id: string, input: Partial<ContactInput>) => {
      const { error } = await supabase.from('contacts').update(input).eq('id', id)
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
      const { error } = await supabase.from('contacts').delete().eq('id', id)
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