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
