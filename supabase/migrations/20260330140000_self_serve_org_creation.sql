-- Self-serve organization creation (founders) vs invite-only joiners.
-- See AGENTS.md for product rules. Organizations INSERT remains dev-only for direct
-- client writes; founders create orgs via create_organization_for_self_serve() only.

-- ---------------------------------------------------------------------------
-- profiles.signup_source — durable founder vs joiner signal
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists signup_source text not null default 'unknown'
    constraint profiles_signup_source_check
      check (signup_source in ('self_serve', 'invite', 'unknown'));

comment on column public.profiles.signup_source is
  'self_serve: signed up from landing as founder; invite: joined via invitation; unknown: legacy/unset';

update public.profiles set signup_source = 'unknown' where signup_source is null;

-- ---------------------------------------------------------------------------
-- organizations — trial / billing stubs (no payment integration yet)
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column if not exists trial_ends_at timestamptz;

alter table public.organizations
  add column if not exists billing_status text not null default 'none'
    constraint organizations_billing_status_check
      check (billing_status in ('none', 'trialing', 'active', 'past_due', 'canceled'));

comment on column public.organizations.trial_ends_at is
  'When the trial period ends; set for self-serve orgs at creation.';

comment on column public.organizations.billing_status is
  'Subscription/trial state; future paywall. Legacy rows use none.';

-- ---------------------------------------------------------------------------
-- New auth users: profile row + signup_source from raw_user_meta_data
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_src text;
begin
  v_src := coalesce(nullif(trim(new.raw_user_meta_data ->> 'signup_source'), ''), 'unknown');
  if v_src not in ('self_serve', 'invite', 'unknown') then
    v_src := 'unknown';
  end if;

  insert into public.profiles (user_id, signup_source)
  values (new.id, v_src)
  on conflict (user_id) do update set
    signup_source = case
      when excluded.signup_source is not null and excluded.signup_source <> 'unknown'::text
        then excluded.signup_source
      else public.profiles.signup_source
    end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Invite acceptance: mark profile as invite-driven (joiner, not founder)
-- ---------------------------------------------------------------------------
create or replace function public.accept_invitation_by_token(p_token uuid, p_display_name text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_inv record;
begin
  select id, organization_id
  into v_inv
  from organization_invitations
  where token = p_token
    and accepted_at is null
    and (expires_at is null or expires_at > now())
  for update;

  if not found then
    raise exception 'Invitation not found or already used';
  end if;

  if not exists (
    select 1 from organization_invitations
    where id = v_inv.id
      and invitee_email = auth.email()
  ) then
    raise exception 'Invitation does not match your account';
  end if;

  insert into organization_members (organization_id, user_id, role, display_name)
  values (v_inv.organization_id, auth.uid(), 'member', p_display_name)
  on conflict (organization_id, user_id) do nothing;

  update public.profiles
  set signup_source = 'invite'
  where user_id = auth.uid();

  delete from organization_invitations where id = v_inv.id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Single controlled path for self-serve org creation (server-enforced)
-- ---------------------------------------------------------------------------
create or replace function public.create_organization_for_self_serve(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_uid uuid := auth.uid();
  v_org_id uuid;
  v_confirmed timestamptz;
  v_src text;
  v_display text;
  v_email text;
  v_meta jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Organization name required';
  end if;

  select email_confirmed_at, email, raw_user_meta_data
  into v_confirmed, v_email, v_meta
  from auth.users
  where id = v_uid;

  if v_confirmed is null then
    raise exception 'Email not confirmed';
  end if;

  select signup_source into v_src from public.profiles where user_id = v_uid;

  if v_src is distinct from 'self_serve' then
    raise exception 'Not eligible to create organization';
  end if;

  if exists (select 1 from public.profiles p where p.user_id = v_uid and p.system_role = 'dev') then
    raise exception 'Dev accounts use the existing organization creation path';
  end if;

  if exists (select 1 from public.organization_members where user_id = v_uid) then
    raise exception 'Already a member of an organization';
  end if;

  v_display := trim(coalesce(v_meta ->> 'full_name', ''));
  if v_display = '' or v_display is null then
    v_display := split_part(v_email, '@', 1);
  end if;

  insert into public.organizations (name, trial_ends_at, billing_status)
  values (trim(p_name), (now() at time zone 'utc') + interval '14 days', 'trialing')
  returning organization_id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role, display_name)
  values (v_org_id, v_uid, 'admin', v_display);

  return v_org_id;
end;
$function$;

grant execute on function public.create_organization_for_self_serve(text) to authenticated;
