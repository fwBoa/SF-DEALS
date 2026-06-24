import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Pencil, Trash2, Globe, Mail, Phone, Link } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { Entreprise, Contact } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'
import { useContacts, type ContactFields } from '@/hooks/useContacts'
import { useOpportunities } from '@/hooks/useOpportunities'
import { countryName } from '@/config/countries'
import { sectorLabel } from '@/config/sectors'
import { stageLabel } from '@/config/pipeline'
import { formatMoney } from '@/config/currencies'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ContactForm } from '@/components/contacts/ContactForm'
import { OpportuniteForm } from '@/components/opportunities/OpportuniteForm'
import { useToast } from '@/lib/toast'

export function EntrepriseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const { teamId } = useAuth()
  const toast = useToast()

  const [entreprise, setEntreprise] = useState<Entreprise | null>(null)
  const [loadingEnt, setLoadingEnt] = useState(true)

  const { data: contacts, loading: loadingC, create: createContact, update: updateContact, remove: removeContact } =
    useContacts({ entrepriseId: id })
  const { data: opps, create: createOpp } = useOpportunities(
    { search: '', pays: '', secteur: '', segment: '', ecobank: '' },
    { entrepriseId: id },
  )

  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [oppFormOpen, setOppFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Entreprise | null>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('entreprises')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error(t('toast.error'))
        setEntreprise(data)
        setLoadingEnt(false)
      })
  }, [id, toast, t])

  async function deleteEntreprise() {
    if (!toDelete) return
    const { error } = await supabase.from('entreprises').delete().eq('id', toDelete.id)
    setToDelete(null)
    if (error) {
      toast.error(t('toast.error'))
      return
    }
    toast.success(t('toast.deleted'))
    navigate('/entreprises')
  }

  if (loadingEnt) return <div className="p-6"><Spinner /></div>
  if (!entreprise) return <div className="p-6 text-muted">{t('common.empty')}</div>

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/entreprises')}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-gold"
      >
        <ArrowLeft size={15} /> {t('common.back')}
      </button>

      <PageHeader
        title={entreprise.nom}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setToDelete(entreprise)}>
              <Trash2 size={14} /> {t('common.delete')}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Infos */}
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Badge color="#c9a44d">{countryName(entreprise.pays, lang)}</Badge>
            <Badge>{sectorLabel(entreprise.secteur, lang)}</Badge>
            {entreprise.presence_ecobank && <Badge color="#7ea25a">Ecobank</Badge>}
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            {entreprise.site_web && (
              <div className="flex items-center gap-2 text-muted">
                <Globe size={15} />
                <a href={entreprise.site_web} target="_blank" rel="noreferrer" className="text-gold hover:underline">
                  {entreprise.site_web}
                </a>
              </div>
            )}
          </dl>
          {entreprise.notes && (
            <p className="mt-4 whitespace-pre-wrap rounded-md border border-line-dark bg-ink p-3 text-sm text-muted">
              {entreprise.notes}
            </p>
          )}
        </Card>

        {/* Opportunités */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {t('entreprise.opportunities')}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setOppFormOpen(true)}>
              <Plus size={14} />
            </Button>
          </div>
          {opps.length === 0 ? (
            <p className="text-sm text-muted">{t('common.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {opps.map((o) => (
                <li key={o.id} className="rounded-md border border-line-dark bg-ink p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink-text">{o.intitule || '—'}</span>
                    <span className="text-xs text-gold">{formatMoney(o.valeur_estimee, o.devise)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <Badge color="#9c8b5e">{stageLabel(o.etape_pipeline, lang)}</Badge>
                    {o.date_prochaine_action && (
                      <span className="text-xs text-muted">{o.date_prochaine_action}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Contacts */}
      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {t('entreprise.contacts')} ({contacts.length})
          </h3>
          <Button variant="primary" size="sm" onClick={() => { setEditingContact(null); setContactFormOpen(true) }}>
            <Plus size={14} /> {t('contact.new')}
          </Button>
        </div>
        {loadingC ? (
          <Spinner />
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted">{t('common.empty')}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((c) => (
              <div key={c.id} className="group rounded-md border border-line-dark bg-ink p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-ink-text">{c.nom}</p>
                    {c.fonction && <p className="text-xs text-muted">{c.fonction}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => { setEditingContact(c); setContactFormOpen(true) }} className="rounded p-1 text-muted hover:text-gold">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => removeContact(c.id)} className="rounded p-1 text-muted hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted">
                  {c.email && <div className="flex items-center gap-1.5"><Mail size={12} /> {c.email}</div>}
                  {c.telephone_whatsapp && <div className="flex items-center gap-1.5"><Phone size={12} /> {c.telephone_whatsapp}</div>}
                  {c.linkedin && <div className="flex items-center gap-1.5"><Link size={12} /> <a href={c.linkedin} target="_blank" rel="noreferrer" className="hover:text-gold">LinkedIn</a></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {contactFormOpen && (
        <ContactForm
          open={contactFormOpen}
          initial={editingContact}
          entrepriseId={id!}
          onSubmit={async (input: ContactFields & { entreprise_id: string }) => {
            if (!teamId) return false
            if (editingContact) return updateContact(editingContact.id, input)
            const created = await createContact({ ...input, team_id: teamId })
            return !!created
          }}
          onClose={() => setContactFormOpen(false)}
        />
      )}

      {oppFormOpen && (
        <OpportuniteForm
          open={oppFormOpen}
          initial={null}
          entrepriseId={id!}
          entreprises={[entreprise]}
          onSubmit={async (input) => {
            if (!teamId) return false
            const created = await createOpp({ ...input, team_id: teamId })
            return !!created
          }}
          onClose={() => setOppFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={t('common.delete')}
        message={t('entreprise.delete_confirm')}
        onConfirm={deleteEntreprise}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}