import { describe, it, expect } from "vitest";
import { normalizeCustomerJoin } from "@/lib/projectDisplay";
import type { Project } from "@/lib/supabase";

function baseProject(overrides: Partial<Project> = {}): Project {
  return {
    project_id: "p",
    organization_id: "o",
    created_at: "",
    updated_at: "",
    created_by: null,
    start_time: null,
    project_status: 0,
    title: "T",
    description: null,
    customer_id: null,
    customer_location_id: null,
    customer_location: null,
    ...overrides,
  };
}

describe("normalizeCustomerJoin", () => {
  it("returns null when customer is missing", () => {
    expect(normalizeCustomerJoin(baseProject())).toBeNull();
  });

  it("unwraps single-object embed", () => {
    const c = { name: "Acme", phone: "1", email: null };
    expect(normalizeCustomerJoin(baseProject({ customer: c }))).toEqual(c);
  });

  it("takes first element when embed is an array", () => {
    const c = { name: "Acme", phone: null, email: null };
    expect(normalizeCustomerJoin(baseProject({ customer: [c] }))).toEqual(c);
  });
});
