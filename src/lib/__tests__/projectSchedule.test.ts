import { describe, it, expect } from "vitest";
import type { Project } from "@/lib/supabase";
import {
  compareProjectsDispatchOrder,
  isWindowOverdue,
  isAppointmentPastDue,
  projectMatchesTodaysJobsFilter,
} from "@/lib/projectSchedule";

function p(overrides: Partial<Project> & { project_id: string }): Project {
  return {
    project_id: overrides.project_id,
    organization_id: "o",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    created_by: null,
    schedule_kind: overrides.schedule_kind ?? "asap",
    schedule_window_start: overrides.schedule_window_start ?? null,
    schedule_window_end: overrides.schedule_window_end ?? null,
    schedule_appointment_at: overrides.schedule_appointment_at ?? null,
    project_status: overrides.project_status ?? 0,
    title: "T",
    description: null,
    customer_id: null,
    customer_location_id: null,
    customer_location: null,
  };
}

describe("projectMatchesTodaysJobsFilter", () => {
  it("includes ASAP always", () => {
    const now = new Date("2026-04-01T12:00:00.000Z");
    expect(projectMatchesTodaysJobsFilter(p({ project_id: "1", schedule_kind: "asap" }), now)).toBe(true);
  });

  it("includes appointment on the same local day", () => {
    const now = new Date("2026-04-01T12:00:00.000Z");
    expect(
      projectMatchesTodaysJobsFilter(
        p({
          project_id: "1",
          schedule_kind: "appointment",
          schedule_appointment_at: "2026-04-01T08:00:00.000Z",
        }),
        now,
      ),
    ).toBe(true);
  });

  it("includes window overlapping today", () => {
    const now = new Date("2026-04-01T12:00:00.000Z");
    expect(
      projectMatchesTodaysJobsFilter(
        p({
          project_id: "1",
          schedule_kind: "window",
          schedule_window_start: "2026-03-28T00:00:00.000Z",
          schedule_window_end: "2026-04-05T23:59:59.999Z",
        }),
        now,
      ),
    ).toBe(true);
  });
});

describe("overdue and past-due flags", () => {
  it("flags window whose end is before today", () => {
    const now = new Date("2026-04-10T12:00:00.000Z");
    expect(
      isWindowOverdue(
        p({
          project_id: "1",
          schedule_kind: "window",
          schedule_window_start: "2026-04-01T00:00:00.000Z",
          schedule_window_end: "2026-04-05T23:59:59.999Z",
          project_status: 2,
        }),
        now,
      ),
    ).toBe(true);
  });

  it("flags appointment in the past when not done", () => {
    const now = new Date("2026-04-10T12:00:00.000Z");
    expect(
      isAppointmentPastDue(
        p({
          project_id: "1",
          schedule_kind: "appointment",
          schedule_appointment_at: "2026-04-01T09:00:00.000Z",
          project_status: 2,
        }),
        now,
      ),
    ).toBe(true);
  });
});

describe("compareProjectsDispatchOrder", () => {
  it("orders overdue window before future appointment", () => {
    const overdue = p({
      project_id: "a",
      schedule_kind: "window",
      schedule_window_start: "2026-03-01T00:00:00.000Z",
      schedule_window_end: "2026-03-05T23:59:59.999Z",
      project_status: 2,
    });
    const future = p({
      project_id: "b",
      schedule_kind: "appointment",
      schedule_appointment_at: "2026-05-01T10:00:00.000Z",
      project_status: 2,
    });
    const now = new Date("2026-04-01T12:00:00.000Z");
    expect(compareProjectsDispatchOrder(overdue, future, now)).toBeLessThan(0);
  });
});
