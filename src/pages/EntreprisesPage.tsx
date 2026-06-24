import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Download } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useEntreprises, type EntrepriseFields } from '@/hooks/useEntreprises'
import type { Entreprise, Filters } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FilterBar, emptyFilters } from '@/components/filters/FilterBar'
import { EntrepriseTable } from '@/components/entreprises/EntrepriseTable'
import { EntrepriseForm } from '@/components/entreprises/EntrepriseForm'
import { exportCsv, timestampSlug } from '@/lib/csv'
import { useToast } from '@/lib/toast'
import { sectorLabel } from '@/config/sectors'

export function EntreprisesPage() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const { teamId } = useAuth()
  const toast = useToast()
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const { data, loading, create, update, remove } = useEntreprises(filters)

  function handleExport() {
    exportCsv(
      data,
      [
        { header: 'Nom', value: (e) => e.nom },
        { header: 'Pays', value: (e) => e.pays },
        { header: 'Secteur', value: (e) => sectorLabel(e.secteur, lang) },
        { header: 'Présence Ecobank', value: (e) => (e.presence_ecobank ? t('common.yes') : t('common.no')) },
        { header: 'Site web', value: (e) => e.site_web ?? '' },
        { header: 'Notes', value: (e) => e.notes ?? '' },
      ],
      `entreprises-${timestampSlug()}`,
    )
    toast.success(t('toast.exported'))
  }

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Entreprise | null>(null)
  const [toDelete, setToDelete] = useState<Entreprise | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(e: Entreprise) {
    setEditing(e)
    setFormOpen(true)
  }

  async function handleSubmit(input: EntrepriseFields) {
    if (!teamId) return false
    if (editing) return update(editing.id, input)
    const created = await create({ ...input, team_id: teamId })
    return !!created
  }

  return (
    <div className="p-6">
      <PageHeader
        title={t('entreprise.plural')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={loading || data.length === 0}
            >
              <Download size={15} />
              {t('common.export')}
            </Button>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={15} />
              {t('entreprise.new')}
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <FilterBar value={filters} onChange={setFilters} />
      </Card>

      <Card>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <EntrepriseTable data={data} onEdit={openEdit} onDelete={setToDelete} />
        )}
      </Card>

      {formOpen && (
        <EntrepriseForm
          open={formOpen}
          initial={editing}
          onSubmit={handleSubmit}
          onClose={() => setFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={t('common.delete')}
        message={t('entreprise.delete_confirm')}
        onConfirm={async () => {
          if (toDelete) await remove(toDelete.id)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}