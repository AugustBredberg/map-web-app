import type { CalendarDate, ZonedDateTime } from "@internationalized/date";
import type { Project } from "@/lib/supabase";

export type ScheduleKind = "asap" | "window" | "appointment";

const DONE_STATUS = 5;
const CANCELLED_STATUS = 6;

export function isProjectScheduleTerminal(status: number | null): boolean {
  return status === DONE_STATUS || status === CANCELLED_STATUS;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDaysLocal(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

/**
 * Jobs that should appear when the user filters to "today's jobs" on the map / list.
 * ASAP stays in the queue every day until completed or cancelled.
 */
export function projectMatchesTodaysJobsFilter(project: Project, now: Date = new Date()): boolean {
  const kind = project.schedule_kind ?? "asap";
  if (kind === "asap") return true;

  const dayStart = startOfLocalDay(now);
  const dayEnd = addDaysLocal(dayStart, 1);

  if (kind === "appointment" && project.schedule_appointment_at) {
    const t = new Date(project.schedule_appointment_at);
    return t >= dayStart && t < dayEnd;
  }

  if (kind === "window" && project.schedule_window_start && project.schedule_window_end) {
    const ws = new Date(project.schedule_window_start);
    const we = new Date(project.schedule_window_end);
    return ws < dayEnd && we >= dayStart;
  }

  return false;
}

export function isWindowOverdue(project: Project, now: Date = new Date()): boolean {
  if (project.schedule_kind !== "window" || !project.schedule_window_end) return false;
  if (isProjectScheduleTerminal(project.project_status)) return false;
  const end = new Date(project.schedule_window_end);
  return end < startOfLocalDay(now);
}

export function isAppointmentPastDue(project: Project, now: Date = new Date()): boolean {
  if (project.schedule_kind !== "appointment" || !project.schedule_appointment_at) return false;
  if (isProjectScheduleTerminal(project.project_status)) return false;
  return new Date(project.schedule_appointment_at).getTime() < now.getTime();
}

/** Earlier = higher priority in dispatch queue. */
export function compareProjectsDispatchOrder(a: Project, b: Project, now: Date = new Date()): number {
  return dispatchRank(a, now) - dispatchRank(b, now);
}

function dispatchRank(p: Project, now: Date): number {
  if (isProjectScheduleTerminal(p.project_status)) {
    return 900_000_000_000 + (p.created_at ? new Date(p.created_at).getTime() : 0);
  }

  if (p.schedule_kind === "window" && isWindowOverdue(p, now)) {
    return 100_000_000_000 + new Date(p.schedule_window_end!).getTime();
  }

  if (p.schedule_kind === "appointment" && isAppointmentPastDue(p, now)) {
    return 200_000_000_000 + new Date(p.schedule_appointment_at!).getTime();
  }

  if (p.schedule_kind === "asap") {
    return 300_000_000_000 + new Date(p.created_at).getTime();
  }

  if (p.schedule_kind === "window" && p.schedule_window_end) {
    return 400_000_000_000 + new Date(p.schedule_window_end).getTime();
  }

  if (p.schedule_kind === "appointment" && p.schedule_appointment_at) {
    return 500_000_000_000 + new Date(p.schedule_appointment_at).getTime();
  }

  return 800_000_000_000 + new Date(p.created_at).getTime();
}

export function getScheduleReferenceDate(project: Project): Date {
  const kind = project.schedule_kind ?? "asap";
  if (kind === "appointment" && project.schedule_appointment_at) {
    return new Date(project.schedule_appointment_at);
  }
  if (kind === "window" && project.schedule_window_start) {
    return new Date(project.schedule_window_start);
  }
  return new Date();
}

export function calendarDateToLocalStartISO(date: CalendarDate): string {
  const d = new Date(date.year, date.month - 1, date.day, 0, 0, 0, 0);
  return d.toISOString();
}

export function calendarDateToLocalEndOfDayISO(date: CalendarDate): string {
  const d = new Date(date.year, date.month - 1, date.day, 23, 59, 59, 999);
  return d.toISOString();
}

export function buildScheduleRow(
  kind: ScheduleKind,
  windowStart: CalendarDate | null,
  windowEnd: CalendarDate | null,
  appointment: ZonedDateTime | null,
): {
  schedule_kind: ScheduleKind;
  schedule_window_start: string | null;
  schedule_window_end: string | null;
  schedule_appointment_at: string | null;
} {
  if (kind === "asap") {
    return {
      schedule_kind: "asap",
      schedule_window_start: null,
      schedule_window_end: null,
      schedule_appointment_at: null,
    };
  }
  if (kind === "window") {
    if (!windowStart || !windowEnd) {
      throw new Error("Window schedule requires start and end dates");
    }
    return {
      schedule_kind: "window",
      schedule_window_start: calendarDateToLocalStartISO(windowStart),
      schedule_window_end: calendarDateToLocalEndOfDayISO(windowEnd),
      schedule_appointment_at: null,
    };
  }
  if (!appointment) {
    throw new Error("Appointment schedule requires date and time");
  }
  return {
    schedule_kind: "appointment",
    schedule_window_start: null,
    schedule_window_end: null,
    schedule_appointment_at: appointment.toDate().toISOString(),
  };
}

export type ScheduleBadge = "overdueWindow" | "pastAppointment" | null;

export function getScheduleBadge(project: Project, now: Date = new Date()): ScheduleBadge {
  if (isProjectScheduleTerminal(project.project_status)) return null;
  const kind = project.schedule_kind ?? "asap";
  if (kind === "window" && isWindowOverdue(project, now)) return "overdueWindow";
  if (kind === "appointment" && isAppointmentPastDue(project, now)) return "pastAppointment";
  return null;
}

/** One-line summary for list rows (pass localized ASAP label). */
export function formatScheduleShort(project: Project, localeCode: string, asapLabel: string): string {
  const kind = project.schedule_kind ?? "asap";
  if (kind === "asap") return asapLabel;
  if (kind === "window" && project.schedule_window_start && project.schedule_window_end) {
    const a = new Date(project.schedule_window_start);
    const b = new Date(project.schedule_window_end);
    const fmt = (d: Date) =>
      d.toLocaleDateString(localeCode, { weekday: "short", day: "numeric", month: "short" });
    return `${fmt(a)} – ${fmt(b)}`;
  }
  if (kind === "appointment" && project.schedule_appointment_at) {
    const d = new Date(project.schedule_appointment_at);
    return d.toLocaleString(localeCode, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return asapLabel;
}
