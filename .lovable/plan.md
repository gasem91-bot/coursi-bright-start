# COURSI Portal — Theme System + Mobile Overhaul

Two-part change, fully additive. No desktop regressions.

## Part 1 — Day/Night Theme

**Theme tokens (`src/styles.css`)**
Add `.theme-dark` and `.theme-light` CSS variable blocks per spec:
`--bg-primary`, `--bg-secondary`, `--bg-card`, `--border`,
`--text-primary`, `--text-secondary`, `--text-muted`.
Brand purple `#7B35FF` and cyan `#00D4C8` stay constant.
Keep existing `--coursi-*` vars as aliases so nothing breaks mid-refactor.

**Provider (`src/lib/theme.tsx`)**
`ThemeProvider` with `useState` initialized from `localStorage.cours_theme`
(default `dark`), `toggleTheme`, writes `data-theme` + class on
`document.documentElement` so SSR markup is consistent. Exposes
`useTheme()` hook.

**Wire-up**
Wrap `<Outlet />` in `src/routes/__root.tsx` with `ThemeProvider`.
Add a sun/moon toggle button into:
- `course.ai.tsx` top bar
- `dashboard.tsx` header
- `login.tsx` (top-right corner)

**Color migration**
The hardcoded `BG`, `BG_SOFT`, `BORDER`, white text in
`course.ai.tsx`, `dashboard.tsx`, `login.tsx` are converted to the new
CSS variables (via `var(--bg-primary)` etc. in inline styles). Brand
purple/cyan/gold stay literal. Cards, borders, panel backgrounds, and
body text all switch with the theme.

## Part 2 — Mobile Overhaul (course portal)

Current problems: `course.ai.tsx` is locked to `100vh` + `overflow:hidden`
with a fixed 300px sidebar — unusable under ~900px.

**Layout**
- Drop `100vh`/`overflow:hidden` below `900px`; page scrolls vertically.
- Sidebar becomes a slide-in drawer (right side, RTL) toggled by a
  hamburger button in the top bar. Backdrop closes it. Selecting a
  chapter auto-closes.
- Top bar: collapses to two rows on mobile (logo + actions row, then
  level/progress row). Badges and progress shrink; long names truncate.
- Content column: full width on mobile, generous padding, font sizes
  step down at `<640px`.

**Interactive widgets**
- Architecture diagram, automation flow, ROI calculator grid, comparison
  tables: wrap in `overflow-x-auto` containers with a min-width so they
  scroll horizontally cleanly instead of breaking the page.
- Quiz answer buttons, chat panel, CTAs: stack vertically and stretch to
  full width on mobile.

**Dashboard + Login**
Light pass: ensure padding/typography scale on small screens, theme
toggle visible, no horizontal overflow.

## Technical Notes

- Implementation uses a small `useIsMobile()` hook (already present at
  `src/hooks/use-mobile.tsx`) for sidebar drawer behavior.
- Inline styles remain (matching existing code style); colors are
  swapped to `var(--…)` strings so theme switching is reactive without a
  re-render.
- No business logic, data fetching, routing, or Supabase code changes.
- No new dependencies.

## Out of Scope

- Refactoring `course.ai.tsx` into smaller components (would be a
  separate cleanup pass).
- Auto theme based on system `prefers-color-scheme` (can be added later;
  spec says explicit toggle with localStorage).
