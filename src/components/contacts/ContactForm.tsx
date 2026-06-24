import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Contact, Entreprise } from '@/lib/types'
import { countryName } from '@/config/countries'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { ContactFields } from '@/hooks/useContacts'

interface ContactFormProps {
  open: boolean
  initial: Contact | null
  /** Entreprise imposée (page détail) ; sinon liste déroulante. */
  entrepriseId: string | null
  entreprises?: Entreprise[]
  onSubmit: (input: ContactFields & { entreprise_id: string }) => Promise<boolean>
  onClose: () => void
}

export function ContactForm({
  open,
  initial,
  entrepriseId,
  entreprises,
  onSubmit,
  onClose,
}: ContactFormProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [fonction, setFonction] = useState(initial?.fonction ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.telephone_whatsapp ?? '')
  const [linkedin, setLinkedin] = useState(initial?.linkedin ?? '')
  const [entId, setEntId] = useState<string>(entrepriseId ?? entreprises?.[0]?.id ?? '')
  const [busy, setBusy] = useState(false)

  const key = initial?.id ?? 'new'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!entId) return
    setBusy(true)
    const ok = await onSubmit({
      nom: nom.trim(),
      fonction: fonction.trim() || null,
      email: email.trim() || null,
      telephone_whatsapp: phone.trim() || null,
      linkedin: linkedin.trim() || null,
      entreprise_id: entId,
    })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? t('contact.edit') : t('contact.new')}>
      <form key={key} onSubmit={submit} className="space-y-4">
        <Input label={t('contact.nom')} value={nom} onChange={(e) => setNom(e.target.value)} required autoFocus />
        {!entrepriseId && entreprises && (
          <Select label={t('contact.entreprise')} value={entId} onChange={(e) => setEntId(e.target.value)} required>
            {entreprises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom} · {countryName(e.pays, lang)}
              </option>
            ))}
          </Select>
        )}
        <Input label={t('contact.fonction')} value={fonction} onChange={(e) => setFonction(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('contact.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label={t('contact.telephone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Input label={t('contact.linkedin')} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={busy || !nom.trim() || !entId}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}