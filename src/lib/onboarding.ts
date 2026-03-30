import type { SignupSource } from "@/lib/supabase";

export type PostLoginRoute = "/map" | "/onboarding/create-org" | "/onboarding/no-organization";

/**
 * Where to send an authenticated user after sign-in / landing when they have no org memberships.
 * Dev users always go to the map (global access). Invite/unknown users without an org see support.
 */
export function postLoginRouteForNoMembership(args: {
  systemRole: "dev" | null;
  signupSource: SignupSource;
}): PostLoginRoute {
  if (args.systemRole === "dev") return "/map";
  if (args.signupSource === "self_serve") return "/onboarding/create-org";
  return "/onboarding/no-organization";
}
