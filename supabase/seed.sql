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