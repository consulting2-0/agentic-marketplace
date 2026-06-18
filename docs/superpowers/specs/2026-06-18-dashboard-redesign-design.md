# Dashboard Redesign — Design Spec

**Date:** 2026-06-18
**Status:** Approved (brainstorming) — ready for implementation planning
**Scope:** Visual + structural redesign of the Astro dashboard (`dashboard/`) serving www.aitmpl.com / app.aitmpl.com

---

## 1. Goals & Principles

The current dashboard, despite its "Consulting 2.0" color brand, still reproduces the upstream
aitmpl.com **structure** (persistent type-tab sidebar + dense card grid + cart-centric chrome). The
redesign exists to move away from that and to look genuinely appealing.

Decisions reached during brainstorming:

- **Structural rethink, not a reskin.** Retire the persistent left sidebar of type-tabs and the
  always-on cart chrome.
- **Lead with curated discovery** for a **mixed audience** (experienced SAP consultants, newcomers,
  and teams assembling a setup).
- **Everyone finds their stuff fast** — prominent always-on search for experts, journeys for
  newcomers, type-browsing for those who think in component types.
- **"Simpler" = calmer screens + flatter navigation + trimmed chrome**, applied holistically. Crucially,
  **no feature is removed** — secondary features move out of always-on chrome to one click away.
- **Visual identity = "Light editorial"** — premium, calm, and a clear departure from the dark original.

### Non-goals

- No changes to the CLI (`npx claude-code-templates`), API endpoints, or the `components.json` data
  contract.
- No changes to component data schema, download tracking, or admin internals.
- No re-platforming — stays on Astro 5 + React islands + Tailwind v4.

---

## 2. Information Architecture

### Home (`index.astro`) — single scroll, no sidebar

Top-to-bottom composition:

1. **Slim header** — logo (left), prominent search trigger (center), Workspace/auth + cart icon (right).
2. **Slim partner banner** — retained as a thin top strip (links to Consulting 2.0 org).
3. **Hero** — short headline (serif display) + prominent search bar.
4. **Journeys row** — outcome-based bundles ("Build a CAP app", "Add Joule", "Automate BTP ops",
   "AI Foundation"). Each journey is a **pre-filled stack** that installs multiple components together.
5. **Editorial rails** — horizontal curated rows: "Featured this week", "SAP Integration Suite",
   "Popular". Each rail is a few large component cards.
6. **Browse by type** — a compact section of type chips (Skills / Agents / Commands / Settings /
   Hooks / MCPs) linking into the catalog. Type browsing is preserved, but as an entry point rather
   than permanent chrome.
7. **Footer nav** — Trending, My Workspace, Featured series, About, GitHub.

### Catalog (`[...type].astro`)

Keeps type browsing + faceted filters (platform, category, sort, search, pagination). Reached from
the home "Browse by type" chips and from search. **Type becomes a filter, not persistent chrome.**

### Journey / bundle pages (`featured/[slug].astro`)

The existing Featured Series pages become **journeys**: a curated bundle presented as an installable
stack (one action adds all components to the cart / generates the combined `npx` command).

### Global, always available

- **Search** — header search bar plus global **Cmd+K** modal on every page.
- **My Workspace** (collections / `my-components.astro`), **Trending** (`trending.astro`),
  **Admin** (`admin/`), **Live-task** (`live-task.astro`) — all reachable via header/footer,
  internals unchanged.

---

## 3. Visual System — "Light editorial"

| Token group | Direction |
|---|---|
| Background | Warm off-white `#FBFAF7`; white `#FFFFFF` cards |
| Emphasis | Charcoal `#111111` used sparingly for accent cards / primary buttons |
| Accent | Single confident blue `#0057FF` (carries continuity from current primary-500) |
| Borders | Hairline `#E9E6DF` |
| Radii | 10–14px |
| Shadows | Restrained; subtle lift on hover only |
| Spacing | Generous whitespace; one clear focus per section |

**Typography**

- **Display / headlines:** `Instrument Serif` (large, editorial).
- **Logo / UI labels:** `Space Grotesk`.
- **Body:** `Inter`.
- **Code / install commands:** `JetBrains Mono` (retained).

**Token strategy:** rework the `@theme` block in `dashboard/src/styles/global.css` from the current
dark palette to this light palette, **keeping the same token names** (`--color-surface-*`,
`--color-text-*`, `--color-border`, `--color-primary-*`, font variables). Because the React islands
and Astro components reference tokens rather than hardcoded hex, most components inherit the new look
without per-component rewrites — remaining work is structural/spacing.

---

## 4. Feature Preservation Map

Nothing is removed; everything relocates.

| Feature (today) | Today's home | In the redesign |
|---|---|---|
| Type tabs (Skills/Agents/…) | Persistent left sidebar | "Browse by type" section on home + filter on catalog page |
| Cmd+K search | Top bar | Header search bar **and** global Cmd+K everywhere |
| Cart / "Add to Stack" | Floating button + side panel | Kept; journeys are pre-filled stacks |
| Featured carousel | Home carousel | Editorial rails on home |
| Featured Series pages | `/featured/[slug]` | Become journey / bundle pages |
| Trending / analytics | `/trending` | Kept; header/footer nav |
| My Components / collections | `/my-components` | Kept; "My Workspace" in header (auth area) |
| Component detail + MD/JSON/file-tree viewers | Detail page | Unchanged (light code style added) |
| Admin panel | `/admin` | Unchanged, separate |
| Live-task monitor | `/live-task` | Unchanged, separate |
| Partner banner | Top strip | Kept as slim strip |

---

## 5. Implementation Approach

Phased and non-breaking. Routes, install flows, and the `components.json` contract stay identical, so
existing component installs and download tracking keep working throughout.

Touch points:

1. **`dashboard/src/styles/global.css`** — replace dark `@theme` tokens with the light palette; add
   Google Fonts for `Instrument Serif` + `Space Grotesk`; add a light code/markdown style.
2. **`dashboard/src/layouts/DashboardLayout.astro`** — remove the persistent sidebar; introduce the
   slim header (logo + search + workspace/cart); keep the Clerk auth island.
3. **`dashboard/src/components/Sidebar.astro` / `TopBar.astro`** — retire sidebar; fold its nav into
   header + footer.
4. **`dashboard/src/pages/index.astro`** — recompose as hero → journeys → editorial rails →
   browse-by-type → footer.
5. **React islands** (`ComponentGrid.tsx`, `FeaturedSection.tsx`, `SearchModal.tsx`,
   `CartSidebar.tsx`, viewers) — restyle for the light theme; mostly spacing/structure since they read
   tokens. `FeaturedSection` generalizes into reusable editorial rails; add a journeys component.
6. **`featured/[slug].astro`** — present featured series as installable journey bundles.

---

## 6. Risks & Mitigations

- **Code viewers are dark-optimized.** The markdown/JSON/file-tree viewers assume a dark background.
  *Mitigation:* design a dedicated light code style as part of the `global.css` work; verify on a
  component detail page.
- **Removing the sidebar changes muscle memory.** Returning users lose the familiar type-tab rail.
  *Mitigation:* prominent always-on search + a clear "Browse by type" section preserve fast type
  access.
- **Light theme contrast / accessibility.** Warm off-white + hairline borders risk low contrast.
  *Mitigation:* verify WCAG AA contrast for text and interactive elements during implementation.
- **Token rename collisions.** Reusing dark token names with light values could surprise any component
  that assumed darkness. *Mitigation:* audit for hardcoded dark hex values in JSX/inline styles during
  the restyle pass.

---

## 7. Success Criteria

- Home leads with curated discovery (journeys + rails), no persistent type-tab sidebar.
- Every current feature remains reachable (per the preservation map).
- All three audiences have a fast path to their goal: search (experts), journeys (newcomers),
  browse-by-type (type-thinkers).
- Light editorial visual system applied consistently; AA contrast met.
- No regressions in component install flows, routes, or download tracking.
