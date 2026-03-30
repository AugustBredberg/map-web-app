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
| DB reset (migrations + seed) | `npm run supabase:db:reset` |
| Build | `npm run build` |

### Gotchas

- Without `E2E_LOCAL_SUPABASE=1`, Playwright only runs **unauthenticated** specs (`e2e/*.spec.ts`). Tests under `e2e/authenticated/` are skipped.
- Protected routes (`/map`, `/projects`, `/customers`, `/financial`, `/settings`) redirect to `/?mode=signin` when unauthenticated.
- Vitest does not need a running database. Playwright **with** local auth needs local Supabase and a valid `NEXT_PUBLIC_MAPTILER_KEY` so the map page can load.
- The `.env.local` file is git-ignored; recreate from secrets or examples as needed.
- Signup against **remote** Supabase still requires email confirmation; use **seeded local users** for automated login instead.
