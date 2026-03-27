# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Kartapp** is a single Next.js 16 (App Router) web app — a map-first field/job management platform for installation companies. The backend is entirely Supabase (remote, no local instance). There is no monorepo, no Docker, and no local database.

### Environment variables

The app requires three env vars in `.env.local` (see `.env.local.example`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (either works; see `src/lib/supabase.ts`)
- `NEXT_PUBLIC_MAPTILER_KEY`

These are injected as Cursor Cloud secrets. When creating `.env.local`, map `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` from the injected secret.

### Commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` (ESLint) |
| Tests | `npm test` (Vitest — mocks Supabase, no real backend needed) |
| Build | `npm run build` |

### Gotchas

- Protected routes (`/map`, `/projects`, `/financial`, `/settings`) redirect to `/login` when unauthenticated. To test these pages, a valid Supabase account is required.
- Tests are fully self-contained — they use a mock Supabase client (`src/lib/__tests__/mockClient.ts`) and dummy env vars set in `vitest.config.ts`. No running Supabase instance is needed for tests.
- The `.env.local` file is git-ignored and must be recreated each session from injected secrets.
