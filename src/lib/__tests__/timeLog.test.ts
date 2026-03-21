import { describe, it, expect } from "vitest";
import { getTimeLogEntries, upsertTimeLogEntry, deleteTimeLogEntry } from "@/lib/timeLog";
import { mockClient, mockClientSequence } from "./mockClient";

const sampleEntry = {
  id: "e1",
  user_id: "u1",
  project_id: "p1",
  date: "2026-03-17",
  hours: 7.5,
  created_at: "2026-03-17T08:00:00Z",
  updated_at: "2026-03-17T08:00:00Z",
};

// ---------------------------------------------------------------------------
// getTimeLogEntries
// ---------------------------------------------------------------------------

describe("getTimeLogEntries", () => {
  it("returns entries for the given project/user/date range", async () => {
    const client = mockClient({ data: [sampleEntry], error: null });

    const { data, error } = await getTimeLogEntries("p1", "u1", "2026-03-16", "2026-03-22", client);

    expect(error).toBeNull();
    expect(data).toEqual([sampleEntry]);
    expect(client.from).toHaveBeenCalledWith("project_time_log_entries");
  });

  it("returns empty array when no entries exist", async () => {
    const client = mockClient({ data: [], error: null });

    const { data, error } = await getTimeLogEntries("p1", "u1", "2026-03-16", "2026-03-22", client);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("returns error on failure", async () => {
    const client = mockClient({ data: null, error: { message: "permission denied" } });

    const { data, error } = await getTimeLogEntries("p1", "u1", "2026-03-16", "2026-03-22", client);

    expect(data).toBeNull();
    expect(error).toBe("permission denied");
  });
});

// ---------------------------------------------------------------------------
// upsertTimeLogEntry — insert path (no existing row)
// ---------------------------------------------------------------------------

describe("upsertTimeLogEntry (insert path)", () => {
  it("inserts a new row when none exists and returns the entry", async () => {
    // First call: maybeSingle → no existing row
    // Second call: insert → created entry
    const client = mockClientSequence([
      { data: null, error: null },
      { data: sampleEntry, error: null },
    ]);

    const { data, error } = await upsertTimeLogEntry("p1", "u1", "2026-03-17", 7.5, client);

    expect(error).toBeNull();
    expect(data).toEqual(sampleEntry);
    expect(client.from).toHaveBeenCalledTimes(2);
    expect(client.from).toHaveBeenCalledWith("project_time_log_entries");
  });

  it("returns error when insert fails", async () => {
    const client = mockClientSequence([
      { data: null, error: null },
      { data: null, error: { message: "insert failed" } },
    ]);

    const { data, error } = await upsertTimeLogEntry("p1", "u1", "2026-03-17", 7.5, client);

    expect(data).toBeNull();
    expect(error).toBe("insert failed");
  });
});

// ---------------------------------------------------------------------------
// upsertTimeLogEntry — update path (existing row found)
// ---------------------------------------------------------------------------

describe("upsertTimeLogEntry (update path)", () => {
  it("updates the existing row and returns the updated entry", async () => {
    const updatedEntry = { ...sampleEntry, hours: 4 };
    // First call: maybeSingle → existing row with id
    // Second call: update → updated entry
    const client = mockClientSequence([
      { data: { id: "e1" }, error: null },
      { data: updatedEntry, error: null },
    ]);

    const { data, error } = await upsertTimeLogEntry("p1", "u1", "2026-03-17", 4, client);

    expect(error).toBeNull();
    expect(data).toEqual(updatedEntry);
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it("returns error when update fails", async () => {
    const client = mockClientSequence([
      { data: { id: "e1" }, error: null },
      { data: null, error: { message: "update failed" } },
    ]);

    const { data, error } = await upsertTimeLogEntry("p1", "u1", "2026-03-17", 4, client);

    expect(data).toBeNull();
    expect(error).toBe("update failed");
  });

  it("returns error when the existence check fails", async () => {
    const client = mockClient({ data: null, error: { message: "network error" } });

    const { data, error } = await upsertTimeLogEntry("p1", "u1", "2026-03-17", 7.5, client);

    expect(data).toBeNull();
    expect(error).toBe("network error");
    // Should not attempt a second call after the first fails
    expect(client.from).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// deleteTimeLogEntry
// ---------------------------------------------------------------------------

describe("deleteTimeLogEntry", () => {
  it("deletes the entry and returns no error", async () => {
    const client = mockClient({ data: null, error: null });

    const { error } = await deleteTimeLogEntry("e1", client);

    expect(error).toBeNull();
    expect(client.from).toHaveBeenCalledWith("project_time_log_entries");
  });

  it("returns error on failure", async () => {
    const client = mockClient({ data: null, error: { message: "row not found" } });

    const { error } = await deleteTimeLogEntry("e1", client);

    expect(error).toBe("row not found");
  });
});
