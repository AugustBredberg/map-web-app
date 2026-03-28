-- Dev users (profiles.system_role = 'dev') should behave like org admins in every
-- organization. user_is_admin_in_organization already encodes that, but many policies
-- inlined "role = admin" subqueries or membership lists that excluded devs.
--
-- 1. user_is_part_of_organization: dev counts as belonging to any org (member-level).
-- 2. get_my_org_ids: dev sees all organization ids (for policies that use this set).
-- 3. is_org_admin_for_project: delegate to user_is_admin_in_organization (includes dev).
-- 4. Replace RLS policies that inlined admin/member org checks with these helpers.

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

create or replace function public.user_is_part_of_organization(
  given_user_id uuid,
  given_organization_id uuid
)
returns boolean
language plpgsql
stable
as $function$
begin
  return exists (
    select 1
    from organization_members om
    where om.organization_id = given_organization_id
      and om.user_id = given_user_id
  )
  or exists (
    select 1
    from profiles p
    where p.user_id = given_user_id
      and p.system_role = 'dev'
  );
end;
$function$;

create or replace function public.get_my_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path to 'public'
as $function$
  select organization_id
  from organization_members
  where user_id = auth.uid()
  union
  select o.organization_id
  from organizations o
  where exists (
    select 1
    from profiles p
    where p.user_id = auth.uid()
      and p.system_role = 'dev'
  );
$function$;

create or replace function public.is_org_admin_for_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from projects p
    where p.project_id = p_project_id
      and user_is_admin_in_organization(auth.uid(), p.organization_id)
  );
$function$;

-- ---------------------------------------------------------------------------
-- customers / customer_locations — drop policies that inlined admin/member checks
-- ---------------------------------------------------------------------------

drop policy if exists "org admins can delete customer_locations" on public.customer_locations;
drop policy if exists "org admins can insert customer_locations" on public.customer_locations;
drop policy if exists "org admins can update customer_locations" on public.customer_locations;
drop policy if exists "org members can view customer_locations" on public.customer_locations;

drop policy if exists "org admins can delete customers" on public.customers;
drop policy if exists "org admins can insert customers" on public.customers;
drop policy if exists "org admins can update customers" on public.customers;
drop policy if exists "org members can view customers" on public.customers;

create policy "org admins can delete customer_locations"
on public.customer_locations
as permissive
for delete
to public
using (
  exists (
    select 1
    from customers c
    where c.customer_id = customer_locations.customer_id
      and user_is_admin_in_organization((select auth.uid() as uid), c.organization_id)
  )
);

create policy "org admins can insert customer_locations"
on public.customer_locations
as permissive
for insert
to public
with check (
  exists (
    select 1
    from customers c
    where c.customer_id = customer_locations.customer_id
      and user_is_admin_in_organization((select auth.uid() as uid), c.organization_id)
  )
);

create policy "org admins can update customer_locations"
on public.customer_locations
as permissive
for update
to public
using (
  exists (
    select 1
    from customers c
    where c.customer_id = customer_locations.customer_id
      and user_is_admin_in_organization((select auth.uid() as uid), c.organization_id)
  )
)
with check (
  exists (
    select 1
    from customers c
    where c.customer_id = customer_locations.customer_id
      and user_is_admin_in_organization((select auth.uid() as uid), c.organization_id)
  )
);

create policy "org members can view customer_locations"
on public.customer_locations
as permissive
for select
to public
using (
  exists (
    select 1
    from customers c
    where c.customer_id = customer_locations.customer_id
      and user_is_part_of_organization((select auth.uid() as uid), c.organization_id)
  )
);

create policy "org admins can delete customers"
on public.customers
as permissive
for delete
to public
using (user_is_admin_in_organization((select auth.uid() as uid), organization_id));

create policy "org admins can insert customers"
on public.customers
as permissive
for insert
to public
with check (user_is_admin_in_organization((select auth.uid() as uid), organization_id));

create policy "org admins can update customers"
on public.customers
as permissive
for update
to public
using (user_is_admin_in_organization((select auth.uid() as uid), organization_id))
with check (user_is_admin_in_organization((select auth.uid() as uid), organization_id));

create policy "org members can view customers"
on public.customers
as permissive
for select
to public
using (user_is_part_of_organization((select auth.uid() as uid), organization_id));

-- ---------------------------------------------------------------------------
-- organization_invitations — inline admin check did not include dev
-- ---------------------------------------------------------------------------

drop policy if exists "Admins can create invitations" on public.organization_invitations;

create policy "Admins can create invitations"
on public.organization_invitations
as permissive
for insert
to public
with check (
  user_is_admin_in_organization((select auth.uid() as uid), organization_id)
);

-- ---------------------------------------------------------------------------
-- project_assignees / project_status_history — membership join excluded dev
-- ---------------------------------------------------------------------------

drop policy if exists "Org members can view project assignees" on public.project_assignees;

create policy "Org members can view project assignees"
on public.project_assignees
as permissive
for select
to public
using (
  exists (
    select 1
    from projects p
    where p.project_id = project_assignees.project_id
      and user_is_part_of_organization((select auth.uid() as uid), p.organization_id)
  )
);

drop policy if exists "Users can insert history in their org" on public.project_status_history;
drop policy if exists "Users can view project history in their organization" on public.project_status_history;

create policy "Users can insert history in their org"
on public.project_status_history
as permissive
for insert
to authenticated
with check (
  project_id in (
    select p.project_id
    from projects p
    where user_is_part_of_organization((select auth.uid() as uid), p.organization_id)
  )
);

create policy "Users can view project history in their organization"
on public.project_status_history
as permissive
for select
to public
using (
  project_id in (
    select p.project_id
    from projects p
    where user_is_part_of_organization((select auth.uid() as uid), p.organization_id)
  )
);
