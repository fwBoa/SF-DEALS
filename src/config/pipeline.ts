/**
 * Étapes du pipeline commercial.
 *
 * SOURCE DE VÉRITÉ pour les étapes côté UI. Les valeurs `id` DOIVENT rester
 * synchronisées avec la contrainte CHECK de la table `opportunites.etape_pipeline`
 * (voir supabase/migrations/0001_init_schema.sql).
 *
 * Pour renommer / réordonner / ajouter une étape : éditer ce fichier ET la
 * contrainte CHECK correspondante, puis `supabase db reset`.
 */
export type StageId =
  | 'Lead'
  | 'Contacté'
  | 'Rendez-vous obtenu'
  | 'Proposition envoyée'
  | 'Négociation'
  | 'Gagné'
  | 'Perdu'

export interface Stage {
  id: StageId
  label_fr: string
  label_en: string
  /** Couleur d'accent (barre de colonne / badge). */
  color: string
  /** Ordre d'affichage (1 = le plus à gauche). */
  order: number
  /** Étape terminale (gagné/perdu) — exclue de la valeur "ouvrable" du pipeline. */
  terminal?: 'won' | 'lost'
}

export const PIPELINE_STAGES: Stage[] = [
  { id: 'Lead', label_fr: 'Lead', label_en: 'Lead', color: '#8a8275', order: 1 },
  { id: 'Contacté', label_fr: 'Contacté', label_en: 'Contacted', color: '#9c8b5e', order: 2 },
  { id: 'Rendez-vous obtenu', label_fr: 'Rendez-vous', label_en: 'Meeting', color: '#b8a06a', order: 3 },
  { id: 'Proposition envoyée', label_fr: 'Proposition envoyée', label_en: 'Proposal sent', color: '#c9a44d', order: 4 },
  { id: 'Négociation', label_fr: 'Négociation', label_en: 'Negotiation', color: '#d4b25e', order: 5 },
  { id: 'Gagné', label_fr: 'Gagné', label_en: 'Won', color: '#7ea25a', order: 6, terminal: 'won' },
  { id: 'Perdu', label_fr: 'Perdu', label_en: 'Lost', color: '#9c4a4a', order: 7, terminal: 'lost' },
]

export const STAGE_BY_ID: Record<StageId, Stage> = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.id, s]),
) as Record<StageId, Stage>

export const STAGE_ORDER: Record<StageId, number> = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.id, s.order]),
) as Record<StageId, number>

/** Étapes terminales (gagné/perdu). */
export const TERMINAL_STAGES = PIPELINE_STAGES.filter((s) => s.terminal)
export const WON_STAGE = PIPELINE_STAGES.find((s) => s.terminal === 'won')!
export const LOST_STAGE = PIPELINE_STAGES.find((s) => s.terminal === 'lost')!

/** Étapes "ouvrables" (non terminales) — utilisées pour la valeur du pipeline. */
export const OPEN_STAGES = PIPELINE_STAGES.filter((s) => !s.terminal)

export function stageLabel(id: StageId, lang: 'fr' | 'en'): string {
  const s = STAGE_BY_ID[id]
  return lang === 'fr' ? s.label_fr : s.label_en
}