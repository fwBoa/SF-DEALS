/**
 * Types d'activité (journal horodaté). Synchronisé avec l'enum `activite_type_t`.
 */
export type ActivityTypeId = 'appel' | 'email' | 'rdv' | 'autre'

export interface ActivityType {
  id: ActivityTypeId
  label_fr: string
  label_en: string
  /** Nom d'icône lucide-react. */
  icon: 'Phone' | 'Mail' | 'CalendarClock' | 'CircleDot'
}

export const ACTIVITY_TYPES: ActivityType[] = [
  { id: 'appel', label_fr: 'Appel', label_en: 'Call', icon: 'Phone' },
  { id: 'email', label_fr: 'Email', label_en: 'Email', icon: 'Mail' },
  { id: 'rdv', label_fr: 'Rendez-vous', label_en: 'Meeting', icon: 'CalendarClock' },
  { id: 'autre', label_fr: 'Autre', label_en: 'Other', icon: 'CircleDot' },
]

export function activityTypeLabel(id: string | null | undefined, lang: 'fr' | 'en'): string {
  const t = ACTIVITY_TYPES.find((x) => x.id === id)
  if (!t) return id ?? '—'
  return lang === 'fr' ? t.label_fr : t.label_en
}