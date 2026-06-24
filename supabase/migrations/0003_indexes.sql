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

create index idx_act_opp        on public.activites(opportunite_id);