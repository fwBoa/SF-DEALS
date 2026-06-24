import Papa from 'papaparse'
import type { SectorId } from '@/config/sectors'
import { SECTORS } from '@/config/sectors'
import type { CountryCode } from '@/config/countries'
import { COUNTRY_BY_CODE } from '@/config/countries'
import type { EntrepriseFields } from '@/hooks/useEntreprises'

export interface ParsedRow {
  /** index de ligne (1-based dans le CSV, hors en-tête). */
  rowNumber: number
  raw: Record<string, string>
  fields: Partial<EntrepriseFields> | null
  errors: string[]
}

export interface ParseResult {
  rows: ParsedRow[]
  valid: ParsedRow[]
  invalid: ParsedRow[]
  /** En-têtes détectés (normalisés). */
  headers: string[]
}

const SECTOR_IDS = new Set<string>(SECTORS.map((s) => s.id))
const COUNTRY_CODES = new Set<string>(Object.keys(COUNTRY_BY_CODE))

const ACCENTS: Record<string, string> = {
  à: 'a', á: 'a', â: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  î: 'i', ï: 'i', í: 'i',
  ô: 'o', ö: 'o', ó: 'o',
  û: 'u', ü: 'u', ù: 'u', ú: 'u',
  ç: 'c', ñ: 'n',
}

/** Normalise un en-tête : minuscules, sans accents, sans espaces ni ponctuation. */
function normHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/[àáâäèéêëîïíôöóûüùúçñ]/g, (c) => ACCENTS[c] ?? c)
    .replace(/[^a-z0-9]/g, '')
}

/** Mapping en-tête normalisé -> champ EntrepriseFields. */
const HEADER_MAP: Record<string, keyof EntrepriseFields> = {
  nom: 'nom',
  name: 'nom',
  raison: 'nom',
  raisonsociale: 'nom',
  pays: 'pays',
  country: 'pays',
  secteur: 'secteur',
  sector: 'secteur',
  presenceecobank: 'presence_ecobank',
  ecobank: 'presence_ecobank',
  presence: 'presence_ecobank',
  siteweb: 'site_web',
  website: 'site_web',
  site: 'site_web',
  url: 'site_web',
  notes: 'notes',
  commentaire: 'notes',
}

function parseBool(v: string): boolean | null {
  const s = v.trim().toLowerCase()
  if (['oui', 'yes', 'true', '1', 'x', 'o', 'y'].includes(s)) return true
  if (['non', 'no', 'false', '0', 'n', '-'].includes(s)) return false
  return null
}

/**
 * Parse un fichier CSV d'entreprises et valide chaque ligne.
 * team_id n'est jamais lu depuis le CSV — il est forcé côté insertion (sécurité RLS).
 */
export function parseEntreprisesCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  const headers = (parsed.meta.fields ?? []).map(normHeader)
  const rows: ParsedRow[] = []

  ;(parsed.data ?? []).forEach((raw, i) => {
    const errors: string[] = []
    const fields: Partial<EntrepriseFields> = {}

    // reconstruit les valeurs brutes (chaînes) via le mapping d'en-têtes
    const rawByField: Record<string, string> = {}
    for (const [orig, value] of Object.entries(raw)) {
      const key = HEADER_MAP[normHeader(orig)]
      if (key) {
        // si le champ apparaît plusieurs fois, la dernière valeur gagne
        rawByField[key] = (value ?? '').trim()
      }
    }

    // nom — obligatoire
    const nom = (rawByField.nom ?? '').trim()
    if (!nom) errors.push('nom manquant')
    else fields.nom = nom

    // pays — obligatoire, doit être un code ISO valide
    const paysRaw = (rawByField.pays ?? '').trim().toUpperCase()
    if (!paysRaw) {
      errors.push('pays manquant')
    } else if (!COUNTRY_CODES.has(paysRaw)) {
      errors.push(`pays invalide « ${paysRaw} » (code ISO attendu, ex. SEN)`)
    } else {
      fields.pays = paysRaw as CountryCode
    }

    // secteur — obligatoire, doit correspondre à un id du config
    const secteurRaw = (rawByField.secteur ?? '').trim()
    if (!secteurRaw) {
      errors.push('secteur manquant')
    } else if (!SECTOR_IDS.has(secteurRaw)) {
      errors.push(`secteur invalide « ${secteurRaw} »`)
    } else {
      fields.secteur = secteurRaw as SectorId
    }

    // présence ecobank — optionnel (défaut false)
    const ecobankRaw = rawByField.presence_ecobank ?? ''
    if (ecobankRaw.trim() !== '') {
      const b = parseBool(ecobankRaw)
      if (b == null) errors.push('présence ecobank invalide (oui/non attendu)')
      else fields.presence_ecobank = b
    } else {
      fields.presence_ecobank = false
    }

    // site_web / notes — optionnels
    if (rawByField.site_web) fields.site_web = rawByField.site_web.trim() || null
    if (rawByField.notes) fields.notes = rawByField.notes.trim() || null

    rows.push({
      rowNumber: i + 2, // +1 (header) +1 (1-based)
      raw,
      fields: errors.length === 0 ? (fields as EntrepriseFields) : null,
      errors,
    })
  })

  return {
    rows,
    valid: rows.filter((r) => r.errors.length === 0),
    invalid: rows.filter((r) => r.errors.length > 0),
    headers,
  }
}