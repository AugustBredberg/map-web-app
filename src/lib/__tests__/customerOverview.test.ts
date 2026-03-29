import { describe, it, expect } from "vitest";
import {
  aggregateHoursByProjectAndUser,
  fetchCustomerOverviewData,
} from "@/lib/customerOverview";
import { mockClientSequence } from "./mockClient";

describe("aggregateHoursByProjectAndUser", () => {
  it("sums hours per project and user, treating null hours as 0", () => {
    const map = aggregateHoursByProjectAndUser([
      { project_id: "p1", user_id: "u1", hours: 4 },
      { project_id: "p1", user_id: "u1", hours: 2 },
      { project_id: "p1", user_id: "u2", hours: 3 },
      { project_id: "p2", user_id: "u1", hours: null },
    ]);

    expect(map.get("p1")?.get("u1")).toBe(6);
    expect(map.get("p1")?.get("u2")).toBe(3);
    expect(map.get("p2")?.get("u1")).toBe(0);
  });

  it("returns empty map for empty input", () => {
    expect(aggregateHoursByProjectAndUser([]).size).toBe(0);
  });
});

describe("fetchCustomerOverviewData", () => {
  it("merges customers, projects, assignees, and time logs", async () => {
    const client = mockClientSequence([
      {
        data: [
          {
            customer_id: 10,
            name: "Acme",
            phone: null,
            email: "a@test",
            notes: null,
            organization_id: "org-1",
            created_at: "2026-01-01",
            customer_locations: [
              { customer_location_id: 100, name: "HQ", address: "Main 1" },
            ],
          },
        ],
        error: null,
      },
      {
        data: [
          { user_id: "u1", display_name: "Worker One", role: "member", hourly_rate: null },
        ],
        error: null,
      },
      {
        data: [
          {
            project_id: "proj-1",
            title: "Job A",
            project_status: 3,
            start_time: "2026-03-15T10:00:00Z",
            customer_id: 10,
            customer_location_id: 100,
            customer_location: { name: "HQ", address: "Main 1" },
            project_assignees: [{ user_id: "u1" }],
          },
        ],
        error: null,
      },
      {
        data: [
          { project_id: "proj-1", user_id: "u1", hours: 5 },
          { project_id: "proj-1", user_id: "u1", hours: 2 },
        ],
        error: null,
      },
    ]);

    const { data, error } = await fetchCustomerOverviewData("org-1", client);

    expect(error).toBeNull();
    expect(data?.customers).toHaveLength(1);
    const row = data!.customers[0];
    expect(row.customer.name).toBe("Acme");
    expect(row.projects).toHaveLength(1);
    expect(row.projects[0].title).toBe("Job A");
    expect(row.projects[0].assigneeUserIds).toEqual(["u1"]);
    expect(row.projects[0].hoursByUserId.get("u1")).toBe(7);
    expect(row.stats.loggedHoursTotal).toBe(7);
    expect(data?.memberNames.get("u1")).toBe("Worker One");
    expect(data?.orgTotals.projectCount).toBe(1);
    expect(data?.orgTotals.loggedHoursTotal).toBe(7);
  });
});
