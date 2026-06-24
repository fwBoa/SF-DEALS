/**
 * Sources d'opportunité. Synchronisé avec la contrainte CHECK
 * de `opportunites.source`.
 */
export type SourceId =
  | 'réseau'
  | 'recommandation'
  | 'prospection directe'
  | 'événement'
  | 'autre'

export interface Source {
  id: SourceId
  label_fr: string
  label_en: string
}

export const SOURCES: Source[] = [
  { id: 'réseau', label_fr: 'Réseau', label_en: 'Network' },
  { id: 'recommandation', label_fr: 'Recommandation', label_en: 'Referral' },
  { id: 'prospection directe', label_fr: 'Prospection directe', label_en: 'Direct outreach' },
  { id: 'événement', label_fr: 'Événement', label_en: 'Event' },
  { id: 'autre', label_fr: 'Autre', label_en: 'Other' },
]

export function sourceLabel(id: string | null | undefined, lang: 'fr' | 'en'): string {
  const s = SOURCES.find((x) => x.id === id)
  if (!s) return id ?? '—'
  return lang === 'fr' ? s.label_fr : s.label_en
}