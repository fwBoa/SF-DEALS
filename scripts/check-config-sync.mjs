#!/usr/bin/env node
/**
 * Vérifie la cohérence entre les listes de config TS (src/config/*.ts) et les
 * contraintes CHECK du schéma SQL (supabase/migrations/0001_init_schema.sql).
 *
 * Les valeurs pilotées par la config (pays, secteur, étape, source) sont
 * dupliquées entre TS et SQL : ce test garantit qu'elles restent synchronisées.
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(resolve(root, p), 'utf8')

const sql = read('supabase/migrations/0001_init_schema.sql')

/** Extrait la liste de chaînes d'un `in (...)` SQL pour une colonne donnée. */
function sqlCheckValues(column) {
  const re = new RegExp(column + '\\s+text[^;]*?check\\s*\\(\\s*' + column + '\\s+in\\s*\\(([^)]+)\\)', 'i')
  const m = sql.match(re)
  if (!m) throw new Error(`CHECK introuvable pour la colonne ${column}`)
  return m[1].match(/'([^']+)'/g).map((s) => s.slice(1, -1))
}

/** Extrait les `id: '...'` d'un fichier de config TS. */
function tsIds(file, field = 'id') {
  const src = read(file)
  const re = new RegExp(field + "\\s*:\\s*'([^']+)'", 'g')
  const out = []
  let m
  while ((m = re.exec(src))) out.push(m[1])
  return out
}

let failures = 0
function compare(name, tsValues, sqlValues) {
  const ts = new Set(tsValues)
  const sql = new Set(sqlValues)
  const missingInSql = [...ts].filter((v) => !sql.has(v))
  const missingInTs = [...sql].filter((v) => !ts.has(v))
  if (missingInSql.length || missingInTs.length) {
    failures++
    console.error(`✗ ${name} : désynchronisé`)
    if (missingInSql.length) console.error(`   présents en TS mais absents du CHECK SQL : ${missingInSql.join(', ')}`)
    if (missingInTs.length) console.error(`   présents dans le CHECK SQL mais absents en TS : ${missingInTs.join(', ')}`)
  } else {
    console.log(`✓ ${name} (${tsValues.length} valeurs)`)
  }
}

// pays : colonne `pays`, valeurs depuis countries.ts (champ `code`)
compare('pays', tsIds('src/config/countries.ts', 'code'), sqlCheckValues('pays'))
// secteur
compare('secteur', tsIds('src/config/sectors.ts'), sqlCheckValues('secteur'))
// étape_pipeline
compare('etape_pipeline', tsIds('src/config/pipeline.ts'), sqlCheckValues('etape_pipeline'))
// source
compare('source', tsIds('src/config/sources.ts'), sqlCheckValues('source'))

if (failures > 0) {
  console.error(`\n${failures} désynchronisation(s) détectée(s).`)
  process.exit(1)
}
console.log('\nToutes les listes de config sont synchronisées avec le schéma SQL.')