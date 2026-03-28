# Project Guidelines

## Product Overview

This app is a **SaaS field management platform** for installation companies. It is designed for businesses whose work is geographically spread out — such as companies installing solar panels, EV chargers, fiber optic cables, or heat pumps — where a manager coordinates multiple installers/workers who travel between several job sites per day.

### The Problem

Installation companies currently rely on a fragmented mix of Excel spreadsheets, WhatsApp, paper notes, and Google Maps to manage their work. This leads to:

- No single source of truth for where jobs are and who is doing them
- Managers have no real-time geographic overview of ongoing and upcoming work
- Installers don't have a clear, structured view of their day
- Photo documentation ends up scattered across chat apps
- Rework and missed jobs from miscommunication

### The Solution

A **map-first job management tool** that replaces all of that. The map is the central UI: every job is a pin on the map with a visible status. Managers plan and assign from the map; installers see their day as an ordered list and document their work directly in the app.

### User Roles

**Admin / Manager ("Installationschefen")**
- Lands directly on the map when opening the app
- Creates new jobs by clicking on the map or searching an address
- Assigns installers/teams to jobs
- Sees all jobs as pins color-coded by status
- Has a day-planning panel (sidebar on desktop, bottom sheet on mobile) showing all jobs ordered by start time with assignees and status
- Can filter the map by status, assignee, or date range
- Reviews submitted hours, expenses, and photo documentation

**Installer / Worker ("Installatören")**
- Opens the app and lands on **"My jobs today"** — a list of their assigned jobs for the day ordered by start time
- Taps a job to see the address, description, and contact person
- Can navigate to the job (via Google Maps or similar), start the job, upload photos (before/during/after) with optional comments, log worked hours and expenses, and mark the job as complete
- After completing a job, is guided to the next one

### Core Domain Concepts

**Project / Job** — the central entity. Has:
- Title and description
- Address + geographic coordinates (stored as PostGIS geometry)
- Status: `Lead → Quote → Signed → Planned → In Progress → Done → Billing`
- Assigned installers (one or more)
- Start time and estimated hours
- Worked hours (logged by installers)
- Expenses (title, reason, cost, who submitted it, timestamp)
- Photo attachments (before/during/after with optional comments)
- Presented price, agreed price, final price

**Organization** — the company using the platform. Users belong to an organization.

**Users / Members** — have one of two org-level roles:
- `admin` — full access: create/edit/delete jobs, assign team members, view all data
- `member` — restricted access: see and act on their own assigned jobs only

**Teams** — groups of installers. A project can be assigned to a team or individual members.

### Key Design Principles

- The **map is the primary navigation surface** for admins
- **Installers should never have to think about planning** — their UI answers "What do I do now?"
- The app must **replace Excel and WhatsApp entirely** — not add to the tool stack
- Mobile-first for installers; desktop-optimized for admins
- Photo documentation is first-class: before/during/after images are attached directly to the job

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **HeroUI** (`@heroui/react`) for UI components, built on **Tailwind CSS 4**
- **Supabase** for database (PostgreSQL + PostGIS), auth, and realtime
- **MapLibre GL** with MapTiler tiles for map rendering
- **Vitest** for unit testing; **Playwright** for E2E (`e2e/`)

## Agent workflow (implementing features)

1. Receive the prompt.
2. Implement the change (focused diff, match repo conventions).
3. Run **local Supabase**: `npm run supabase:start` (Docker). Check `npm run supabase:status` if services fail.
4. Apply **migrations + seed**: `npm run supabase:db:reset` (runs `supabase/migrations` and `supabase/seed.sql`).
5. Run **all checks**: `npm test`, `npm run lint`, `npm run test:e2e` (unauthenticated only), and for signed-in flows copy `.env.e2e.example` → `.env.e2e`, set `NEXT_PUBLIC_MAPTILER_KEY`, then `npm run test:e2e:local`.
6. If anything fails, fix and repeat from step 3 (or 5) until green.

**Seeded local users** (password `LocalDev_Seed_2026!`): `dev@seed.kartapp.test` (dev / all orgs), `admin@seed.kartapp.test`, `installer@seed.kartapp.test` — see `supabase/seed.sql` and `AGENTS.md`.

## Project Structure

- `src/app/` — Next.js App Router pages and layouts
- `src/components/` — Client components (`"use client"` directive)
- `src/context/` — React Context providers (Auth, Org, Drawer, NewProject)
- `src/hooks/` — Custom React hooks (map-related)
- `src/lib/` — Data access layer (Supabase queries, one file per domain)
- `src/lib/__tests__/` — Unit tests colocated with lib

## Code Conventions

- All components and contexts use `"use client"` at the top
- UI components import from `@heroui/react` (Button, Input, Select, etc.)
- Prefer `variant="bordered"` for form inputs
- Styling is Tailwind utility classes only — no CSS modules or styled-components
- Use `useCallback` for functions passed as props or stored in refs
- Default exports for components, named exports for lib functions and contexts

## Commands

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run lint` — Run ESLint
- `npm test` / `npx vitest run` — Unit tests (mocked Supabase)
- `npx vitest run src/lib/__tests__/<file>` — Single unit test file
- `npm run supabase:start` / `supabase:stop` / `supabase:status` — Local Supabase (Docker)
- `npm run supabase:db:reset` — Migrations + `supabase/seed.sql`
- `npm run test:e2e` — Playwright without authenticated specs (no local DB required)
- `npm run test:e2e:local` — Playwright including `e2e/authenticated/` (`E2E_LOCAL_SUPABASE=1`; needs local Supabase, seed, `.env.e2e` — see `.env.e2e.example`)

## Localization (i18n)

All user-visible text must use the translation system — never hardcode strings in JSX or component logic.

- **Translation dictionaries** live in `src/lib/i18n.ts` under `translations.en` and `translations.sv`. Both locales must always be kept in sync.
- **Access translations** in any client component via `const { t, locale, setLocale } = useLocale()` (from `@/context/LocaleContext`).
- **Add new keys** to `i18n.ts` in the relevant section (e.g. `settings`, `projectDetails`, `filters`). If no section fits, create a new one — add entries to both `en` and `sv` at the same time.
- **Never** add a key to one locale without adding it to the other.
- **`t("section.key")`** uses dot-notation. The key is returned as-is if it doesn't resolve, which makes missing translations easy to spot in the UI.
- **Language switcher** is in the Settings page (Appearance section). The locale is persisted to `localStorage` under the key `"locale"`. Default locale is `"sv"`.
- **`useCallback` deps**: if a callback uses `t(...)`, include `t` in its dependency array.
- **Language button labels** ("English", "Svenska") are intentionally not translated — they should always appear in their own language.
- **Date formatting**: use `locale` from `useLocale()` with a `LOCALE_CODE` map (`{ en: "en-GB", sv: "sv-SE" }`) when calling `toLocaleDateString` or similar APIs.

## Theming & Dark Mode

The app supports light and dark mode via `darkMode: "class"` in Tailwind. The `.dark` class is toggled on `<html>` by the theme provider.

**Always use semantic theme tokens instead of hardcoded colors.** Raw Tailwind palette colors (e.g. `bg-white`, `text-gray-900`, `bg-gray-100`) will not adapt to dark mode. Use the custom tokens defined in `src/app/globals.css` and registered under `@theme inline`:

| Token | Usage |
|---|---|
| `bg-background` | Page/app background |
| `bg-surface` | Cards, panels, sidebars |
| `bg-muted-bg` | Subtle secondary backgrounds, icon wells |
| `text-foreground` | Primary body text |
| `text-muted` | Secondary / subdued text |
| `border-border` | All borders and dividers |
| `bg-selected` | Selected/highlighted rows or items |
| `bg-sidebar-bg` / `text-sidebar-fg` | Sidebar-specific surfaces |
| `text-sidebar-muted` | Sidebar subdued text |
| `bg-sidebar-hover` | Sidebar hover state |
| `text-sidebar-active` | Sidebar active/selected item |
| `text-primary` / `bg-primary` | Brand blue (#2563eb) |
| `text-secondary` / `bg-secondary` | Brand violet (#7c3aed) |

**For status-colored UI** (e.g. `ProjectStatusBadge`): always pair light-mode palette classes with `dark:` variants. Use `/30` or `/50` opacity backgrounds in dark mode (e.g. `bg-blue-50 dark:bg-blue-900/30`) and softened text colors (e.g. `text-blue-500 dark:text-blue-400`).

**Never use**: `bg-white`, `bg-gray-50`, `bg-gray-100`, `text-black`, `text-gray-900`, `text-gray-800` — these are invisible or unreadable in dark mode. Use the semantic tokens above instead.

## Keeping Instructions Current

When adding new patterns, conventions, or architectural concepts (e.g. a new context, a new lib domain, a new component pattern), update the relevant instruction file in `.github/instructions/` to reflect the change. If the change is project-wide, update this file instead. Instructions should always match the actual codebase.
