# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Kartapp** is a single Next.js 16 (App Router) web app — a map-first field/job management platform for installation companies. The backend is **Supabase** (PostgreSQL + PostGIS + Auth). Use a **local Supabase** stack when implementing features, running migrations, and executing Playwright tests that sign in with seeded users. Remote Supabase remains the deployment target; Cursor Cloud may still inject remote secrets for browser testing against prod-like envs when needed.

### Agent workflow (feature work)

1. **Receive the prompt** — clarify scope if requirements are ambiguous.
2. **Implement changes** — keep diffs focused; match existing patterns in the repo.
3. **Run local Supabase** — `npm run supabase:start` (Docker required). Use `npm run supabase:status` if something fails to connect.
4. **Apply schema + seed** — `npm run supabase:db:reset` runs migrations and `supabase/seed.sql` (seeded users and demo org/projects). For migration-only work without full reset, use your normal migration workflow.
5. **Run all tests** — `npm test` (Vitest), `npm run lint`, and Playwright against local stack: copy `.env.e2e.example` → `.env.e2e`, set `NEXT_PUBLIC_MAPTILER_KEY`, then `npm run test:e2e:local`.
6. **Iterate** — fix failures and repeat steps 3–5 until green.

### Local sign-in (seeded, `supabase db reset` only)

| Email | Password | Notes |
|-------|----------|--------|
| `dev@seed.kartapp.test` | `LocalDev_Seed_2026!` | `profiles.system_role = dev` — admin everywhere, all orgs |
| `admin@seed.kartapp.test` | `LocalDev_Seed_2026!` | Org admin, **Demo Installation AB** |
| `installer@seed.kartapp.test` | `LocalDev_Seed_2026!` | Org member; only sees assigned jobs in RLS |

Details and UUIDs live in `supabase/seed.sql`.

### Environment variables

**App (`.env.local`)** — three vars required at runtime:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (either works; see `src/lib/supabase.ts`)
- `NEXT_PUBLIC_MAPTILER_KEY`

**Playwright + local Supabase (`.env.e2e`)** — see `.env.e2e.example`. Must set `E2E_LOCAL_SUPABASE=1` and point `NEXT_PUBLIC_*` at `http://127.0.0.1:54321` with the local anon key (printed by `npm run supabase:status -o env`).

### Commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` (ESLint) |
| Unit tests | `npm test` (Vitest — mocks Supabase) |
| E2E (no local auth) | `npm run test:e2e` — landing + auth redirects only; no seeded backend required |
| E2E (local Supabase + seed) | `npm run test:e2e:local` — requires Docker, `supabase:start`, `supabase:db:reset`, `.env.e2e` with MapTiler key |
| Local Supabase | `npm run supabase:start` / `supabase:stop` / `supabase:status` |
| Edge Functions (local) | **Second terminal:** `npm run supabase:functions:serve` — see `docs/supabase.md` (required for `send-invite`, `accept-invite`; `supabase start` alone often returns **503** on `/functions/v1/*`) |
| DB reset (migrations + seed) | `npm run supabase:db:reset` |
| Build | `npm run build` |

### Gotchas

- **Edge Functions:** `supabase start` does **not** load your `supabase/functions/*` code into the runtime. Run **`npm run supabase:functions:serve`** in a **separate** terminal (with `supabase/.env` filled from `supabase status`, see `docs/supabase.md`). Without it, invocations to `http://127.0.0.1:54321/functions/v1/...` typically return **503**.
- Without `E2E_LOCAL_SUPABASE=1`, Playwright only runs **unauthenticated** specs (`e2e/*.spec.ts`). Tests under `e2e/authenticated/` are skipped.
- Protected routes (`/map`, `/projects`, `/customers`, `/financial`, `/settings`, `/onboarding/*`) redirect to `/?mode=signin` when unauthenticated.
- Vitest does not need a running database. Playwright **with** local auth needs local Supabase and a valid `NEXT_PUBLIC_MAPTILER_KEY` so the map page can load.
- The `.env.local` file is git-ignored; recreate from secrets or examples as needed.
- Signup against **remote** Supabase still requires email confirmation; use **seeded local users** for automated login instead.

---

## Self-serve organization creation vs invite-only

### Intent

- **Managers / founders** who sign up from the **landing page** set `signup_source = self_serve` (via `signUp` `options.data.signup_source` and `raw_user_meta_data` → `profiles.signup_source` through the `on_auth_user_created` trigger). After **email confirmation**, they **create their company** through **`/onboarding/create-org`**, which calls the **`create_organization_for_self_serve(text)`** RPC. They become **org admin** for that organization.
- **Installers** and anyone joining through an **invitation** must **not** casually create organizations. The **database** enforces this; the UI only guides.

### Who can create an organization

- **`profiles.signup_source = 'self_serve'`**, **`auth.users.email_confirmed_at` is set**, **not** `profiles.system_role = 'dev'`, and **no row** in `organization_members` for the user (one founder org per account in v1).
- The **`create_organization_for_self_serve`** `SECURITY DEFINER` function inserts into `organizations` and `organization_members` (admin) in one transaction and sets **`trial_ends_at`** (14 days from creation) and **`billing_status = 'trialing'`**. **Billing UI is not implemented**; columns are for a future paywall.

### Who cannot

- **`signup_source = 'invite'`** or **`unknown`** (invite-driven users, legacy accounts, installers without a founder path).
- **`system_role = 'dev'`** — dev users keep using the existing **direct `INSERT` into `organizations`** RLS policy (same as before) and **do not** use the self-serve RPC (the RPC rejects dev users by design).

### RLS and client `INSERT`

- **Do not** grant broad `INSERT` on `organizations` to authenticated users. **`public.organizations` INSERT remains allowed only for `profiles.system_role = 'dev'`** (unchanged). Self-serve creation uses the RPC, which runs with definer rights and **bypasses RLS** for those inserts.
- **`profiles.signup_source`** is populated by **`handle_new_user`** on `auth.users` insert and updated when invitations are accepted (see below).

### App routes

| Route | Purpose |
|-------|---------|
| `/onboarding/create-org` | Founder names the company; calls RPC (requires confirmed email + `self_serve`). |
| `/onboarding/no-organization` | Support copy for **invite / unknown** users with **no** org (wrong email, missing invite, etc.). **No** “create company” CTA. |

Authenticated users with **no** org memberships are sent from **`OrgGuard`** (and the landing page when signed in) to **create-org** or **no-organization** according to `signup_source`. Dev users with no org still go to **`/settings`** (existing behavior). **Settings** shows a **“Create company”** button only when **`signup_source === 'self_serve'`** and there are no orgs.

### Interaction with `/invite` and `accept-invite`

- **Landing `signUp`** passes **`signup_source: 'self_serve'`** in `options.data` (stored in `user_metadata` / `raw_user_meta_data`).
- **`accept-invite` Edge Function** creates users with **`user_metadata: { signup_source: 'invite' }`** and updates **`profiles.signup_source`** to **`invite`** after membership insert.
- **`accept_invitation_by_token`** (RPC used when an existing user accepts an invite by **link token**) and **`accept_invitation_by_id`** (RPC for **pending invites** in Settings) set **`profiles.signup_source = 'invite'`** so joiners are never treated as founders by default.

### Trial / billing

- **`organizations.trial_ends_at`** and **`organizations.billing_status`** (`none`, `trialing`, `active`, `past_due`, `canceled`) are **data-only** for now; **no payment provider** or paywall UI in this task.
