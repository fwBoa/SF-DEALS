import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Entreprise } from '@/lib/types'
import { COUNTRIES, countryName } from '@/config/countries'
import { SECTORS } from '@/config/sectors'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { EntrepriseFields } from '@/hooks/useEntreprises'

interface EntrepriseFormProps {
  open: boolean
  initial: Entreprise | null
  onSubmit: (input: EntrepriseFields) => Promise<boolean>
  onClose: () => void
}

export function EntrepriseForm({ open, initial, onSubmit, onClose }: EntrepriseFormProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [pays, setPays] = useState<string>(initial?.pays ?? 'CIV')
  const [secteur, setSecteur] = useState<string>(initial?.secteur ?? 'Banque')
  const [ecobank, setEcobank] = useState(initial?.presence_ecobank ?? true)
  const [siteWeb, setSiteWeb] = useState(initial?.site_web ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [busy, setBusy] = useState(false)

  // réinitialise quand on ouvre pour un nouvel objet
  const key = initial?.id ?? 'new'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const ok = await onSubmit({
      nom: nom.trim(),
      pays: pays as EntrepriseFields['pays'],
      secteur: secteur as EntrepriseFields['secteur'],
      presence_ecobank: ecobank,
      site_web: siteWeb.trim() || null,
      notes: notes.trim() || null,
    })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? t('entreprise.edit') : t('entreprise.new')}
    >
      <form key={key} onSubmit={submit} className="space-y-4">
        <Input
          label={t('entreprise.nom')}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <Select label={t('entreprise.pays')} value={pays} onChange={(e) => setPays(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {countryName(c.code, lang)}
              </option>
            ))}
          </Select>
          <Select
            label={t('entreprise.secteur')}
            value={secteur}
            onChange={(e) => setSecteur(e.target.value)}
          >
            {SECTORS.map((s) => (
              <option key={s.id} value={s.id}>
                {lang === 'fr' ? s.label_fr : s.label_en}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-text">
          <input
            type="checkbox"
            checked={ecobank}
            onChange={(e) => setEcobank(e.target.checked)}
            className="accent-gold"
          />
          {t('entreprise.presence_ecobank')}
        </label>
        <Input
          label={t('entreprise.site_web')}
          value={siteWeb}
          onChange={(e) => setSiteWeb(e.target.value)}
          placeholder="https://"
        />
        <Textarea label={t('entreprise.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={busy || !nom.trim()}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}