# Supabase source control and migrations workflow

This repository uses the Supabase CLI workflow with migrations so database schema, RLS policies, and Edge Functions are version controlled.

## Goals

- Treat the current hosted Supabase project as **production**.
- Keep all schema changes in `supabase/migrations/`.
- Keep Edge Functions in `supabase/functions/`.
- Prepare for a future **dev Supabase project** where migrations are validated before production rollout.

---

## Repository layout

```text
repo/
  app/                     # existing app code (if applicable)
  supabase/
    config.toml
    migrations/
      <timestamp>_*.sql
    functions/
      <function-name>/
        index.ts
    seed.sql
    .env.example
  docs/
    supabase.md
  .env.supabase.example
```

---

## Install Supabase CLI

### Option A: use local project dependency (recommended)

Already configured in this repo:

```bash
npm install
npx supabase --version
```

### Option B: global install

Follow official instructions:
https://supabase.com/docs/guides/cli/getting-started

---

## Environment variables

Copy the template and fill values:

```bash
cp .env.supabase.example .env.supabase
```

Required vars:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF_PROD`
- `SUPABASE_DB_PASSWORD_PROD`
- `SUPABASE_PROJECT_REF_DEV`
- `SUPABASE_DB_PASSWORD_DEV`

Load env vars in your shell before running commands:

```bash
set -a
source .env.supabase
set +a
```

> Never commit `.env.supabase` or any real keys/passwords.

---

## Link this repo to a Supabase project

### Link to production

```bash
npx supabase link \
  --project-ref "$SUPABASE_PROJECT_REF_PROD" \
  --password "$SUPABASE_DB_PASSWORD_PROD"
```

Equivalent npm script:

```bash
npm run supabase:link:prod
```

### Link to dev (later)

```bash
npx supabase link \
  --project-ref "$SUPABASE_PROJECT_REF_DEV" \
  --password "$SUPABASE_DB_PASSWORD_DEV"
```

Equivalent npm script:

```bash
npm run supabase:link:dev
```

---

## Initial migration from existing production schema

The baseline migration generated for current production is:

- `supabase/migrations/20260327151924_initial_schema_from_prod.sql`

It includes:

- required extension declarations (`postgis`, `pgcrypto`, `uuid-ossp`, `pg_graphql`, `supabase_vault`)
- tables and constraints in `public`
- helper functions in `public`
- row-level security enablement
- RLS policies
- grants used by `anon` / `authenticated` / `service_role`

Edge Functions currently deployed in production were pulled into:

- `supabase/functions/send-invite/index.ts`
- `supabase/functions/accept-invite/index.ts`

---

## Create a new migration

When making schema changes, never edit old migration files. Create a new one:

```bash
npx supabase migration new add_some_change
```

Then edit the generated SQL file in `supabase/migrations/`.

---

## Apply migrations to dev

Once your dev Supabase project exists:

1. Link to dev project
2. Push migrations

```bash
npm run supabase:link:dev
npm run supabase:db:push:dev
```

Or direct command:

```bash
npx supabase db push --linked
```

---

## Deploy migrations to production

After validating in dev:

```bash
npm run supabase:link:prod
npm run supabase:db:push:prod
```

Recommended safety checks:

```bash
npx supabase db push --linked --dry-run
```

Then run real push.

---

## Run Supabase locally

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:stop
```

Reset local DB with migrations + seed:

```bash
npm run supabase:db:reset
```

### Edge Functions (required for `send-invite`, `accept-invite`)

`supabase start` brings up Postgres, Auth, Kong, Storage, etc., but **`supabase functions serve` is what actually runs your code** under `supabase/functions/`. The [Supabase local quickstart](https://supabase.com/docs/guides/functions/local-quickstart) uses **two** terminals: `supabase start`, then `supabase functions serve`.

If you only run `supabase start` and call `POST http://127.0.0.1:54321/functions/v1/send-invite`, Kong often responds with **503 Service Unavailable** because no function worker is bound to that route.

**Setup:**

1. Keep **`npm run supabase:start`** (or `npx supabase start`) running.
2. Copy env for the function runtime:

   ```bash
   cp supabase/.env.example supabase/.env
   ```

3. Fill **`supabase/.env`** with the same values as local Supabase (from `npm run supabase:status` or `npx supabase status -o env`). At minimum:

   - `SUPABASE_URL=http://127.0.0.1:54321` (or the API URL from status)
   - `SUPABASE_SERVICE_ROLE_KEY` — use the **Secret** / service role key from status (not the anon key)

   Optional for email: `RESEND_API_KEY`, `FROM_EMAIL`, `SITE_URL` (defaults work for testing; without Resend, `send-invite` still creates the invite row and logs the link).

4. In a **second** terminal:

   ```bash
   npm run supabase:functions:serve
   ```

   This serves **all** functions in `supabase/functions/` with hot reload at `http://127.0.0.1:54321/functions/v1/<name>`.

5. Keep both processes running while you use the app (`npm run dev`).

**Troubleshooting:** If functions still fail, run `npx supabase functions serve --debug`, confirm Docker is healthy, and try `npx supabase stop` then `npx supabase start` before serving again.

---

## Recommended workflow (dev -> prod)

1. Create branch in git.
2. Add new migration with `supabase migration new ...`.
3. Apply migration to **dev** project.
4. Test app + RLS behavior + functions against dev.
5. Open PR with migration and function changes.
6. After review, apply same migration set to **prod** with `db push`.
7. Never mutate production schema manually from dashboard SQL editor unless emergency hotfix; if hotfix is required, immediately backfill the equivalent migration in git.

---

## Linking to different projects safely

The CLI stores link state under `supabase/.temp` (gitignored). Re-link before each environment action:

- before dev push: `npm run supabase:link:dev`
- before prod push: `npm run supabase:link:prod`

Do not assume previous link target.

---

## Useful npm scripts

- `npm run supabase:start`
- `npm run supabase:stop`
- `npm run supabase:status`
- `npm run supabase:migration:new -- <name>`
- `npm run supabase:db:push:dev`
- `npm run supabase:db:push:prod`
- `npm run supabase:functions:serve`
- `npm run supabase:functions:deploy -- <function-name>`

---

## Commands to complete setup on your machine

Because CLI auth is user-scoped, run these once locally with your credentials:

```bash
cp .env.supabase.example .env.supabase
# fill .env.supabase values
set -a && source .env.supabase && set +a

# link and verify pull from production
npm run supabase:link:prod
npx supabase db pull baseline_verify --schema public
```

If `db pull` produces differences from the baseline migration, review and commit a follow-up normalization migration.

---

## Notes on schema cleanup observed in production

Potential follow-up cleanups (optional, separate migrations):

1. `public.projects` has non-contiguous column positions (dropped columns in history). This is normal but can indicate legacy cleanup opportunities.
2. Some policy names contain typos (for example `only_create_in_my_orgainzation`). Safe to rename in a dedicated migration for readability.
3. Policy strategy mixes `public` and `authenticated` role targets. That may be intentional, but review whether anonymous role access is required table-by-table.

These are not blockers for source-control onboarding; keep baseline migration as-is, then clean up with explicit forward migrations.
