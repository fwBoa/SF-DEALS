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

-- Un propriétaire peut inviter un membre DANS une équipe à laquelle il appartient.
create policy "tm_insert" on public.team_members for insert to authenticated
  with check (team_id in (select * from public.current_user_teams()));

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

grant usage, select on all sequences in schema public to authenticated, anon;