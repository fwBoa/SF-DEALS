import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Phone } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import type { Filters } from '@/lib/types'
import { countryName } from '@/config/countries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { FilterBar, emptyFilters } from '@/components/filters/FilterBar'

export function ContactsPage() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const { data, loading } = useContacts({ withEntreprise: true })

  const filtered = useMemo(() => {
    let rows = data as Array<{ id: string; nom: string; fonction: string | null; email: string | null; telephone_whatsapp: string | null; entreprise: { id: string; nom: string; pays: string } | null }>
    if (filters.pays) rows = rows.filter((c) => c.entreprise?.pays === filters.pays)
    if (filters.search.trim()) {
      const s = filters.search.trim().toLowerCase()
      rows = rows.filter((c) => c.nom.toLowerCase().includes(s) || c.entreprise?.nom.toLowerCase().includes(s))
    }
    return rows
  }, [data, filters.pays, filters.search])

  return (
    <div className="p-6">
      <PageHeader title={t('contact.plural')} />
      <Card className="mb-4">
        <FilterBar value={filters} onChange={setFilters} />
      </Card>
      <Card>
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{t('common.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line-dark text-xs text-muted">
                  <th className="px-3 py-2 font-medium">{t('contact.nom')}</th>
                  <th className="px-3 py-2 font-medium">{t('contact.fonction')}</th>
                  <th className="px-3 py-2 font-medium">{t('contact.entreprise')}</th>
                  <th className="px-3 py-2 font-medium">{t('contact.email')}</th>
                  <th className="px-3 py-2 font-medium">{t('contact.telephone')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b border-line-dark/50 hover:bg-ink-soft/60"
                    onClick={() => c.entreprise && navigate(`/entreprises/${c.entreprise.id}`)}
                  >
                    <td className="px-3 py-2.5 font-medium text-ink-text">{c.nom}</td>
                    <td className="px-3 py-2.5 text-muted">{c.fonction ?? '—'}</td>
                    <td className="px-3 py-2.5 text-muted">
                      {c.entreprise ? `${c.entreprise.nom} · ${countryName(c.entreprise.pays, lang)}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {c.email ? <span className="inline-flex items-center gap-1"><Mail size={12} /> {c.email}</span> : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {c.telephone_whatsapp ? <span className="inline-flex items-center gap-1"><Phone size={12} /> {c.telephone_whatsapp}</span> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}