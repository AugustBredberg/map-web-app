-- Accept a pending invitation from the settings UI (by invitation id).
-- Mirrors accept_invitation_by_token: membership insert + signup_source = invite + delete row.

create or replace function public.accept_invitation_by_id(p_invitation_id bigint, p_display_name text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_inv record;
begin
  select id, organization_id, invitee_email
  into v_inv
  from organization_invitations
  where id = p_invitation_id
    and accepted_at is null
    and (expires_at is null or expires_at > now())
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if lower(v_inv.invitee_email) is distinct from lower(auth.email()) then
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

grant execute on function public.accept_invitation_by_id(bigint, text) to authenticated;
