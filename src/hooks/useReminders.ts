import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { OpportuniteWithRelations } from '@/lib/types'
import { useToast } from '@/lib/toast'
import { useTranslation } from 'react-i18next'

export interface Reminder extends OpportuniteWithRelations {
  /** Jours restants avant la prochaine action (négatif = en retard). */
  daysLeft: number
  overdue: boolean
}

const MS_PER_DAY = 86_400_000

/** Date du jour à minuit (local), recalculée à chaque appel. */
function todayMidnight(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function useReminders(horizonDays = 14) {
  const { t } = useTranslation()
  const toast = useToast()
  const [data, setData] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const horizon = new Date(todayMidnight() + horizonDays * MS_PER_DAY + 1)
    // date_prochaine_action <= horizon (bornes incluses) ; on filtre aussi les
    // terminales côté client pour ne pas rappeler les Gagné/Perdu.
    const { data: rows, error } = await supabase
      .from('opportunites')
      .select('*, entreprise:entreprises(*), contact_principal:contacts(*)')
      .not('date_prochaine_action', 'is', null)
      .lte('date_prochaine_action', horizon.toISOString())
      .order('date_prochaine_action', { ascending: true, nullsFirst: false })
    if (error) {
      toast.error(t('toast.error'))
      setData([])
      setLoading(false)
      return
    }

    const today = todayMidnight()
    const reminders: Reminder[] = ((rows as OpportuniteWithRelations[]) ?? [])
      .filter((o) => o.etape_pipeline !== 'Gagné' && o.etape_pipeline !== 'Perdu')
      .map((o) => {
        const d = new Date((o.date_prochaine_action ?? '') + 'T00:00:00').getTime()
        const daysLeft = Math.round((d - today) / MS_PER_DAY)
        return { ...o, daysLeft, overdue: daysLeft < 0 }
      })
    setData(reminders)
    setLoading(false)
  }, [horizonDays, toast, t])

  useEffect(() => {
    void load()
  }, [load])

  const overdue = useMemo(() => data.filter((r) => r.overdue), [data])
  const upcoming = useMemo(() => data.filter((r) => !r.overdue), [data])

  return { data, overdue, upcoming, loading, refetch: load }
}