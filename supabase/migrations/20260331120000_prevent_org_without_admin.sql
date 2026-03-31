-- Prevent any organization from ending up without an admin member.
-- This protects role updates and member deletions, regardless of client behavior.

create or replace function public.prevent_org_without_admin()
returns trigger
language plpgsql
as $function$
begin
  if tg_op = 'UPDATE'
     and old.role = 'admin'
     and new.role <> 'admin' then
    if not exists (
      select 1
      from public.organization_members om
      where om.organization_id = old.organization_id
        and om.user_id <> old.user_id
        and om.role = 'admin'
    ) then
      raise exception 'Organization must always have at least one admin.'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE'
     and old.role = 'admin' then
    if not exists (
      select 1
      from public.organization_members om
      where om.organization_id = old.organization_id
        and om.user_id <> old.user_id
        and om.role = 'admin'
    ) then
      raise exception 'Organization must always have at least one admin.'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    return new;
  end if;
  return old;
end;
$function$;

drop trigger if exists trg_prevent_org_without_admin on public.organization_members;
create trigger trg_prevent_org_without_admin
before update of role or delete on public.organization_members
for each row
execute function public.prevent_org_without_admin();
