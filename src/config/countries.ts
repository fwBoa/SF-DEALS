/**
 * Pays — Afrique de l'Ouest (priorité) + étendue réseau Ecobank (33 pays).
 *
 * Les codes ISO (CIV, GHA…) DOIVENT rester synchronisés avec la contrainte CHECK
 * de `entreprises.pays` (voir supabase/migrations/0001_init_schema.sql).
 * Un test de synchro (scripts/check-config-sync) vérifie la cohérence.
 *
 * `region` : 'west_africa' (priorité) ou 'ecobank_extended'.
 * `ecobank_present` : présence d'une filiale Ecobank dans le pays.
 */

export type CountryCode =
  | 'CIV' | 'GHA' | 'SEN' | 'NGA' | 'TGO' | 'BEN' | 'BFA' | 'MLI' | 'NER'
  | 'GMB' | 'GIN' | 'GNB' | 'SLE' | 'LBR' | 'CPV'
  | 'CMR' | 'TCD' | 'CAF' | 'COG' | 'COD' | 'GNQ' | 'GAB' | 'KEN' | 'RWA'
  | 'BDI' | 'TZA' | 'UGA' | 'SSD' | 'MWI' | 'MOZ' | 'ZMB' | 'ZWE' | 'STP'

export type Region = 'west_africa' | 'ecobank_extended'

export interface Country {
  code: CountryCode
  name_fr: string
  name_en: string
  region: Region
  ecobank_present: boolean
}

export const COUNTRIES: Country[] = [
  // ---- Afrique de l'Ouest (priorité) ----
  { code: 'CIV', name_fr: "Côte d'Ivoire", name_en: 'Ivory Coast', region: 'west_africa', ecobank_present: true },
  { code: 'GHA', name_fr: 'Ghana', name_en: 'Ghana', region: 'west_africa', ecobank_present: true },
  { code: 'SEN', name_fr: 'Sénégal', name_en: 'Senegal', region: 'west_africa', ecobank_present: true },
  { code: 'NGA', name_fr: 'Nigeria', name_en: 'Nigeria', region: 'west_africa', ecobank_present: true },
  { code: 'TGO', name_fr: 'Togo', name_en: 'Togo', region: 'west_africa', ecobank_present: true },
  { code: 'BEN', name_fr: 'Bénin', name_en: 'Benin', region: 'west_africa', ecobank_present: true },
  { code: 'BFA', name_fr: 'Burkina Faso', name_en: 'Burkina Faso', region: 'west_africa', ecobank_present: true },
  { code: 'MLI', name_fr: 'Mali', name_en: 'Mali', region: 'west_africa', ecobank_present: true },
  { code: 'NER', name_fr: 'Niger', name_en: 'Niger', region: 'west_africa', ecobank_present: true },
  { code: 'GMB', name_fr: 'Gambie', name_en: 'Gambia', region: 'west_africa', ecobank_present: true },
  { code: 'GIN', name_fr: 'Guinée', name_en: 'Guinea', region: 'west_africa', ecobank_present: true },
  { code: 'GNB', name_fr: 'Guinée-Bissau', name_en: 'Guinea-Bissau', region: 'west_africa', ecobank_present: true },
  { code: 'SLE', name_fr: 'Sierra Leone', name_en: 'Sierra Leone', region: 'west_africa', ecobank_present: true },
  { code: 'LBR', name_fr: 'Liberia', name_en: 'Liberia', region: 'west_africa', ecobank_present: true },
  { code: 'CPV', name_fr: 'Cap-Vert', name_en: 'Cape Verde', region: 'west_africa', ecobank_present: true },
  // ---- Étendue réseau Ecobank ----
  { code: 'CMR', name_fr: 'Cameroun', name_en: 'Cameroon', region: 'ecobank_extended', ecobank_present: true },
  { code: 'TCD', name_fr: 'Tchad', name_en: 'Chad', region: 'ecobank_extended', ecobank_present: true },
  { code: 'CAF', name_fr: 'République centrafricaine', name_en: 'Central African Republic', region: 'ecobank_extended', ecobank_present: true },
  { code: 'COG', name_fr: 'Congo-Brazzaville', name_en: 'Congo', region: 'ecobank_extended', ecobank_present: true },
  { code: 'COD', name_fr: 'RD Congo', name_en: 'DR Congo', region: 'ecobank_extended', ecobank_present: true },
  { code: 'GNQ', name_fr: 'Guinée équatoriale', name_en: 'Equatorial Guinea', region: 'ecobank_extended', ecobank_present: true },
  { code: 'GAB', name_fr: 'Gabon', name_en: 'Gabon', region: 'ecobank_extended', ecobank_present: true },
  { code: 'KEN', name_fr: 'Kenya', name_en: 'Kenya', region: 'ecobank_extended', ecobank_present: true },
  { code: 'RWA', name_fr: 'Rwanda', name_en: 'Rwanda', region: 'ecobank_extended', ecobank_present: true },
  { code: 'BDI', name_fr: 'Burundi', name_en: 'Burundi', region: 'ecobank_extended', ecobank_present: true },
  { code: 'TZA', name_fr: 'Tanzanie', name_en: 'Tanzania', region: 'ecobank_extended', ecobank_present: true },
  { code: 'UGA', name_fr: 'Ouganda', name_en: 'Uganda', region: 'ecobank_extended', ecobank_present: true },
  { code: 'SSD', name_fr: 'Soudan du Sud', name_en: 'South Sudan', region: 'ecobank_extended', ecobank_present: true },
  { code: 'MWI', name_fr: 'Malawi', name_en: 'Malawi', region: 'ecobank_extended', ecobank_present: true },
  { code: 'MOZ', name_fr: 'Mozambique', name_en: 'Mozambique', region: 'ecobank_extended', ecobank_present: true },
  { code: 'ZMB', name_fr: 'Zambie', name_en: 'Zambia', region: 'ecobank_extended', ecobank_present: true },
  { code: 'ZWE', name_fr: 'Zimbabwe', name_en: 'Zimbabwe', region: 'ecobank_extended', ecobank_present: true },
  { code: 'STP', name_fr: 'São Tomé-et-Principe', name_en: 'São Tomé and Príncipe', region: 'ecobank_extended', ecobank_present: true },
]

export const COUNTRY_BY_CODE: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c]),
)

export function countryName(code: string | null | undefined, lang: 'fr' | 'en'): string {
  if (!code) return '—'
  const c = COUNTRY_BY_CODE[code]
  if (!c) return code
  return lang === 'fr' ? c.name_fr : c.name_en
}

export const WEST_AFRICA_COUNTRIES = COUNTRIES.filter((c) => c.region === 'west_africa')
export const ECOBANK_EXTENDED_COUNTRIES = COUNTRIES.filter((c) => c.region === 'ecobank_extended')