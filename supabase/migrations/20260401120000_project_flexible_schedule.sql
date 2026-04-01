-- Flexible job scheduling: ASAP, multi-day window, or fixed appointment.
-- Replaces single-column start_time.

alter table public.projects
  add column if not exists schedule_kind text not null default 'asap';

alter table public.projects
  add column if not exists schedule_window_start timestamp with time zone;

alter table public.projects
  add column if not exists schedule_window_end timestamp with time zone;

alter table public.projects
  add column if not exists schedule_appointment_at timestamp with time zone;

-- Migrate legacy start_time before dropping it
update public.projects
set
  schedule_kind = case
    when start_time is null then 'asap'
    else 'appointment'
  end,
  schedule_appointment_at = start_time;

alter table public.projects drop column if exists start_time;

alter table public.projects drop constraint if exists projects_schedule_kind_check;
alter table public.projects
  add constraint projects_schedule_kind_check
  check (schedule_kind in ('asap', 'window', 'appointment'));

alter table public.projects drop constraint if exists projects_schedule_shape_check;
alter table public.projects
  add constraint projects_schedule_shape_check
  check (
    (
      schedule_kind = 'asap'
      and schedule_window_start is null
      and schedule_window_end is null
      and schedule_appointment_at is null
    )
    or (
      schedule_kind = 'window'
      and schedule_window_start is not null
      and schedule_window_end is not null
      and schedule_appointment_at is null
      and schedule_window_end >= schedule_window_start
    )
    or (
      schedule_kind = 'appointment'
      and schedule_appointment_at is not null
      and schedule_window_start is null
      and schedule_window_end is null
    )
  );

comment on column public.projects.schedule_kind is 'asap | window | appointment';
comment on column public.projects.schedule_window_start is 'Start of scheduling window (timestamptz).';
comment on column public.projects.schedule_window_end is 'End of scheduling window (timestamptz).';
comment on column public.projects.schedule_appointment_at is 'Fixed appointment when schedule_kind = appointment.';
