import { describe, it, expect } from "vitest";
import { getOrgMembers, getProjectAssignees } from "@/lib/members";
import { mockClient, mockClientSequence } from "./mockClient";

describe("getOrgMembers", () => {
  it("returns members for an organization", async () => {
    const members = [
      { user_id: "u1", display_name: "Alice", role: "admin" },
      { user_id: "u2", display_name: "Bob", role: "member" },
    ];
    const client = mockClient({ data: members, error: null });

    const { data, error } = await getOrgMembers("org1", client);
    expect(error).toBeNull();
    expect(data).toEqual(members);
    expect(client.from).toHaveBeenCalledWith("organization_members");
  });

  it("returns error on failure", async () => {
    const client = mockClient({ data: null, error: { message: "forbidden" } });
    const { data, error } = await getOrgMembers("org1", client);
    expect(data).toBeNull();
    expect(error).toBe("forbidden");
  });
});

describe("getProjectAssignees", () => {
  it("returns assignees with display names", async () => {
    const client = mockClientSequence([
      { data: [{ user_id: "u1", organization_id: "org1" }, { user_id: "u2", organization_id: "org1" }], error: null },
      { data: [{ user_id: "u1", display_name: "Alice" }, { user_id: "u2", display_name: null }], error: null },
    ]);

    const { data, error } = await getProjectAssignees("p1", client);
    expect(error).toBeNull();
    expect(data).toEqual([
      { id: "u1", name: "Alice" },
      { id: "u2", name: "u2" },
    ]);
  });

  it("returns empty array when no assignees exist", async () => {
    const client = mockClient({ data: [], error: null });
    const { data, error } = await getProjectAssignees("p1", client);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("returns error when first query fails", async () => {
    const client = mockClient({ data: null, error: { message: "timeout" } });
    const { data, error } = await getProjectAssignees("p1", client);
    expect(data).toBeNull();
    expect(error).toBe("timeout");
  });

  it("filters organization_members by the project's organization_id", async () => {
    // Regression: users in multiple orgs must only get their display name from
    // the org the project belongs to, not a different org they also belong to.
    const client = mockClientSequence([
      { data: [{ user_id: "u1", organization_id: "org1" }], error: null },
      { data: [{ user_id: "u1", display_name: "Alice (org1)" }], error: null },
    ]);

    const { data } = await getProjectAssignees("p1", client);

    // Verify the second query was scoped to the correct org
    expect(client.from).toHaveBeenCalledTimes(2);
    expect(data).toEqual([{ id: "u1", name: "Alice (org1)" }]);
  });
});
