import { describe, it, expect } from "vitest";
import type { Project } from "@/lib/supabase";
import { partitionWorkProjects } from "@/lib/workOrder";

function p(overrides: Partial<Project> & { project_id: string }): Project {
  return {
    project_id: overrides.project_id,
    organization_id: "o",
    created_at: "2026-01-01T12:00:00Z",
    updated_at: "2026-01-01T12:00:00Z",
    created_by: null,
    schedule_kind: overrides.schedule_kind ?? "asap",
    schedule_window_start: overrides.schedule_window_start ?? null,
    schedule_window_end: overrides.schedule_window_end ?? null,
    schedule_appointment_at: overrides.schedule_appointment_at ?? null,
    project_status: overrides.project_status ?? 0,
    title: overrides.title ?? "Job",
    description: null,
    customer_id: null,
    customer_location_id: null,
    customer_location: null,
  };
}

describe("partitionWorkProjects", () => {
  const now = new Date("2026-04-01T12:00:00.000Z");

  it("drops done and cancelled", () => {
    const { ongoing, upNext, blocked } = partitionWorkProjects(
      [
        p({ project_id: "a", project_status: 5 }),
        p({ project_id: "b", project_status: 6 }),
        p({ project_id: "c", project_status: 3 }),
      ],
      now,
    );
    expect(ongoing.map((x) => x.project_id)).toEqual(["c"]);
    expect(upNext).toHaveLength(0);
    expect(blocked).toHaveLength(0);
  });

  it("places ongoing before up next and blocked last", () => {
    const { ongoing, upNext, blocked } = partitionWorkProjects(
      [
        p({ project_id: "blk", project_status: 4 }),
        p({ project_id: "go", project_status: 3 }),
        p({ project_id: "rd", project_status: 2 }),
      ],
      now,
    );
    expect(ongoing.map((x) => x.project_id)).toEqual(["go"]);
    expect(upNext.map((x) => x.project_id)).toEqual(["rd"]);
    expect(blocked.map((x) => x.project_id)).toEqual(["blk"]);
  });

  it("groups new, customer visit, and ready into up next sorted by dispatch order", () => {
    const a = p({
      project_id: "ap",
      project_status: 2,
      schedule_kind: "appointment",
      schedule_appointment_at: "2026-04-10T10:00:00.000Z",
    });
    const b = p({
      project_id: "early",
      project_status: 1,
      schedule_kind: "appointment",
      schedule_appointment_at: "2026-04-02T08:00:00.000Z",
    });
    const { upNext } = partitionWorkProjects([a, b], now);
    expect(upNext.map((x) => x.project_id)).toEqual(["early", "ap"]);
  });
});
