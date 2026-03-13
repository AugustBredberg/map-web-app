# Project Guidelines

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **HeroUI** (`@heroui/react`) for UI components, built on **Tailwind CSS 4**
- **Supabase** for database (PostgreSQL + PostGIS), auth, and realtime
- **MapLibre GL** with MapTiler tiles for map rendering
- **Vitest** for unit testing

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
- `npx vitest run` — Run all tests
- `npx vitest run src/lib/__tests__/<file>` — Run specific test file

## Keeping Instructions Current

When adding new patterns, conventions, or architectural concepts (e.g. a new context, a new lib domain, a new component pattern), update the relevant instruction file in `.github/instructions/` to reflect the change. If the change is project-wide, update this file instead. Instructions should always match the actual codebase.
