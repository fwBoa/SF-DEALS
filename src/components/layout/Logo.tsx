import { COLORS } from '@/config/designTokens'

interface LogoProps {
  /** Taille du côté du cadre, en px. */
  size?: number
  /** Variante : doré sur fond sombre (défaut) ou noir sur fond clair. */
  variant?: 'dark' | 'light'
  /** Affiche le mot "SF Deals" à côté du monogramme. */
  withWordmark?: boolean
}

/**
 * Monogramme "SF" dans un cadre fin doré.
 * Doré sur fond sombre / noir sur fond clair — cohérent avec l'identité
 * premium/conseil du cahier des charges.
 */
export function Logo({ size = 36, variant = 'dark', withWordmark = false }: LogoProps) {
  const stroke = variant === 'dark' ? COLORS.gold : '#15140f'
  const text = variant === 'dark' ? COLORS.gold : '#15140f'

  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="2.5"
          y="2.5"
          width="43"
          height="43"
          rx="6"
          stroke={stroke}
          strokeWidth="1.5"
        />
        <text
          x="24"
          y="24"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Lora', Georgia, serif"
          fontWeight="700"
          fontSize="20"
          letterSpacing="0.5"
          fill={text}
        >
          SF
        </text>
      </svg>
      {withWordmark && (
        <span
          className="font-serif text-lg font-semibold tracking-tight"
          style={{ color: text }}
        >
          SF<span className="accent-italic"> Deals</span>
        </span>
      )}
    </div>
  )
}