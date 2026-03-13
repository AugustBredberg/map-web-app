import { describe, it, expect } from "vitest";
import { fetchProjects, createProject, updateProject, deleteProject } from "@/lib/projects";
import { mockClient, mockClientSequence } from "./mockClient";

const sampleProject = {
  project_id: "p1",
  organization_id: "org1",
  created_at: "2025-01-01T00:00:00Z",
  created_by: "user1",
  start_time: null,
  expected_hours: null,
  project_status: 0,
  title: "Test Project",
  description: null,
  estimated_time: null,
  location: { type: "Point" as const, coordinates: [11.97, 57.70] as [number, number] },
};

describe("fetchProjects", () => {
  it("returns projects on success", async () => {
    const client = mockClient({ data: [sampleProject], error: null });
    const { data, error } = await fetchProjects(client);
    expect(error).toBeNull();
    expect(data).toEqual([sampleProject]);
    expect(client.from).toHaveBeenCalledWith("projects");
  });

  it("returns error message on failure", async () => {
    const client = mockClient({ data: null, error: { message: "db down" } });
    const { data, error } = await fetchProjects(client);
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
        estimated_time: null,
        project_status: 0,
        start_time: null,
        location: "POINT(11.97 57.70)",
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
        estimated_time: null,
        project_status: 0,
        start_time: null,
        location: "POINT(0 0)",
        organization_id: null,
      },
      [],
      client,
    );
    expect(data).toBeNull();
    expect(error).toBe("duplicate key");
  });
});

describe("updateProject", () => {
  it("updates project and replaces assignees", async () => {
    const client = mockClientSequence([
      { data: { ...sampleProject, title: "Updated" }, error: null },
      { data: null, error: null }, // delete old assignees
      { data: null, error: null }, // insert new assignees
    ]);

    const { data, error } = await updateProject(
      "p1",
      {
        title: "Updated",
        description: null,
        estimated_time: null,
        project_status: 1,
        start_time: null,
        location: "POINT(11.97 57.70)",
      },
      ["user3"],
      "org1",
      client,
    );

    expect(error).toBeNull();
    expect(data?.title).toBe("Updated");
    expect(client.from).toHaveBeenCalledWith("projects");
    expect(client.from).toHaveBeenCalledWith("project_assignees");
  });

  it("returns error when update fails", async () => {
    const client = mockClient({ data: null, error: { message: "not found" } });
    const { data, error } = await updateProject(
      "p1",
      { title: "X", description: null, estimated_time: null, project_status: 0, start_time: null, location: "POINT(0 0)" },
      [],
      null,
      client,
    );
    expect(data).toBeNull();
    expect(error).toBe("not found");
  });
});

describe("deleteProject", () => {
  it("deletes assignees then project on success", async () => {
    const client = mockClientSequence([
      { data: null, error: null }, // delete assignees
      { data: null, error: null }, // delete project
    ]);

    const { error } = await deleteProject("p1", client);

    expect(error).toBeNull();
    expect(client.from).toHaveBeenCalledTimes(2);
    expect(client.from).toHaveBeenCalledWith("project_assignees");
    expect(client.from).toHaveBeenCalledWith("projects");
  });

  it("returns error and skips project delete when assignee delete fails", async () => {
    const client = mockClientSequence([
      { data: null, error: { message: "assignee delete failed" } },
    ]);

    const { error } = await deleteProject("p1", client);

    expect(error).toBe("assignee delete failed");
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("returns error when project delete fails", async () => {
    const client = mockClientSequence([
      { data: null, error: null },                              // assignees deleted OK
      { data: null, error: { message: "project delete failed" } },
    ]);

    const { error } = await deleteProject("p1", client);

    expect(error).toBe("project delete failed");
  });
});
