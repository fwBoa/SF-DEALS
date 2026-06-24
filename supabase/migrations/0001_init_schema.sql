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
  for each row execute function public.assert_opp_same_team();