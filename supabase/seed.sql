-- =============================================================================
-- Local-only seed (runs after migrations on `supabase db reset`).
-- =============================================================================
-- Seeded sign-in (password is the same for every account below):
--
--   dev@seed.kartapp.test        — profiles.system_role = dev → admin everywhere
--   admin@seed.kartapp.test      — org admin, Demo Installation AB
--   installer@seed.kartapp.test    — org member, assigned to one project only
--
-- Password: LocalDev_Seed_2026!
--
-- Re-apply a clean dataset with: npx supabase db reset
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Auth users + identities (required for email/password sign-in)
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'dev@seed.kartapp.test',
    extensions.crypt('LocalDev_Seed_2026!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'installer@seed.kartapp.test',
    extensions.crypt('LocalDev_Seed_2026!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'admin@seed.kartapp.test',
    extensions.crypt('LocalDev_Seed_2026!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    jsonb_build_object(
      'sub', '11111111-1111-1111-1111-111111111111',
      'email', 'dev@seed.kartapp.test'
    ),
    'email',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    jsonb_build_object(
      'sub', '22222222-2222-2222-2222-222222222222',
      'email', 'installer@seed.kartapp.test'
    ),
    'email',
    now(),
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    jsonb_build_object(
      'sub', '33333333-3333-3333-3333-333333333333',
      'email', 'admin@seed.kartapp.test'
    ),
    'email',
    now(),
    now(),
    now()
  );

-- ---------------------------------------------------------------------------
-- Profiles (dev flag for global org access)
-- ---------------------------------------------------------------------------
insert into public.profiles (user_id, system_role) values
  ('11111111-1111-1111-1111-111111111111', 'dev'),
  ('22222222-2222-2222-2222-222222222222', null),
  ('33333333-3333-3333-3333-333333333333', null);

-- ---------------------------------------------------------------------------
-- Organization + members
-- ---------------------------------------------------------------------------
insert into public.organizations (organization_id, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Demo Installation AB');

insert into public.organization_members (
  organization_id,
  user_id,
  role,
  display_name,
  hourly_rate
) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'member',
    'Erik Installatör',
    450
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-3333-3333-3333-333333333333',
    'admin',
    'Anna Admin',
    null
  );

-- ---------------------------------------------------------------------------
-- Customers & locations (PostGIS point, SRID 4326)
-- ---------------------------------------------------------------------------
insert into public.customers (
  customer_id,
  organization_id,
  name,
  phone,
  email,
  notes,
  created_by
) overriding system value values
  (
    90001,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Solenergi AB',
    '+46 70 123 45 67',
    'kontakt@solenergi.test',
    'Seed customer for local dev.',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    90002,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'E-Mobility Partner',
    '+46 70 987 65 43',
    'info@emobility.test',
    null,
    '11111111-1111-1111-1111-111111111111'
  );

insert into public.customer_locations (
  customer_location_id,
  customer_id,
  name,
  address,
  location,
  created_by
) overriding system value values
  (
    91001,
    90001,
    'Butik Storgatan',
    'Storgatan 12, 111 52 Stockholm',
    extensions.st_setsrid(extensions.st_makepoint(18.0686, 59.3293), 4326),
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    91002,
    90002,
    'Parkeringshus Norr',
    'Norra Stationsgatan 5, 113 64 Stockholm',
    extensions.st_setsrid(extensions.st_makepoint(18.0367, 59.3476), 4326),
    '11111111-1111-1111-1111-111111111111'
  );

-- ---------------------------------------------------------------------------
-- Projects (job sites) + assignees
-- ---------------------------------------------------------------------------
insert into public.projects (
  project_id,
  organization_id,
  created_by,
  start_time,
  project_status,
  title,
  description,
  customer_id,
  customer_location_id
) values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    now() + interval '1 day',
    3,
    'Solpanel tak — Storgatan',
    'Installation av takmonterade solpaneler. Seed-projekt för Playwright.',
    90001,
    91001
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    now() + interval '3 days',
    2,
    'Laddbox — parkering Norr',
    'Wallbox på parkeringsplats. Tilldelad endast admin i seed.',
    90002,
    91002
  );

insert into public.project_assignees (
  project_id,
  user_id,
  organization_id
) values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  );

insert into public.project_comments (project_id, body, created_by) values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Ring kunden cirka 10 minuter innan ankomst.',
    '11111111-1111-1111-1111-111111111111'
  );

-- Keep auto-generated IDs from colliding with seeded bigint keys.
select setval(
  'public.customers_customer_id_seq',
  (select coalesce(max(customer_id), 1) from public.customers)
);
select setval(
  'public.customer_locations_customer_location_id_seq',
  (select coalesce(max(customer_location_id), 1) from public.customer_locations)
);

commit;
