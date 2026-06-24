import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import type { Filters } from '@/lib/types'
import { COUNTRIES, countryName } from '@/config/countries'
import { SECTORS } from '@/config/sectors'
import { SEGMENTS } from '@/config/segments'
import { Select } from '@/components/ui/Select'

interface FilterBarProps {
  value: Filters
  onChange: (f: Filters) => void
  /** Afficher le filtre segment ABC (uniquement pour les opportunités). */
  showSegment?: boolean
}

export function FilterBar({ value, onChange, showSegment }: FilterBarProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch })
  const hasActive =
    value.search || value.pays || value.secteur || value.segment || value.ecobank

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search
          size={15}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={value.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder={t('common.search')}
          className="w-full rounded-md border border-line-dark bg-ink-soft py-2 pl-8 pr-3 text-sm text-ink-text placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
        />
      </div>

      <Select
        value={value.pays}
        onChange={(e) => set({ pays: e.target.value as Filters['pays'] })}
        className="min-w-[160px]"
      >
        <option value="">{t('filters.pays')} — {t('common.all')}</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {countryName(c.code, lang)}
          </option>
        ))}
      </Select>

      <Select
        value={value.secteur}
        onChange={(e) => set({ secteur: e.target.value as Filters['secteur'] })}
        className="min-w-[150px]"
      >
        <option value="">{t('filters.secteur')} — {t('common.all')}</option>
        {SECTORS.map((s) => (
          <option key={s.id} value={s.id}>
            {lang === 'fr' ? s.label_fr : s.label_en}
          </option>
        ))}
      </Select>

      {showSegment && (
        <Select
          value={value.segment}
          onChange={(e) => set({ segment: e.target.value as Filters['segment'] })}
          className="min-w-[140px]"
        >
          <option value="">{t('filters.segment')} — {t('common.all')}</option>
          {SEGMENTS.map((s) => (
            <option key={s.id} value={s.id}>
              {lang === 'fr' ? s.label_fr : s.label_en}
            </option>
          ))}
        </Select>
      )}

      <Select
        value={value.ecobank}
        onChange={(e) => set({ ecobank: e.target.value as Filters['ecobank'] })}
        className="min-w-[150px]"
      >
        <option value="">{t('filters.ecobank')} — {t('filters.ecobank_any')}</option>
        <option value="yes">{t('filters.ecobank_yes')}</option>
        <option value="no">{t('filters.ecobank_no')}</option>
      </Select>

      {hasActive && (
        <button
          onClick={() =>
            onChange({ search: '', pays: '', secteur: '', segment: '', ecobank: '' })
          }
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-gold"
        >
          <X size={13} />
          {t('filters.clear')}
        </button>
      )}
    </div>
  )
}

export const emptyFilters: Filters = {
  search: '',
  pays: '',
  secteur: '',
  segment: '',
  ecobank: '',
}