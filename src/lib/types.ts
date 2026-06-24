import type { StageId } from '@/config/pipeline'
import type { CountryCode } from '@/config/countries'
import type { SectorId } from '@/config/sectors'
import type { SourceId } from '@/config/sources'
import type { SegmentId } from '@/config/segments'
import type { DeviseId } from '@/config/currencies'
import type { ActivityTypeId } from '@/config/activityTypes'

/** Ligne de `public.entreprises`. */
export interface Entreprise {
  id: string
  team_id: string
  nom: string
  pays: CountryCode
  secteur: SectorId
  presence_ecobank: boolean
  site_web: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/** Ligne de `public.contacts`. */
export interface Contact {
  id: string
  team_id: string
  entreprise_id: string
  nom: string
  fonction: string | null
  email: string | null
  telephone_whatsapp: string | null
  linkedin: string | null
  created_at: string
  updated_at: string
}

/** Ligne de `public.opportunites`. */
export interface Opportunite {
  id: string
  team_id: string
  entreprise_id: string
  contact_principal_id: string | null
  etape_pipeline: StageId
  intitule: string | null
  valeur_estimee: number | null
  devise: DeviseId
  source: SourceId | null
  segment_abc: SegmentId | null
  score_priorite: number | null
  date_dernier_contact: string | null
  date_prochaine_action: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/** Ligne de `public.activites`. */
export interface Activite {
  id: string
  team_id: string
  opportunite_id: string
  type: ActivityTypeId
  date: string
  commentaire: string | null
  created_at: string
}

/** Opportunité avec ses relations jointes (PostgREST). */
export interface OpportuniteWithRelations extends Opportunite {
  entreprise: Pick<Entreprise, 'id' | 'nom' | 'pays' | 'secteur' | 'presence_ecobank'> | null
  contact_principal: Pick<Contact, 'id' | 'nom' | 'fonction' | 'email'> | null
}

/** Contact avec son entreprise jointe. */
export interface ContactWithEntreprise extends Contact {
  entreprise: Pick<Entreprise, 'id' | 'nom' | 'pays'> | null
}

/** Équipe + appartenance. */
export interface Team {
  id: string
  name: string
  created_at: string
}
export interface TeamMember {
  team_id: string
  user_id: string
  role: 'owner' | 'collaborator'
  created_at: string
}

/** Filtres partagés (Liste / Kanban / Dashboard). */
export interface Filters {
  search: string
  pays: CountryCode | ''
  secteur: SectorId | ''
  segment: SegmentId | ''
  ecobank: 'yes' | 'no' | ''
}