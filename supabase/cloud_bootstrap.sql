-- ==========================================================================
-- SF Deals — Bootstrap CLOUD (à exécuter UNE fois dans le SQL Editor du
-- projet Supabase cloud : Dashboard > SQL Editor > New query > Run).
--
-- Crée le schéma complet + RLS + indexes + triggers + données seed
-- (utilisateur dev dev@sfdeals.local / sfdeals123 + 1 équipe + ~10 entreprises
-- + contacts + opportunités couvrant toutes les étapes).
--
-- Idempotent : un préambule nettoie tout objet SF Deals préexistant, donc on
-- peut re-exécuter sans erreur. Ne touche pas au reste du projet.
-- ==========================================================================

-- ---- Préambule : nettoyage des objets SF Deals (si présents) ----
drop table if exists public.activites cascade;
drop table if exists public.opportunites cascade;
drop table if exists public.contacts cascade;
drop table if exists public.entreprises cascade;
drop table if exists public.team_members cascade;
drop table if exists public.teams cascade;
drop function if exists public.current_user_teams() cascade;
drop function if exists public.touch_updated_at() cascade;
drop function if exists public.assert_contact_same_team() cascade;
drop function if exists public.assert_opp_same_team() cascade;
drop type if exists public.devise_t cascade;
drop type if exists public.segment_abc_t cascade;
drop type if exists public.activite_type_t cascade;
drop type if exists public.team_role_t cascade;
-- ==========================================================================
-- 0001_init_schema.sql
-- ==========================================================================
-- ==========================================================================
-- SF Deals — Schéma initial
-- Modèle d'appartenance : team_id (teams + team_members) pour permettre
-- un 2e utilisateur (collaborateur / père) en V2 sans migration douloureuse.
-- ==========================================================================

create extension if not exists "pgcrypto";

-- ===== Enums (listes stables, intégrité référentielle utile) =====
create type devise_t        as enum ('XOF', 'EUR', 'USD');
create type segment_abc_t    as enum ('A', 'B', 'C');
create type activite_type_t as enum ('appel', 'email', 'rdv', 'autre');
create type team_role_t     as enum ('owner', 'collaborator');

-- ===== Équipes & membres (multi-utilisateur dès la base) =====
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table public.team_members (
  team_id     uuid not null references public.teams(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        team_role_t not null default 'owner',
  created_at  timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- ===== Entreprises =====
-- pays / secteur / etape_pipeline en TEXT + CHECK : les valeurs sont pilotées
-- par les fichiers de config TS (src/config/*), éditables sans redevelopper.
-- Le CHECK garantit l'intégrité ; un test de synchro vérifie la cohérence.
create table public.entreprises (
  id                uuid primary key default gen_random_uuid(),
  team_id           uuid not null references public.teams(id) on delete cascade,
  nom               text not null,
  pays              text not null check (pays in (
    'CIV','GHA','SEN','NGA','TGO','BEN','BFA','MLI','NER','GMB','GIN','GNB','SLE','LBR','CPV',
    'CMR','TCD','CAF','COG','COD','GNQ','GAB','KEN','RWA','BDI','TZA','UGA','SSD','MWI','MOZ','ZMB','ZWE','STP'
  )),
  secteur           text not null check (secteur in (
    'Banque','Assurance','Microfinance','Télécom','ONG/institution','Entreprise privée','Autre'
  )),
  presence_ecobank  boolean not null default false,
  site_web          text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ===== Contacts =====
create table public.contacts (
  id                  uuid primary key default gen_random_uuid(),
  entreprise_id       uuid not null references public.entreprises(id) on delete cascade,
  team_id             uuid not null references public.teams(id) on delete cascade,
  nom                 text not null,
  fonction            text,
  email               text,
  telephone_whatsapp  text,
  linkedin            text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ===== Opportunités =====
create table public.opportunites (
  id                   uuid primary key default gen_random_uuid(),
  entreprise_id        uuid not null references public.entreprises(id) on delete cascade,
  contact_principal_id uuid references public.contacts(id) on delete set null,
  team_id              uuid not null references public.teams(id) on delete cascade,
  etape_pipeline       text not null default 'Lead'
    check (etape_pipeline in (
      'Lead','Contacté','Rendez-vous obtenu','Proposition envoyée','Négociation','Gagné','Perdu'
    )),
  intitule             text,  -- titre court de l'opportunité
  valeur_estimee       numeric(14,2),
  devise               devise_t not null default 'XOF',
  source               text check (source in (
    'réseau','recommandation','prospection directe','événement','autre'
  )),
  segment_abc          segment_abc_t,
  score_priorite       int check (score_priorite between 0 and 10),
  date_dernier_contact date,
  date_prochaine_action date,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ===== Activités (journal horodaté — V1.1, schéma prêt) =====
create table public.activites (
  id              uuid primary key default gen_random_uuid(),
  opportunite_id  uuid not null references public.opportunites(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  type            activite_type_t not null default 'appel',
  date            timestamptz not null default now(),
  commentaire     text,
  created_at      timestamptz not null default now()
);

-- Contrôle : un contact appartient à la même équipe que son entreprise.
create or replace function public.assert_contact_same_team()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.team_id is distinct from (select team_id from public.entreprises where id = new.entreprise_id) then
    raise exception 'Le contact doit appartenir à la même équipe que son entreprise';
  end if;
  return new;
end $$;

create trigger trg_contact_team before insert or update on public.contacts
  for each row execute function public.assert_contact_same_team();

-- Contrôle : une opportunité appartient à la même équipe que son entreprise.
create or replace function public.assert_opp_same_team()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.team_id is distinct from (select team_id from public.entreprises where id = new.entreprise_id) then
    raise exception 'L''opportunité doit appartenir à la même équipe que son entreprise';
  end if;
  return new;
end $$;

create trigger trg_opp_team before insert or update on public.opportunites
  for each row execute function public.assert_opp_same_team();-- ==========================================================================
-- 0002_rls_policies.sql
-- ==========================================================================
-- ==========================================================================
-- SF Deals — RLS (Row Level Security)
-- Toute table exposée a RLS activé. Accès team-scoped :
--   team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
-- UPDATE porte USING + WITH CHECK (anti-BOLA : empêche de réaffecter une ligne
-- à une autre équipe).
-- ==========================================================================

alter table public.teams        enable row level security;
alter table public.team_members enable row level security;
alter table public.entreprises  enable row level security;
alter table public.contacts     enable row level security;
alter table public.opportunites enable row level security;
alter table public.activites    enable row level security;

-- Helper : équipes de l'utilisateur courant. SECURITY INVOKER (respecte RLS
-- sur team_members ; ne JAMAIS passer en SECURITY DEFINER pour "corriger" une
-- erreur de permission — cela contournerait RLS).
create or replace function public.current_user_teams()
returns setof uuid
language sql
security invoker
stable
set search_path = public
as $$
  select team_id from public.team_members where user_id = (select auth.uid());
$$;

-- ===== teams =====
create policy "teams_select" on public.teams for select to authenticated
  using (id in (select * from public.current_user_teams()));

create policy "teams_insert" on public.teams for insert to authenticated
  with check (true);  -- tout utilisateur authentifié peut créer une équipe

create policy "teams_update" on public.teams for update to authenticated
  using (id in (select * from public.current_user_teams()))
  with check (id in (select * from public.current_user_teams()));

create policy "teams_delete" on public.teams for delete to authenticated
  using (id in (select * from public.current_user_teams()));

-- ===== team_members =====
-- IMPORTANT : le SELECT ne doit JAMAIS référencer current_user_teams() (sinon
-- récursion infinie → stack depth exceeded). On filtre uniquement sur
-- l'appartenance propre de l'utilisateur ; cela suffit à alimenter
-- current_user_teams() pour les autres tables.
create policy "tm_select" on public.team_members for select to authenticated
  using (user_id = (select auth.uid()));

-- Un propriétaire peut inviter un membre DANS une équipe à laquelle il appartient,
-- OU un utilisateur peut s'ajouter lui-même comme PREMIER membre d'une équipe
-- qu'il vient de créer (onboarding auto à la première connexion). La condition
-- "équipe sans membre" empêche de s'ajouter à une équipe peuplée par autrui ;
-- combiné au fait que RLS cache les équipes des autres utilisateurs (id non
-- énumérable), le risque de course est nul en pratique.
create policy "tm_insert" on public.team_members for insert to authenticated
  with check (
    team_id in (select * from public.current_user_teams())
    or (
      user_id = (select auth.uid())
      and not exists (
        select 1 from public.team_members tm2 where tm2.team_id = team_members.team_id
      )
    )
  );

create policy "tm_update" on public.team_members for update to authenticated
  using (team_id in (select * from public.current_user_teams()))
  with check (team_id in (select * from public.current_user_teams()));

create policy "tm_delete" on public.team_members for delete to authenticated
  using (team_id in (select * from public.current_user_teams()));

-- ===== Modèle d'appartenance team-scoped (répété par table) =====
-- SELECT | INSERT | UPDATE(USING+WITH CHECK) | DELETE

-- entreprises
create policy "ent_select" on public.entreprises for select to authenticated
  using (team_id in (select * from public.current_user_teams()));
create policy "ent_insert" on public.entreprises for insert to authenticated
  with check (team_id in (select * from public.current_user_teams()));
create policy "ent_update" on public.entreprises for update to authenticated
  using (team_id in (select * from public.current_user_teams()))
  with check (team_id in (select * from public.current_user_teams()));
create policy "ent_delete" on public.entreprises for delete to authenticated
  using (team_id in (select * from public.current_user_teams()));

-- contacts
create policy "ctc_select" on public.contacts for select to authenticated
  using (team_id in (select * from public.current_user_teams()));
create policy "ctc_insert" on public.contacts for insert to authenticated
  with check (team_id in (select * from public.current_user_teams()));
create policy "ctc_update" on public.contacts for update to authenticated
  using (team_id in (select * from public.current_user_teams()))
  with check (team_id in (select * from public.current_user_teams()));
create policy "ctc_delete" on public.contacts for delete to authenticated
  using (team_id in (select * from public.current_user_teams()));

-- opportunites
create policy "opp_select" on public.opportunites for select to authenticated
  using (team_id in (select * from public.current_user_teams()));
create policy "opp_insert" on public.opportunites for insert to authenticated
  with check (team_id in (select * from public.current_user_teams()));
create policy "opp_update" on public.opportunites for update to authenticated
  using (team_id in (select * from public.current_user_teams()))
  with check (team_id in (select * from public.current_user_teams()));
create policy "opp_delete" on public.opportunites for delete to authenticated
  using (team_id in (select * from public.current_user_teams()));

-- activites
create policy "act_select" on public.activites for select to authenticated
  using (team_id in (select * from public.current_user_teams()));
create policy "act_insert" on public.activites for insert to authenticated
  with check (team_id in (select * from public.current_user_teams()));
create policy "act_update" on public.activites for update to authenticated
  using (team_id in (select * from public.current_user_teams()))
  with check (team_id in (select * from public.current_user_teams()));
create policy "act_delete" on public.activites for delete to authenticated
  using (team_id in (select * from public.current_user_teams()));

-- ==========================================================================
-- Exposition Data API : les tables créées en SQL ne sont pas toujours exposées
-- automatiquement. On accorde explicitement l'accès aux rôles publics (anon /
-- authenticated) ; RLS contrôle ensuite quelles lignes sont visibles.
-- ==========================================================================
grant select, insert, update, delete on public.teams        to authenticated, anon;
grant select, insert, update, delete on public.team_members   to authenticated, anon;
grant select, insert, update, delete on public.entreprises   to authenticated, anon;
grant select, insert, update, delete on public.contacts      to authenticated, anon;
grant select, insert, update, delete on public.opportunites to authenticated, anon;
grant select, insert, update, delete on public.activites    to authenticated, anon;

grant usage, select on all sequences in schema public to authenticated, anon;-- ==========================================================================
-- 0003_indexes.sql
-- ==========================================================================
-- ==========================================================================
-- SF Deals — Index (filtres fréquents + rappels + recherche)
-- ==========================================================================

create index idx_ent_team      on public.entreprises(team_id);
create index idx_ent_pays      on public.entreprises(pays);
create index idx_ent_secteur   on public.entreprises(secteur);
create index idx_ent_ecobank   on public.entreprises(presence_ecobank);
create index idx_ent_nom       on public.entreprises(nom);

create index idx_ctc_entreprise on public.contacts(entreprise_id);
create index idx_ctc_team       on public.contacts(team_id);
create index idx_ctc_nom        on public.contacts(nom);

create index idx_opp_team       on public.opportunites(team_id);
create index idx_opp_etape      on public.opportunites(etape_pipeline);
create index idx_opp_segment    on public.opportunites(segment_abc);
create index idx_opp_entreprise on public.opportunites(entreprise_id);
create index idx_opp_prochaine  on public.opportunites(date_prochaine_action);

create index idx_act_opp        on public.activites(opportunite_id);-- ==========================================================================
-- 0004_updated_at_trigger.sql
-- ==========================================================================
-- ==========================================================================
-- SF Deals — Trigger updated_at (bump automatique sur UPDATE)
-- ==========================================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_ent_touch before update on public.entreprises
  for each row execute function public.touch_updated_at();

create trigger trg_ctc_touch before update on public.contacts
  for each row execute function public.touch_updated_at();

create trigger trg_opp_touch before update on public.opportunites
  for each row execute function public.touch_updated_at();-- ==========================================================================
-- seed.sql
-- ==========================================================================
-- ==========================================================================
-- SF Deals — Seed (dev local)
-- Crée : 1 utilisateur dev + 1 équipe + ~10 entreprises réparties sur plusieurs
-- pays, avec contacts et opportunités couvrant toutes les étapes du pipeline
-- (dont dates dépassées pour tester les rappels, et Gagné/Perdu pour le taux
-- de conversion).
-- Joué automatiquement par `supabase db reset` après les migrations.
--
-- Utilisateur dev : dev@sfdeals.local  /  mot de passe : sfdeals123
-- ==========================================================================

-- ID déterministes pour la reproductibilité.
-- team : 11111111-1111-1111-1111-111111111111
-- user : 00000000-0000-0000-0000-000000000000

-- ---- Utilisateur dev (insert direct dans auth.users, local uniquement) ----
-- GoTrue scanne les colonnes token en string non-null : on les met à ''.
insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token,
  email_change_token_new, email_change, email_change_token_current,
  reauthentication_token, phone_change, phone_change_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dev@sfdeals.local',
  crypt('sfdeals123', gen_salt('bf')),
  now(),
  now(), now(), now(),
  '{}'::jsonb, '{}'::jsonb,
  '', '',
  '', '', '',
  '', '', '',
  false, false
)
on conflict (id) do nothing;

-- GoTrue exige une entrée dans auth.identities pour le provider email.
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000000', 'email', 'dev@sfdeals.local'),
  'email',
  '00000000-0000-0000-0000-000000000000',
  now(), now(), now()
)
on conflict (id) do nothing;

-- ---- Équipe + appartenance ----
insert into public.teams (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'SF Deals')
on conflict (id) do nothing;

insert into public.team_members (team_id, user_id, role) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'owner')
on conflict (team_id, user_id) do nothing;

-- ---- Entreprises (~10, plusieurs pays, secteurs variés) ----
insert into public.entreprises (id, team_id, nom, pays, secteur, presence_ecobank, site_web, notes) values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Ecobank Côte d''Ivoire',     'CIV', 'Banque',          true,  'https://ecobank.ci',  'Première banque de l''UEMOA, hub régional.'),
  ('a1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'SG Ghana',                   'GHA', 'Banque',          true,  'https://sg.com.gh',    'Filiale Société Générale, gros volume trade finance.'),
  ('a1000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'SUNU Assurances Sénégal',   'SEN', 'Assurance',       true,  null,                   'Acteur majeur assurance vie, intérêt formation digitale.'),
  ('a1000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Coris Microfinance',         'BFA', 'Microfinance',    true,  null,                   'Réseau Burkina, transformation digitale en cours.'),
  ('a1000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Orange Money Mali',          'MLI', 'Télécom',         true,  'https://orange.ml',    'Mobile money, fort potentiel formation.'),
  ('a1000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Banque Mondiale Niger',      'NER', 'ONG/institution', false, null,                   'Bureau pays, programmes capacity building.'),
  ('a1000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'MTN Nigeria',                'NGA', 'Télécom',         true,  'https://mtn.ng',       'Marché Nigeria, énorme potentiel.'),
  ('a1000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Advans Microfinance Togo',  'TGO', 'Microfinance',    true,  null,                   'Opportunité formation commerciale.'),
  ('a1000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Banque Atlantique Cameroun', 'CMR', 'Banque',          true,  null,                   'Réseau CEMAC, accès décideur facilité.'),
  ('a1000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'KCB Kenya',                  'KEN', 'Banque',          true,  'https://kcb.co.ke',    'East Africa, grand compte.')
on conflict (id) do nothing;

-- ---- Contacts (1-2 par entreprise) ----
insert into public.contacts (id, team_id, entreprise_id, nom, fonction, email, telephone_whatsapp, linkedin) values
  ('c1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'Aïcha Koné',       'Directrice Transformation Digitale', 'akone@ecobank.ci',  '+225 07 00 00 01', 'https://linkedin.com/in/aicha-kone'),
  ('c1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'Mamadou Traoré',   'Head of Retail',                    'mtraore@ecobank.ci', '+225 07 00 00 02', null),
  ('c1000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000002', 'Kwame Mensah',     'Head of SME',                       'kmensah@sg.com.gh',  '+233 20 000 003',  null),
  ('c1000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000003', 'Fatou Diop',       'DRH',                               'fdiop@sunu.sn',      '+221 77 000 004',  null),
  ('c1000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000004', 'Issa Ouédraogo',   'Directeur Général',                 'iouedraogo@coris.bf', '+226 70 00 00 05', null),
  ('c1000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000005', 'Aminata Diallo',   'Head of Digital',                   'adiallo@orange.ml',  '+223 76 00 00 06', null),
  ('c1000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000006', 'Ibrahim Moussa',   'Spécialiste éducation',             'imoussa@worldbank.org', '+227 80 00 00 07', null),
  ('c1000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000007', 'Chidi Okafor',     'Chief Strategy Officer',            'cokafor@mtn.ng',     '+234 803 000 0008', null),
  ('c1000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000009', 'Paul Etoa',        'Directeur Commercial',              'petoa@banqueatlantique.cm', '+237 6 00 00 09', null),
  ('c1000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000010', 'Wanjiru Kamau',    'Head of Learning',                  'wkamau@kcb.co.ke',   '+254 700 000 010', null)
on conflict (id) do nothing;

-- ---- Opportunités (toutes les étapes, dont overdue + Gagné/Perdu) ----
insert into public.opportunites (id, team_id, entreprise_id, contact_principal_id, etape_pipeline, intitule, valeur_estimee, devise, source, segment_abc, score_priorite, date_dernier_contact, date_prochaine_action, notes) values
  -- Lead
  ('d1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000008', 'Lead',                   'Formation équipe stratégie',  45000,  'USD', 'prospection directe', 'A', 9, current_date - interval '10 days', current_date + interval '7 days',  'Premier contact à venir.'),
  -- Contacté
  ('d1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000006', 'Contacté',                'Transformation digitale MO', 150000000, 'XOF', 'réseau',             'B', 6, current_date - interval '5 days', current_date + interval '14 days', 'Intéressé, attend propale.'),
  -- Rendez-vous obtenu
  ('d1000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', 'Rendez-vous obtenu',      'Formation commerciaux',      28000000, 'XOF', 'recommandation',     'B', 7, current_date - interval '3 days', current_date + interval '2 days',  'RDV confirmé jeudi.'),
  -- Proposition envoyée
  ('d1000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'Proposition envoyée',    'Trade finance academy',         60000,  'EUR', 'réseau',             'A', 8, current_date - interval '8 days', current_date - interval '2 days', 'RELANCE — date dépassée.'), -- OVERDUE
  -- Négociation
  ('d1000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Négociation',             'Programme leadership',         120000, 'USD', 'réseau',             'A', 9, current_date - interval '4 days', current_date + interval '5 days',  'Négociation sur le périmètre.'),
  -- Gagné
  ('d1000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000009', 'Gagné',                   'Académie vente',               35000,  'EUR', 'recommandation',     'A', 10, current_date - interval '20 days', null,                              'Signé, démarrage le mois prochain.'),
  -- Perdu
  ('d1000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000005', 'Perdu',                   'Audit transformation',          40000,  'EUR', 'prospection directe','C', 3, current_date - interval '30 days', null,                              'Budget reporté à l''année suivante.'),
  -- 2e Lead (test rappels futur lointain)
  ('d1000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000010', 'Lead',                    'Programme learning',           90000,  'USD', 'événement',           'B', 6, current_date - interval '1 days',  current_date + interval '12 days', 'Contact forum Nairobi.'),
  -- Négociation 2 (overdue pour rappels)
  ('d1000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000007', 'Négociation',             'Capacity building',            55000,  'EUR', 'réseau',             'B', 7, current_date - interval '15 days', current_date - interval '1 days', 'RELANCE — date dépassée.') -- OVERDUE
on conflict (id) do nothing;