/**
 * Devises. Synchronisé avec l'enum `devise_t`.
 * Taux de conversion statiques (vers EUR) pour le total du pipeline en V1 —
 * pas d'API FX. À ajuster manuellement si besoin.
 */
export type DeviseId = 'XOF' | 'EUR' | 'USD'

export interface Devise {
  id: DeviseId
  label: string
  /** Symbole / code court affiché. */
  symbol: string
  /** Taux vers EUR (1 unité = N EUR). */
  to_eur: number
}

export const DEVISES: Devise[] = [
  { id: 'XOF', label: 'Franc CFA (XOF)', symbol: 'XOF', to_eur: 0.001524 },
  { id: 'EUR', label: 'Euro (EUR)', symbol: '€', to_eur: 1 },
  { id: 'USD', label: 'Dollar US (USD)', symbol: '$', to_eur: 0.92 },
]

export const DEVISE_BY_ID: Record<DeviseId, Devise> = Object.fromEntries(
  DEVISES.map((d) => [d.id, d]),
) as Record<DeviseId, Devise>

/** Convertit un montant vers l'équivalent EUR. */
export function toEur(amount: number, devise: DeviseId): number {
  return amount * DEVISE_BY_ID[devise].to_eur
}

/** Formate un montant dans sa devise. */
export function formatMoney(amount: number | null | undefined, devise: DeviseId): string {
  if (amount == null) return '—'
  const d = DEVISE_BY_ID[devise]
  return `${d.symbol} ${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)}`
}

/** Formate un équivalent EUR. */
export function formatEur(amount: number): string {
  return `€ ${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)}`
}