import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, CheckCircle2, AlertTriangle } from 'lucide-react'
import { parseEntreprisesCsv, type ParseResult } from '@/lib/csvImport'
import type { EntrepriseFields } from '@/hooks/useEntreprises'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/lib/toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { countryName } from '@/config/countries'

interface ImportDialogProps {
  open: boolean
  teamId: string | null
  onClose: () => void
  onImported: () => void
}

type Phase = 'idle' | 'parsing' | 'preview' | 'importing' | 'done'

export function ImportDialog({ open, teamId, onClose, onImported }: ImportDialogProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<ParseResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [importedCount, setImportedCount] = useState(0)
  const [errors, setErrors] = useState<string[]>([])

  function reset() {
    setPhase('idle')
    setResult(null)
    setFileName('')
    setImportedCount(0)
    setErrors([])
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleFile(file: File) {
    setFileName(file.name)
    setPhase('parsing')
    const text = await file.text()
    // BOM removal éventuel
    const cleaned = text.replace(/^﻿/, '')
    const res = parseEntreprisesCsv(cleaned)
    setResult(res)
    setPhase('preview')
  }

  async function handleImport() {
    if (!result || !teamId) return
    setPhase('importing')
    setErrors([])

    // team_id FORCÉ — jamais confiance au CSV (RLS WITH CHECK protège aussi).
    // Shape uniforme (clés identiques sur toutes les lignes) : PostgREST exige
    // que tous les objets d'un batch POST aient exactement les mêmes clés.
    const rows = result.valid.map((r) => {
      const f = r.fields as EntrepriseFields
      return {
        team_id: teamId,
        nom: f.nom,
        pays: f.pays,
        secteur: f.secteur,
        presence_ecobank: f.presence_ecobank,
        site_web: f.site_web ?? null,
        notes: f.notes ?? null,
      }
    })

    const { data, error } = await supabase
      .from('entreprises')
      .insert(rows)
      .select('id')

    if (error) {
      toast.error(t('toast.error'))
      setErrors([error.message])
      setPhase('preview')
      return
    }

    const count = (data ?? []).length
    setImportedCount(count)
    toast.success(t('toast.imported', { count }))
    setPhase('done')
    onImported()
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('common.import')} className="max-w-2xl">
      <div className="flex flex-col gap-4">
        {/* Instructions / format attendu */}
        {phase === 'idle' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              {t('entreprise.plural')} — CSV (UTF-8). Colonnes attendues :
              <code className="ml-1 rounded bg-ink-soft px-1.5 py-0.5 text-xs text-ink-text">
                nom, pays, secteur, presence_ecobank, site_web, notes
              </code>
            </p>
            <p className="text-xs text-muted">
              pays = code ISO (ex. SEN, CIV) · secteur parmi : Banque, Assurance, Microfinance,
              Télécom, ONG/institution, Entreprise privée, Autre · presence_ecobank = oui/non.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-dark py-10 text-muted transition hover:border-gold/50 hover:text-gold"
            >
              <Upload size={28} />
              <span className="text-sm">{t('common.import')} — .csv</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFile(f)
              }}
            />
          </div>
        )}

        {phase === 'parsing' && (
          <div className="flex justify-center py-10"><Spinner size={28} /></div>
        )}

        {phase === 'preview' && result && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm">
              <FileText size={16} className="text-muted" />
              <span className="text-ink-text">{fileName}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1 text-ink-text">
                <CheckCircle2 size={15} className="text-green-400" />
                {result.valid.length} valides
              </span>
              <span className="inline-flex items-center gap-1 text-red-300">
                <AlertTriangle size={15} />
                {result.invalid.length} invalides
              </span>
            </div>

            {result.invalid.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-red-500/30 bg-red-500/5 p-2 text-xs">
                {result.invalid.slice(0, 50).map((r) => (
                  <div key={r.rowNumber} className="text-red-300">
                    L{r.rowNumber} : {r.errors.join(', ')}
                  </div>
                ))}
                {result.invalid.length > 50 && (
                  <div className="text-muted">+{result.invalid.length - 50}…</div>
                )}
              </div>
            )}

            {result.valid.length > 0 && (
              <div className="max-h-64 overflow-auto rounded-lg border border-line-dark">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-ink-soft text-muted">
                    <tr>
                      <th className="px-2 py-1.5 font-medium">L</th>
                      <th className="px-2 py-1.5 font-medium">Nom</th>
                      <th className="px-2 py-1.5 font-medium">Pays</th>
                      <th className="px-2 py-1.5 font-medium">Secteur</th>
                      <th className="px-2 py-1.5 font-medium">Ecobank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.valid.slice(0, 100).map((r) => (
                      <tr key={r.rowNumber} className="border-t border-line-dark/40">
                        <td className="px-2 py-1.5 text-muted">{r.rowNumber}</td>
                        <td className="px-2 py-1.5 text-ink-text">{r.fields?.nom}</td>
                        <td className="px-2 py-1.5 text-muted">{countryName(r.fields?.pays, lang)}</td>
                        <td className="px-2 py-1.5 text-muted">{r.fields?.secteur}</td>
                        <td className="px-2 py-1.5 text-muted">
                          {r.fields?.presence_ecobank ? t('common.yes') : t('common.no')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.valid.length > 100 && (
                  <p className="p-2 text-center text-xs text-muted">
                    +{result.valid.length - 100} lignes…
                  </p>
                )}
              </div>
            )}

            {errors.length > 0 && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-2 text-xs text-red-300">
                {errors.join(', ')}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={reset}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleImport}
                disabled={result.valid.length === 0}
              >
                {t('common.import')} ({result.valid.length})
              </Button>
            </div>
          </div>
        )}

        {phase === 'importing' && (
          <div className="flex justify-center py-10"><Spinner size={28} /></div>
        )}

        {phase === 'done' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 size={36} className="text-green-400" />
            <p className="font-serif text-lg text-ink-text">
              {t('toast.imported', { count: importedCount })}
            </p>
            <Button variant="primary" size="sm" onClick={handleClose}>
              {t('common.close')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}