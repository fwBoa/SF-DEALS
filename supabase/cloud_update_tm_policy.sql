-- ==========================================================================
-- SF Deals — Patch CLOUD : policy tm_insert (autorise l'auto-onboarding).
-- À exécuter UNE fois dans le SQL Editor du projet cloud déjà bootstrappé.
-- Permet à un utilisateur fraîchement invité de devenir le PREMIER membre
-- (owner) de sa propre équipe à sa première connexion (sans action admin).
-- ==========================================================================
drop policy if exists "tm_insert" on public.team_members;
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
