-- Project comments: installers and admins can discuss a job; visible to assignees and org admins.

create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  body text not null,
  created_by uuid not null default auth.uid(),
  author_display_name text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint project_comments_project_id_fkey
    foreign key (project_id)
    references public.projects (project_id)
    on delete cascade,
  constraint project_comments_created_by_fkey
    foreign key (created_by)
    references auth.users (id)
    on delete cascade,
  constraint project_comments_body_not_empty check (length(trim(body)) > 0)
);

create index if not exists project_comments_project_id_created_at_idx
  on public.project_comments (project_id, created_at desc);

create or replace function public.project_comments_set_author_name()
returns trigger
language plpgsql
security definer
set search_path to public
as $function$
begin
  select om.display_name into new.author_display_name
  from public.projects p
  join public.organization_members om
    on om.organization_id = p.organization_id
   and om.user_id = new.created_by
  where p.project_id = new.project_id
  limit 1;
  return new;
end;
$function$;

drop trigger if exists project_comments_set_author_name_trigger on public.project_comments;
create trigger project_comments_set_author_name_trigger
  before insert on public.project_comments
  for each row execute function public.project_comments_set_author_name();

alter table public.project_comments enable row level security;

create policy project_comments_select
on public.project_comments
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.project_id = project_comments.project_id
      and (
        public.is_assigned_to_project(p.project_id)
        or public.is_org_admin_for_project(p.project_id)
      )
  )
);

create policy project_comments_insert
on public.project_comments
as permissive
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.project_id = project_comments.project_id
      and (
        public.is_assigned_to_project(p.project_id)
        or public.is_org_admin_for_project(p.project_id)
      )
  )
);

create policy project_comments_delete
on public.project_comments
as permissive
for delete
to authenticated
using (
  created_by = (select auth.uid())
  or public.is_org_admin_for_project(project_id)
);

grant all on table public.project_comments to anon, authenticated, service_role;
