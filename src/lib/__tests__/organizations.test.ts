import { describe, it, expect } from "vitest";
import { getMembershipsByUserId, getOrganizationsByIds } from "@/lib/organizations";
import { mockClient } from "./mockClient";

describe("getMembershipsByUserId", () => {
  it("returns memberships for a user", async () => {
    const memberships = [
      { organization_id: "org1", user_id: "u1", role: "admin", created_at: "2025-01-01", display_name: "Alice" },
    ];
    const client = mockClient({ data: memberships, error: null });

    const { data, error } = await getMembershipsByUserId("u1", client);
    expect(error).toBeNull();
    expect(data).toEqual(memberships);
    expect(client.from).toHaveBeenCalledWith("organization_members");
  });

  it("returns error on failure", async () => {
    const client = mockClient({ data: null, error: { message: "network error" } });
    const { data, error } = await getMembershipsByUserId("u1", client);
    expect(data).toBeNull();
    expect(error).toBe("network error");
  });
});

describe("getOrganizationsByIds", () => {
  it("returns organizations matching the given IDs", async () => {
    const orgs = [
      { organization_id: "org1", name: "Acme", created_at: "2025-01-01" },
    ];
    const client = mockClient({ data: orgs, error: null });

    const { data, error } = await getOrganizationsByIds(["org1"], client);
    expect(error).toBeNull();
    expect(data).toEqual(orgs);
    expect(client.from).toHaveBeenCalledWith("organizations");
  });

  it("returns error on failure", async () => {
    const client = mockClient({ data: null, error: { message: "bad request" } });
    const { data, error } = await getOrganizationsByIds(["org1"], client);
    expect(data).toBeNull();
    expect(error).toBe("bad request");
  });
});
