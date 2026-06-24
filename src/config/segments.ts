/**
 * Segmentation ABC — valeur potentielle du compte.
 * A : fort potentiel (grands comptes) · B : moyen, stable · C : faible.
 * Synchronisé avec l'enum `segment_abc_t`.
 */
export type SegmentId = 'A' | 'B' | 'C'

export interface Segment {
  id: SegmentId
  label_fr: string
  label_en: string
  /** Couleur du badge. */
  color: string
}

export const SEGMENTS: Segment[] = [
  { id: 'A', label_fr: 'A — Fort potentiel', label_en: 'A — High potential', color: '#c9a44d' },
  { id: 'B', label_fr: 'B — Moyen', label_en: 'B — Medium', color: '#9c8b5e' },
  { id: 'C', label_fr: 'C — Faible', label_en: 'C — Low', color: '#8a8275' },
]

export const SEGMENT_BY_ID: Record<SegmentId, Segment> = Object.fromEntries(
  SEGMENTS.map((s) => [s.id, s]),
) as Record<SegmentId, Segment>

export function segmentLabel(id: string | null | undefined, lang: 'fr' | 'en'): string {
  if (!id) return '—'
  const s = SEGMENT_BY_ID[id as SegmentId]
  if (!s) return id
  return lang === 'fr' ? s.label_fr : s.label_en
}