-- Org-wide catalog of tools and materials; linked to projects for field teams.

create table if not exists public.organization_items (
  organization_item_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  kind text not null,
  name text not null,
  notes text,
  created_at timestamp with time zone not null default now(),
  created_by uuid not null default auth.uid(),
  constraint organization_items_organization_id_fkey
    foreign key (organization_id)
    references public.organizations (organization_id)
    on delete cascade,
  constraint organization_items_created_by_fkey
    foreign key (created_by)
    references auth.users (id),
  constraint organization_items_kind_check
    check (kind in ('tool', 'material')),
  constraint organization_items_name_not_empty
    check (length(trim(name)) > 0),
  constraint organization_items_org_kind_name_unique
    unique (organization_id, kind, name)
);

create index if not exists organization_items_organization_id_idx
  on public.organization_items (organization_id);

create table if not exists public.project_items (
  project_id uuid not null,
  organization_item_id uuid not null,
  sort_order integer not null default 0,
  constraint project_items_pkey primary key (project_id, organization_item_id),
  constraint project_items_project_id_fkey
    foreign key (project_id)
    references public.projects (project_id)
    on delete cascade,
  constraint project_items_organization_item_id_fkey
    foreign key (organization_item_id)
    references public.organization_items (organization_item_id)
    on delete cascade
);

create index if not exists project_items_project_id_idx
  on public.project_items (project_id);

alter table public.organization_items enable row level security;
alter table public.project_items enable row level security;

-- Catalog: members read; admins manage
create policy organization_items_select
on public.organization_items
as permissive
for select
to authenticated
using (
  public.user_is_part_of_organization((select auth.uid() as uid), organization_id)
);

create policy organization_items_insert
on public.organization_items
as permissive
for insert
to authenticated
with check (
  public.user_is_admin_in_organization((select auth.uid() as uid), organization_id)
);

create policy organization_items_update
on public.organization_items
as permissive
for update
to authenticated
using (
  public.user_is_admin_in_organization((select auth.uid() as uid), organization_id)
)
with check (
  public.user_is_admin_in_organization((select auth.uid() as uid), organization_id)
);

create policy organization_items_delete
on public.organization_items
as permissive
for delete
to authenticated
using (
  public.user_is_admin_in_organization((select auth.uid() as uid), organization_id)
);

-- Project links: same visibility as job (assignee or org admin); only admins edit
create policy project_items_select
on public.project_items
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.project_id = project_items.project_id
      and (
        public.is_assigned_to_project(p.project_id)
        or public.is_org_admin_for_project(p.project_id)
      )
  )
);

create policy project_items_insert
on public.project_items
as permissive
for insert
to authenticated
with check (
  public.is_org_admin_for_project(project_id)
  and exists (
    select 1
    from public.projects p
    join public.organization_items oi on oi.organization_item_id = project_items.organization_item_id
    where p.project_id = project_items.project_id
      and oi.organization_id = p.organization_id
  )
);

create policy project_items_update
on public.project_items
as permissive
for update
to authenticated
using (public.is_org_admin_for_project(project_id))
with check (
  public.is_org_admin_for_project(project_id)
  and exists (
    select 1
    from public.projects p
    join public.organization_items oi on oi.organization_item_id = project_items.organization_item_id
    where p.project_id = project_items.project_id
      and oi.organization_id = p.organization_id
  )
);

create policy project_items_delete
on public.project_items
as permissive
for delete
to authenticated
using (public.is_org_admin_for_project(project_id));

grant all on table public.organization_items to anon, authenticated, service_role;
grant all on table public.project_items to anon, authenticated, service_role;
