import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Opportunite, Entreprise } from '@/lib/types'
import { PIPELINE_STAGES } from '@/config/pipeline'
import { DEVISES } from '@/config/currencies'
import { SOURCES } from '@/config/sources'
import { SEGMENTS } from '@/config/segments'
import { countryName } from '@/config/countries'
import { useContacts } from '@/hooks/useContacts'
import type { OpportuniteFields } from '@/hooks/useOpportunities'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

interface OpportuniteFormProps {
  open: boolean
  initial: Opportunite | null
  entrepriseId: string | null
  entreprises?: Entreprise[]
  onSubmit: (input: OpportuniteFields & { entreprise_id: string; contact_principal_id: string | null }) => Promise<boolean>
  onClose: () => void
}

export function OpportuniteForm({
  open,
  initial,
  entrepriseId,
  entreprises,
  onSubmit,
  onClose,
}: OpportuniteFormProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'

  const [entId, setEntId] = useState<string>(entrepriseId ?? entreprises?.[0]?.id ?? '')
  const { data: contacts } = useContacts({ entrepriseId: entId || undefined })

  const [intitule, setIntitule] = useState(initial?.intitule ?? '')
  const [contactId, setContactId] = useState<string>(initial?.contact_principal_id ?? '')
  const [etape, setEtape] = useState<string>(initial?.etape_pipeline ?? 'Lead')
  const [valeur, setValeur] = useState(initial?.valeur_estimee?.toString() ?? '')
  const [devise, setDevise] = useState<string>(initial?.devise ?? 'XOF')
  const [source, setSource] = useState<string>(initial?.source ?? 'réseau')
  const [segment, setSegment] = useState<string>(initial?.segment_abc ?? '')
  const [score, setScore] = useState(initial?.score_priorite?.toString() ?? '')
  const [dernier, setDernier] = useState(initial?.date_dernier_contact ?? '')
  const [prochaine, setProchaine] = useState(initial?.date_prochaine_action ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [busy, setBusy] = useState(false)

  const key = initial?.id ?? 'new'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!entId) return
    setBusy(true)
    const ok = await onSubmit({
      intitule: intitule.trim() || null,
      entreprise_id: entId,
      contact_principal_id: contactId || null,
      etape_pipeline: etape as Opportunite['etape_pipeline'],
      valeur_estimee: valeur ? Number(valeur) : null,
      devise: devise as Opportunite['devise'],
      source: (source || null) as Opportunite['source'],
      segment_abc: (segment || null) as Opportunite['segment_abc'],
      score_priorite: score ? Number(score) : null,
      date_dernier_contact: dernier || null,
      date_prochaine_action: prochaine || null,
      notes: notes.trim() || null,
    })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? t('opportunite.edit') : t('opportunite.new')} className="max-w-2xl">
      <form key={key} onSubmit={submit} className="space-y-4">
        <Input label={t('opportunite.intitule')} value={intitule} onChange={(e) => setIntitule(e.target.value)} autoFocus />

        {!entrepriseId && entreprises && (
          <Select label={t('opportunite.entreprise')} value={entId} onChange={(e) => { setEntId(e.target.value); setContactId('') }} required>
            {entreprises.map((e) => (
              <option key={e.id} value={e.id}>{e.nom} · {countryName(e.pays, lang)}</option>
            ))}
          </Select>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select label={t('opportunite.contact_principal')} value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </Select>
          <Select label={t('opportunite.etape')} value={etape} onChange={(e) => setEtape(e.target.value)}>
            {PIPELINE_STAGES.map((s) => (
              <option key={s.id} value={s.id}>{lang === 'fr' ? s.label_fr : s.label_en}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input label={t('opportunite.valeur')} type="number" value={valeur} onChange={(e) => setValeur(e.target.value)} />
          <Select label={t('opportunite.devise')} value={devise} onChange={(e) => setDevise(e.target.value)}>
            {DEVISES.map((d) => (<option key={d.id} value={d.id}>{d.id}</option>))}
          </Select>
          <Select label={t('opportunite.source')} value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map((s) => (<option key={s.id} value={s.id}>{lang === 'fr' ? s.label_fr : s.label_en}</option>))}
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Select label={t('opportunite.segment')} value={segment} onChange={(e) => setSegment(e.target.value)}>
            <option value="">—</option>
            {SEGMENTS.map((s) => (<option key={s.id} value={s.id}>{s.id}</option>))}
          </Select>
          <Input label={t('opportunite.score')} type="number" min={0} max={10} value={score} onChange={(e) => setScore(e.target.value)} />
          <div />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label={t('opportunite.date_dernier_contact')} type="date" value={dernier} onChange={(e) => setDernier(e.target.value)} />
          <Input label={t('opportunite.date_prochaine_action')} type="date" value={prochaine} onChange={(e) => setProchaine(e.target.value)} />
        </div>

        <Textarea label={t('opportunite.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={busy || !entId}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  )
}