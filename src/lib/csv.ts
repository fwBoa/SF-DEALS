/**
 * Export CSV — RFC 4180.
 *
 * Échappe les valeurs contenant virgule, guillemet ou retour ligne en les
 * encadrant de guillemets doubles (et en doublant les guillemets internes).
 * Séparateur : virgule. Fin de ligne : CRLF (compat Excel/Numbers).
 * BOM UTF-8 en tête pour qu'Excel lise l'encodage correctement.
 */

const BOM = '﻿'

/** Sérialise une valeur cellule en CSV sécurisé. */
function escapeCell(value: unknown): string {
  if (value == null) return ''
  let str = typeof value === 'string' ? value : String(value)
  if (/[",\r\n]/.test(str)) {
    str = '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export interface CsvColumn<T> {
  /** En-tête de colonne. */
  header: string
  /** Accès à la valeur depuis une ligne. */
  value: (row: T) => unknown
}

/**
 * Génère le contenu CSV (chaîne) à partir de lignes et de définitions de colonnes.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeCell(c.header)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.value(row))).join(','))
    .join('\r\n')
  return BOM + head + (rows.length ? '\r\n' + body : '') + (rows.length ? '' : '')
}

/**
 * Déclenche le téléchargement d'un fichier CSV côté navigateur.
 */
export function exportCsv<T>(rows: T[], columns: CsvColumn<T>[], filename: string): void {
  const csv = toCsv(rows, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // libère l'URL après le clic
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Horodatage AAAAMMJJ-HHMM pour les noms de fichier. */
export function timestampSlug(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}