import { describe, it, expect } from "vitest";
import { fetchProjects, createProject } from "@/lib/projects";
import { mockClient, mockClientSequence } from "./mockClient";

const sampleProject = {
  project_id: "p1",
  organization_id: "org1",
  created_at: "2025-01-01T00:00:00Z",
  created_by: "user1",
  start_time: null,
  project_status: 0,
  title: "Test Project",
  description: null,
  customer_id: "1",
  customer_location_id: "2",
  customer_location: null,
};

describe("fetchProjects", () => {
  it("returns projects on success", async () => {
    const client = mockClient({ data: [sampleProject], error: null });
    const { data } = await fetchProjects("org1", undefined, client);
    expect(data).toEqual([sampleProject]);
    expect(client.from).toHaveBeenCalledWith("projects");
  });

  it("returns error message on failure", async () => {
    const client = mockClient({ data: null, error: { message: "db down" } });
    const { data, error } = await fetchProjects("org1", undefined, client);
    expect(data).toBeNull();
    expect(error).toBe("db down");
  });
});

describe("createProject", () => {
  it("creates project and assigns members", async () => {
    const client = mockClientSequence([
      { data: sampleProject, error: null },
      { data: null, error: null }, // assignee insert
    ]);

    const { data, error } = await createProject(
      {
        title: "Test Project",
        description: null,
        project_status: 0,
        start_time: null,
        customer_id: "1",
        customer_location_id: "2",
        organization_id: "org1",
      },
      ["user1", "user2"],
      client,
    );

    expect(error).toBeNull();
    expect(data).toEqual(sampleProject);
    // Should have called from() twice: once for projects, once for assignees
    expect(client.from).toHaveBeenCalledTimes(2);
    expect(client.from).toHaveBeenCalledWith("projects");
    expect(client.from).toHaveBeenCalledWith("project_assignees");
  });

  it("returns error when insert fails", async () => {
    const client = mockClient({ data: null, error: { message: "duplicate key" } });
    const { data, error } = await createProject(
      {
        title: "Fail",
        description: null,
        project_status: 0,
        start_time: null,
        customer_id: "1",
        customer_location_id: "2",
        organization_id: null,
      },
      [],
      client,
    );
    expect(data).toBeNull();
    expect(error).toBe("duplicate key");
  });
});

