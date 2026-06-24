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
  for each row execute function public.touch_updated_at();