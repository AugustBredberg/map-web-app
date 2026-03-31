import { describe, expect, it } from "vitest";
import { postLoginRouteForNoMembership } from "@/lib/onboarding";

describe("postLoginRouteForNoMembership", () => {
  it("sends dev users to the map", () => {
    expect(postLoginRouteForNoMembership({ systemRole: "dev", signupSource: "unknown" })).toBe("/map");
  });

  it("sends self-serve founders to create-org", () => {
    expect(postLoginRouteForNoMembership({ systemRole: null, signupSource: "self_serve" })).toBe(
      "/onboarding/create-org",
    );
  });

  it("sends invite and unknown users to support", () => {
    expect(postLoginRouteForNoMembership({ systemRole: null, signupSource: "invite" })).toBe(
      "/onboarding/no-organization",
    );
    expect(postLoginRouteForNoMembership({ systemRole: null, signupSource: "unknown" })).toBe(
      "/onboarding/no-organization",
    );
  });
});
