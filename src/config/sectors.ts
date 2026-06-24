/**
 * Secteurs d'activité. Synchronisé avec la contrainte CHECK
 * de `entreprises.secteur`.
 */
export type SectorId =
  | 'Banque'
  | 'Assurance'
  | 'Microfinance'
  | 'Télécom'
  | 'ONG/institution'
  | 'Entreprise privée'
  | 'Autre'

export interface Sector {
  id: SectorId
  label_fr: string
  label_en: string
}

export const SECTORS: Sector[] = [
  { id: 'Banque', label_fr: 'Banque', label_en: 'Banking' },
  { id: 'Assurance', label_fr: 'Assurance', label_en: 'Insurance' },
  { id: 'Microfinance', label_fr: 'Microfinance', label_en: 'Microfinance' },
  { id: 'Télécom', label_fr: 'Télécom', label_en: 'Telecom' },
  { id: 'ONG/institution', label_fr: 'ONG / institution', label_en: 'NGO / institution' },
  { id: 'Entreprise privée', label_fr: 'Entreprise privée', label_en: 'Private company' },
  { id: 'Autre', label_fr: 'Autre', label_en: 'Other' },
]

export function sectorLabel(id: string | null | undefined, lang: 'fr' | 'en'): string {
  const s = SECTORS.find((x) => x.id === id)
  if (!s) return id ?? '—'
  return lang === 'fr' ? s.label_fr : s.label_en
}