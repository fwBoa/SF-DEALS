import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import type { Entreprise } from '@/lib/types'
import { countryName } from '@/config/countries'
import { sectorLabel } from '@/config/sectors'
import { Badge } from '@/components/ui/Badge'

interface EntrepriseTableProps {
  data: Entreprise[]
  onEdit: (e: Entreprise) => void
  onDelete: (e: Entreprise) => void
}

export function EntrepriseTable({ data, onEdit, onDelete }: EntrepriseTableProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const navigate = useNavigate()

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">{t('common.empty')}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line-dark text-xs text-muted">
            <th className="px-3 py-2 font-medium">{t('entreprise.nom')}</th>
            <th className="px-3 py-2 font-medium">{t('entreprise.pays')}</th>
            <th className="px-3 py-2 font-medium">{t('entreprise.secteur')}</th>
            <th className="px-3 py-2 font-medium">Ecobank</th>
            <th className="px-3 py-2 text-right font-medium">{t('common.edit')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((e) => (
            <tr
              key={e.id}
              className="cursor-pointer border-b border-line-dark/50 transition hover:bg-ink-soft/60"
              onClick={() => navigate(`/entreprises/${e.id}`)}
            >
              <td className="px-3 py-2.5 font-medium text-ink-text">
                <div className="flex items-center gap-2">
                  {e.nom}
                  {e.site_web && <ExternalLink size={12} className="text-muted" />}
                </div>
              </td>
              <td className="px-3 py-2.5 text-muted">{countryName(e.pays, lang)}</td>
              <td className="px-3 py-2.5 text-muted">{sectorLabel(e.secteur, lang)}</td>
              <td className="px-3 py-2.5">
                {e.presence_ecobank ? (
                  <Badge color="#c9a44d">{t('common.yes')}</Badge>
                ) : (
                  <span className="text-muted">{t('common.no')}</span>
                )}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation()
                      onEdit(e)
                    }}
                    className="rounded p-1.5 text-muted hover:bg-ink hover:text-gold"
                    aria-label={t('common.edit')}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation()
                      onDelete(e)
                    }}
                    className="rounded p-1.5 text-muted hover:bg-ink hover:text-red-400"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}