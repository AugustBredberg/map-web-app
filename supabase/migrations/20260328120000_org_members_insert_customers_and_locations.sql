-- Allow org members (not only admins) to create customers and locations during
-- the create-project flow. Admins remain covered via membership; dev bypass
-- matches user_is_admin_in_organization as used elsewhere.

drop policy if exists "org members can insert customers" on public.customers;
drop policy if exists "org members can insert customer_locations" on public.customer_locations;

create policy "org members can insert customers"
on public.customers
as permissive
for insert
to public
with check (
  user_is_part_of_organization((select auth.uid() as uid), organization_id)
  or user_is_admin_in_organization((select auth.uid() as uid), organization_id)
);

create policy "org members can insert customer_locations"
on public.customer_locations
as permissive
for insert
to public
with check (
  exists (
    select 1
    from public.customers c
    where c.customer_id = customer_locations.customer_id
      and (
        user_is_part_of_organization((select auth.uid() as uid), c.organization_id)
        or user_is_admin_in_organization((select auth.uid() as uid), c.organization_id)
      )
  )
);
