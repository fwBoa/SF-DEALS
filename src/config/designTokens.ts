/**
 * Design tokens — source de vérité pour les couleurs/polices du CRM SF Deals.
 * Miroir des variables CSS définies dans src/index.css (@theme).
 * Utiliser ces constantes dans les composants qui ne peuvent pas s'appuyer
 * sur les classes utilitaires Tailwind (charts SVG, etc.).
 */
export const COLORS = {
  ink: '#0e0d0c',
  inkSoft: '#171513',
  paper: '#efebe1',
  gold: '#c9a44d',
  goldSoft: '#e0c885',
  inkText: '#f3f0e9',
  paperText: '#15140f',
  muted: '#8a8275',
  lineDark: '#2a2722',
  lineLight: '#d9d3c4',
} as const

export const FONTS = {
  serif: "'Lora', Georgia, serif",
  sans: "'Poppins', system-ui, sans-serif",
} as const