import { describe, it, expect } from "vitest";
import { addProjectComment, fetchProjectComments } from "@/lib/projectComments";
import { mockClient } from "./mockClient";

const row = {
  id: "c1",
  project_id: "p1",
  body: "Hello",
  created_by: "u1",
  author_display_name: "Test User",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("fetchProjectComments", () => {
  it("returns ordered comments", async () => {
    const client = mockClient({ data: [row], error: null });
    const { data, error } = await fetchProjectComments("p1", client);
    expect(error).toBeNull();
    expect(data).toEqual([row]);
    expect(client.from).toHaveBeenCalledWith("project_comments");
  });
});

describe("addProjectComment", () => {
  it("rejects empty body without calling the database", async () => {
    const client = mockClient({ data: null, error: null });
    const { data, error } = await addProjectComment("p1", "   ", client);
    expect(data).toBeNull();
    expect(error).toBe("empty");
    expect(client.from).not.toHaveBeenCalled();
  });

  it("inserts trimmed comment", async () => {
    const client = mockClient({ data: row, error: null });
    const { data, error } = await addProjectComment("p1", "  Hello  ", client);
    expect(error).toBeNull();
    expect(data).toEqual(row);
    expect(client.from).toHaveBeenCalledWith("project_comments");
  });
});
