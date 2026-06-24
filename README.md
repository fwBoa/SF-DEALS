# SF Deals — CRM de prospection B2B

CRM de prospection pour l'Afrique de l'Ouest et le réseau Ecobank (33 pays).
Suivi d'entreprises, contacts, opportunités ; pipeline kanban, dashboard,
rappels, export/import CSV. Interface FR/EN.

## Stack

- **Front** : React 19 + Vite 8 + TypeScript 6 + Tailwind CSS v4
- **Back** : Supabase (Postgres + Auth + REST API), RLS team-scoped
- **i18n** : react-i18next (FR/EN) · **Charts** : recharts · **Drag&drop** : @dnd-kit

## Démarrage (local)

```bash
npm install
cp .env.example .env.local   # renseigner VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
supabase start                # stack Docker locale
supabase db reset             # applique migrations + seed (utilisateur dev inclus)
npm run dev                   # http://localhost:5173
```

**Compte démo** : `dev@sfdeals.local` / `sfdeals123`

## Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | serveur Vite |
| `npm run build` | build prod (`tsc -b && vite build`) |
| `npm run typecheck` | vérif de types |
| `npm run check` | synchro listes config TS ↔ contraintes CHECK SQL |
| `npm run smoke` | test navigateur Playwright (démarre le dev server avant) |
| `npm run lint` | oxlint |

## Architecture

- **Multi-utilisateur dès le schéma** : appartenance par `team_id`
  (`teams` + `team_members`). V1 = 1 équipe / 1 membre ; V2 = ajouter un
  membre qui voit immédiatement les mêmes données (RLS `team_id in
  current_user_teams()`). Pas de migration.
- **Config-driven** : les listes (pays, secteurs, étapes, sources, segments,
  devises, types d'activité) vivent dans `src/config/*` et sont mirrorées en
  contraintes `CHECK` SQL. `npm run check` vérifie la cohérence.
- **Sécurité** : RLS sur toutes les tables ; UPDATE avec `USING` + `WITH CHECK`
  (anti-BOLA) ; `team_id` forcé côté app, jamais lu depuis un CSV d'import ;
  `service_role` jamais exposé côté client (clé anon uniquement).

## Déploiement (Vercel + Supabase cloud)

1. **Supabase cloud**
   - Créer un projet sur https://supabase.com
   - `supabase link --project-ref <ref>`
   - `supabase db push` (applique les migrations)
   - Créer l'utilisateur de production via Dashboard → Authentication.
     Récupérer l'`anon key` (Project Settings → API).

2. **Vercel**
   - Importer le repo GitHub.
   - Framework preset : **Vite**.
   - Variables d'environnement (Production + Preview) :
     - `VITE_SUPABASE_URL` = `https://<ref>.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `<anon key>`
   - Build command : `npm run build` · Output : `dist`
   - `vercel.json` fournit le rewrite SPA (routes client) + cache des assets.

3. **Vérif** : `npm run smoke` (local) puis smoke manuel sur l'URL live.

## Vérification end-to-end

Voir `scripts/smoke.mjs` (Playwright) : auth, dashboard, kanban, listes,
rappels, détail opportunité + journal d'activité, bascule FR/EN.