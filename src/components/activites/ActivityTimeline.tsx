import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, CalendarClock, CircleDot, Plus, Trash2 } from 'lucide-react'
import type { ActivityTypeId } from '@/config/activityTypes'
import { ACTIVITY_TYPES, activityTypeLabel } from '@/config/activityTypes'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

const ICONS: Record<ActivityTypeId, typeof Phone> = {
  appel: Phone,
  email: Mail,
  rdv: CalendarClock,
  autre: CircleDot,
}

interface ActivityTimelineProps {
  activites: {
    id: string
    type: ActivityTypeId
    date: string
    commentaire: string | null
  }[]
  loading: boolean
  onCreate: (input: {
    type: ActivityTypeId
    date: string
    commentaire: string | null
  }) => Promise<unknown>
  onDelete?: (id: string) => Promise<unknown>
  lastContact?: string | null
}

export function ActivityTimeline({
  activites,
  loading,
  onCreate,
  onDelete,
  lastContact,
}: ActivityTimelineProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'

  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ActivityTypeId>('appel')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    await onCreate({ type, date, commentaire: commentaire.trim() || null })
    setSaving(false)
    setOpen(false)
    setCommentaire('')
    setType('appel')
    setDate(new Date().toISOString().slice(0, 10))
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="font-serif text-lg text-ink-text">{t('activite.title')}</h2>
          {lastContact && (
            <span className="text-xs text-muted">
              {t('activite.last_contact')} : {lastContact}
            </span>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)}>
          <Plus size={15} /> {t('activite.new')}
        </Button>
      </div>

      {open && (
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-line-dark/60 bg-ink p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label={t('activite.type')}
              name="activite_type"
              value={type}
              onChange={(e) => setType(e.target.value as ActivityTypeId)}
            >
              {ACTIVITY_TYPES.map((a) => (
                <option key={a.id} value={a.id}>
                  {activityTypeLabel(a.id, lang)}
                </option>
              ))}
            </Select>
            <Input
              label={t('activite.date')}
              type="date"
              name="activite_date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Textarea
            label={t('activite.commentaire')}
            name="activite_commentaire"
            rows={2}
            placeholder={t('activite.placeholder_commentaire')}
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={submit} disabled={saving || !date}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-sm text-muted">{t('common.loading')}</p>
      ) : activites.length === 0 ? (
        <EmptyState title={t('activite.empty')} />
      ) : (
        <ol className="relative flex flex-col gap-3 border-l border-line-dark/50 pl-4">
          {activites.map((a) => {
            const Icon = ICONS[a.type] ?? CircleDot
            return (
              <li key={a.id} className="relative">
                <span className="absolute -left-[26px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-soft text-gold">
                  <Icon size={12} />
                </span>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink-text">
                        {activityTypeLabel(a.type, lang)}
                      </span>
                      <span className="text-xs text-muted">{a.date}</span>
                    </div>
                    {a.commentaire && (
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted">
                        {a.commentaire}
                      </p>
                    )}
                  </div>
                  {onDelete && (
                    <button
                      onClick={() => void onDelete(a.id)}
                      className={cn('shrink-0 rounded p-1 text-muted hover:text-red-400')}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}