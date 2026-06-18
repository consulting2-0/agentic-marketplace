# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Astro dashboard home around curated discovery (journeys + editorial rails + prominent search), remove the persistent type-tab sidebar, and apply a "Light editorial" visual system — preserving every existing feature.

**Architecture:** Token-first. The `@theme` block in `global.css` defines the design tokens; Astro components and React islands reference those tokens, so flipping the palette from dark to light cascades automatically. Hardcoded dark hex values (a known minority) are audited and replaced. The home page is recomposed from existing islands plus two new components (Journeys, generalized rails). Routes, install flows, and the `components.json` contract are untouched.

**Tech Stack:** Astro 5 (`output: 'server'`), React 19 islands, Tailwind CSS v4 (`@tailwindcss/vite`, `@theme` tokens), Clerk auth, Vercel adapter.

**Verification model:** This is a visual/structural redesign, so most tasks verify via `npx astro build` (must compile) **and** a visual check on the dev server (`npx astro dev --port 4321`) using the browser. There are no unit tests for CSS. Where a task changes behavior (e.g. nav links), the visual check confirms the behavior.

**Reference — spec:** `docs/superpowers/specs/2026-06-18-dashboard-redesign-design.md`

**Branch:** `redesign/dashboard-light-editorial` (already created; the spec commit is the base).

---

## Shared Reference: Dark → Light Token Map

Every restyle task uses this mapping. Token **names are unchanged**; only values flip. Components that already use token-based Tailwind classes (`bg-surface-0`, `text-text-primary`, `border-border`, etc.) inherit the new look with no edits. Only **hardcoded hex** needs manual replacement.

| Token | Old (dark) | New (light) | Role |
|---|---|---|---|
| `--color-surface-0` | `#040D20` | `#FBFAF7` | Page background (warm off-white) |
| `--color-surface-1` | `#071535` | `#FFFFFF` | Cards |
| `--color-surface-2` | `#0D1F45` | `#F4F2EC` | Subtle raised / hover |
| `--color-surface-3` | `#162850` | `#ECE9E0` | Raised / active |
| `--color-surface-4` | `#1E325C` | `#E3DFD4` | Strongest raised |
| `--color-border` | `#1A2E55` | `#E9E6DF` | Hairline borders |
| `--color-border-hover` | `#2B4880` | `#D8D3C7` | Border hover |
| `--color-text-primary` | `#E4EBF8` | `#16150F` | Headings / primary text |
| `--color-text-secondary` | `#8A9BBE` | `#5C5A50` | Body text |
| `--color-text-tertiary` | `#4D6080` | `#8A867A` | Muted / counts |
| `--color-primary-*` | blue scale | **unchanged** | Blue accent `#0057FF` works on light |
| `--color-accent-*` | mint scale | **unchanged** | Mint kept for success/download badges, used sparingly |

**Hardcoded dark hex to replace (found in JSX/inline styles), with light equivalents:**

| Hardcoded old | Replace with (light) |
|---|---|
| `#0D1117` (card bg) | `#FFFFFF` |
| `#111827` (card hover bg) | `#F4F2EC` |
| `#1C2433` (border) | `#E9E6DF` |
| `#2A3550` (border hover) | `#D8D3C7` |
| `#E4EBF8` (text) | `#16150F` |
| `#8A9BBE` (text-2) | `#5C5A50` |
| `#4D6080` (text-3) | `#8A867A` |

Prefer swapping a hardcoded hex for the **token class** (e.g. `bg-[#0D1117]` → `bg-surface-1`) where the element maps cleanly; use the literal light hex only when no token fits.

---

## Task 1: Baseline — confirm build + capture current look

**Files:** none (verification only)

- [ ] **Step 1: Install deps and build**

Run:
```bash
cd dashboard && npm install && npx astro build
```
Expected: build completes without errors. Record any pre-existing warnings so they aren't mistaken for regressions later.

- [ ] **Step 2: Start dev server and screenshot baseline**

Run:
```bash
cd dashboard && npx astro dev --port 4321
```
Open `http://localhost:4321/` in the browser and capture screenshots of: home, a catalog page (`/agents`), and a component detail page. These are the "before" reference for visual comparison.

- [ ] **Step 3: Commit nothing — this is a checkpoint only.**

---

## Task 2: Flip design tokens to Light editorial

**Files:**
- Modify: `dashboard/src/styles/global.css:3-58` (the `@theme` block + base `html`/`body`)

- [ ] **Step 1: Replace the `@theme` block and base styles**

Replace lines 3–58 (`@theme { ... }` through the `body { ... }` rule) with:

```css
@theme {
  /* Accent — Electric Blue (primary) — unchanged */
  --color-primary-50:  #e6eeff;
  --color-primary-100: #b3caff;
  --color-primary-200: #80a5ff;
  --color-primary-300: #4d81ff;
  --color-primary-400: #1a5cff;
  --color-primary-500: #0057FF;
  --color-primary-600: #0045cc;
  --color-primary-700: #003499;
  --color-primary-800: #002266;
  --color-primary-900: #001133;

  /* Mint accent — kept for success/download badges, used sparingly */
  --color-accent-50:  #e6fff6;
  --color-accent-100: #b3ffe4;
  --color-accent-200: #66ffca;
  --color-accent-300: #1affaf;
  --color-accent-400: #00E599;
  --color-accent-500: #00b377;
  --color-accent-600: #008055;
  --color-accent-700: #004d33;
  --color-accent-800: #001a11;
  --color-accent-900: #000d09;

  /* Light editorial surfaces */
  --color-surface-0: #FBFAF7;
  --color-surface-1: #FFFFFF;
  --color-surface-2: #F4F2EC;
  --color-surface-3: #ECE9E0;
  --color-surface-4: #E3DFD4;

  --color-border:       #E9E6DF;
  --color-border-hover: #D8D3C7;

  --color-text-primary:   #16150F;
  --color-text-secondary: #5C5A50;
  --color-text-tertiary:  #8A867A;

  /* Fonts — Light editorial */
  --font-sans:    'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-ui:      'Space Grotesk', 'Inter', sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;
}

html {
  background-color: var(--color-surface-0);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}

body {
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 2: Update selection, scrollbar hover, and the glow utility for light**

In the same file, update these rules (they currently assume dark):

```css
/* Scrollbar */
::-webkit-scrollbar-thumb:hover {
  background: #C4BFB2;
}

/* Selection */
::selection {
  background: rgba(0, 87, 255, 0.18);
}

/* Soft lift (was .c20-glow neon glow) */
.c20-glow {
  box-shadow: 0 1px 2px rgba(22, 21, 15, 0.04), 0 8px 24px rgba(22, 21, 15, 0.06);
}
```

- [ ] **Step 3: Build to verify CSS compiles**

Run: `cd dashboard && npx astro build`
Expected: PASS (no Tailwind/CSS errors).

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/styles/global.css
git commit -m "feat(redesign): flip design tokens to light editorial palette"
```

---

## Task 3: Load the new display + UI fonts

**Files:**
- Modify: `dashboard/src/layouts/DashboardLayout.astro:71` (Google Fonts link)

- [ ] **Step 1: Replace the font `<link>`**

Replace line 71 with a link that adds `Instrument Serif` and `Space Grotesk` (keep Inter + JetBrains Mono; Syne can be dropped):

```html
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: Build + visual check**

Run: `cd dashboard && npx astro build` (Expected: PASS), then on the dev server confirm fonts load (Network tab shows the new families, no 404s).

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/layouts/DashboardLayout.astro
git commit -m "feat(redesign): load Instrument Serif + Space Grotesk fonts"
```

---

## Task 4: Light-mode code & markdown viewer styles

**Files:**
- Modify: `dashboard/src/styles/global.css` (`.md-preview code`, `.md-preview .md-code-block code`, search highlight)

- [ ] **Step 1: Adjust low-contrast code styles for light backgrounds**

The inline-code and code-block colors were tuned for dark. Update these rules so code is readable on light surfaces:

```css
.md-preview code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: rgba(0, 87, 255, 0.07);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  color: var(--color-primary-700);
}

.md-preview .md-code-block {
  position: relative;
  margin: 1em 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
}

.md-preview .md-code-block code {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: 0.82rem;
  line-height: 1.6;
  color: var(--color-text-primary);
}

mark.md-search-hl {
  background: rgba(0, 87, 255, 0.18);
  color: var(--color-text-primary);
  border-radius: 2px;
  padding: 0 1px;
}
```

- [ ] **Step 2: Build + visual check on a component detail page**

Run `cd dashboard && npx astro build` (Expected: PASS). On the dev server open a component detail page with markdown + a fenced code block (e.g. any agent) and confirm code is dark-on-light and readable.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/styles/global.css
git commit -m "feat(redesign): light-mode markdown & code viewer styles"
```

---

## Task 5: New site header (logo + prominent search + workspace/cart)

Replaces the role of `TopBar.astro`. The header is always-on and holds search (experts) + workspace/cart, with no sidebar.

**Files:**
- Create: `dashboard/src/components/SiteHeader.astro`
- Reference (do not edit yet): `dashboard/src/components/TopBar.astro` (source of the search-trigger + cart-mount markup)

- [ ] **Step 1: Create `SiteHeader.astro`**

```astro
---
import AuthButton from './AuthButton';
import { NAV_LINKS } from '../lib/constants';
---

<header class="sticky top-0 z-30 bg-surface-0/85 backdrop-blur-md border-b border-border">
  <div class="flex items-center gap-4 px-5 md:px-8 h-14 max-w-[1180px] mx-auto">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2 shrink-0">
      <span class="text-[17px] font-semibold tracking-tight" style="font-family: var(--font-ui);">
        consulting<span class="text-primary-500">2.0</span>
      </span>
    </a>

    <!-- Prominent search trigger -->
    <button
      id="searchTrigger"
      class="group flex items-center gap-2.5 px-4 h-9 flex-1 max-w-md mx-auto bg-surface-1 border border-border rounded-full text-[13px] text-text-tertiary hover:border-border-hover transition-colors"
    >
      <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span>Search agents, skills, commands…</span>
      <kbd class="hidden sm:inline-flex ml-auto items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono border border-border rounded text-text-tertiary">⌘K</kbd>
    </button>

    <!-- Right: trending link, cart mount, auth -->
    <nav class="flex items-center gap-3 shrink-0">
      <a href={NAV_LINKS.trending} class="hidden sm:inline text-[13px] text-text-secondary hover:text-text-primary">Trending</a>
      <div id="cart-button-mount"></div>
      <AuthButton client:load />
    </nav>
  </div>
</header>
```

- [ ] **Step 2: Build to verify it compiles (not yet wired into a page)**

Run: `cd dashboard && npx astro build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/SiteHeader.astro
git commit -m "feat(redesign): add SiteHeader (logo + prominent search + workspace)"
```

---

## Task 6: Remove sidebar from layout; adopt SiteHeader + light footer

**Files:**
- Modify: `dashboard/src/layouts/DashboardLayout.astro:73-101` (body markup)

- [ ] **Step 1: Replace the `<body>` markup**

Replace lines 73–101 (the `<body>...</body>` block) with a single-column layout — no sidebar, header at top, centered content, light footer:

```astro
  <body class="bg-surface-0 text-text-primary antialiased">
    <SiteHeader />
    <main class="min-h-[calc(100vh-3.5rem)]">
      <div class="max-w-[1180px] mx-auto px-5 md:px-8">
        <slot />
      </div>
      <footer class="mt-16 px-6 py-8 border-t border-border">
        <div class="max-w-[1180px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-text-tertiary">
          <p>
            Made with ❤️ in Amsterdam by Claude Code &amp;
            <a href="https://www.linkedin.com/in/sudiphcp/" target="_blank" rel="noopener noreferrer"
              class="text-text-secondary hover:text-text-primary underline underline-offset-2">Sudip</a>
          </p>
          <nav class="flex items-center gap-4">
            <a href="/trending" class="hover:text-text-primary">Trending</a>
            <a href="/my-components" class="hover:text-text-primary">My Workspace</a>
            <a href="https://github.com/sghosh13/btp-templates" target="_blank" rel="noopener noreferrer" class="hover:text-text-primary">GitHub</a>
          </nav>
        </div>
      </footer>
    </main>

    <!-- Single Clerk island for auth — shared React instance with all Astro islands -->
    <ClerkIsland client:load />
  </body>
```

- [ ] **Step 2: Update the layout imports**

At the top of the frontmatter (lines 2–3), replace the `Sidebar` import with `SiteHeader`:

```astro
import SiteHeader from '../components/SiteHeader.astro';
import ClerkIsland from '../components/ClerkIsland.tsx';
import '../styles/global.css';
```

- [ ] **Step 3: Build + visual check**

Run: `cd dashboard && npx astro build` (Expected: PASS). On the dev server, confirm every page now renders with the top header and no left sidebar, content centered, light footer at the bottom.

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/layouts/DashboardLayout.astro
git commit -m "feat(redesign): single-column layout with SiteHeader, drop sidebar"
```

---

## Task 7: Remove now-dead sidebar wiring & mobile toggle

**Files:**
- Modify: `dashboard/src/components/TopBar.astro` (delete file — superseded by SiteHeader)
- Modify: `dashboard/src/pages/index.astro:3,30` (remove `TopBar` import + usage — done fully in Task 10; here just confirm no other page imports it)
- Verify: `dashboard/src/components/Sidebar.astro` and `MyComponentsSidebarItem.tsx` are no longer imported anywhere

- [ ] **Step 1: Find remaining references to the removed pieces**

Run:
```bash
cd dashboard && grep -rn "TopBar\|Sidebar\|toggleSidebar" src/ --include=*.astro --include=*.tsx
```
Expected after Task 6: references only in `index.astro` and `[...type].astro` (handled in Tasks 10/16). `Sidebar.astro` should have no importers.

- [ ] **Step 2: Delete the dead component files**

```bash
cd dashboard && git rm src/components/TopBar.astro src/components/Sidebar.astro src/components/NavItem.astro
```
(Keep `MyComponentsSidebarItem.tsx` — it may be reused in the footer/workspace link; only delete if Step 1 shows no importers.)

- [ ] **Step 3: Build**

Run: `cd dashboard && npx astro build`
Expected: PASS (if it fails with "cannot find TopBar/Sidebar", finish wiring in Tasks 10/16 first, then return).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore(redesign): remove sidebar/topbar dead components"
```

---

## Task 8: Journeys component (outcome-based bundles)

A curated row of outcome tiles at the top of home. Built from `FEATURED_ITEMS` (each is already a curated bundle with an install command and metadata).

**Files:**
- Create: `dashboard/src/components/Journeys.astro`
- Reference: `dashboard/src/lib/constants.ts:8-78` (`FEATURED_ITEMS`)

- [ ] **Step 1: Create `Journeys.astro`**

```astro
---
import { FEATURED_ITEMS } from '../lib/constants';

const journeys = FEATURED_ITEMS.map((item) => ({
  title: item.name,
  description: item.description,
  href: item.url,
  count: item.metadata?.Agents ? `${item.metadata.Agents} components` : 'Bundle',
  tag: item.tag,
}));
---

<section class="pt-6">
  <div class="flex items-baseline justify-between mb-4">
    <h2 class="text-[13px] font-medium uppercase tracking-widest text-text-tertiary" style="font-family: var(--font-ui);">Start with a goal</h2>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {journeys.map((j) => (
      <a href={j.href}
        class="group block bg-surface-1 border border-border rounded-xl p-5 hover:border-border-hover hover:shadow-[0_8px_24px_rgba(22,21,15,0.06)] transition-all">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-medium uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{j.tag}</span>
          <span class="text-text-tertiary group-hover:text-primary-500 transition-colors">→</span>
        </div>
        <h3 class="text-[16px] font-semibold text-text-primary mb-1">{j.title}</h3>
        <p class="text-[13px] text-text-secondary leading-snug mb-3">{j.description}</p>
        <span class="text-[12px] text-text-tertiary tabular-nums">{j.count}</span>
      </a>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Build**

Run: `cd dashboard && npx astro build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/Journeys.astro
git commit -m "feat(redesign): add Journeys section (outcome bundles)"
```

---

## Task 9: Hero section component

**Files:**
- Create: `dashboard/src/components/HomeHero.astro`

- [ ] **Step 1: Create `HomeHero.astro`**

```astro
---
---
<section class="pt-14 pb-6 text-center">
  <h1 class="text-[clamp(36px,6vw,64px)] leading-[1.04] text-text-primary" style="font-family: var(--font-display);">
    Ship your SAP&nbsp;BTP<br />setup in <em class="text-primary-500 italic">minutes</em>.
  </h1>
  <p class="mt-4 text-[15px] text-text-secondary max-w-xl mx-auto">
    Browse and install AI agents, skills, commands, hooks and MCP integrations built for enterprise consulting.
  </p>
  <button
    id="heroSearchTrigger"
    class="mt-7 inline-flex items-center gap-2.5 px-5 h-11 bg-surface-1 border border-border rounded-full text-[14px] text-text-tertiary hover:border-border-hover transition-colors mx-auto"
  >
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <span>Search the catalog…</span>
    <kbd class="ml-1 px-1.5 py-0.5 text-[10px] font-mono border border-border rounded">⌘K</kbd>
  </button>
</section>

<script>
  // Hero search opens the same Cmd+K modal as the header trigger.
  document.getElementById('heroSearchTrigger')?.addEventListener('click', () => {
    document.getElementById('searchTrigger')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
</script>
```

- [ ] **Step 2: Build**

Run: `cd dashboard && npx astro build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/HomeHero.astro
git commit -m "feat(redesign): add HomeHero with serif display + search"
```

---

## Task 10: Recompose the home page

**Files:**
- Modify: `dashboard/src/pages/index.astro` (full rewrite of the body composition)

- [ ] **Step 1: Rewrite `index.astro`**

Replace the component imports and body (lines 2–8 and 30–35) so the home is: hero → journeys → editorial rails (existing `FeaturedSection`) → browse-by-type → grid. Remove `TopBar` (now in layout) and `PartnerBanner` from the import list if keeping it as a slim strip — keep `PartnerBanner` import and render it right under the hero. Final file:

```astro
---
import DashboardLayout from '../layouts/DashboardLayout.astro';
import HomeHero from '../components/HomeHero.astro';
import Journeys from '../components/Journeys.astro';
import BrowseByType from '../components/BrowseByType.astro';
import PartnerBanner from '../components/PartnerBanner.astro';
import FeaturedSection from '../components/FeaturedSection.tsx';
import ComponentGrid from '../components/ComponentGrid.tsx';
import SearchModal from '../components/SearchModal.tsx';
import CartSidebar from '../components/CartSidebar.tsx';

export const prerender = false;
---

<DashboardLayout
  title="Consulting 2.0 — Agentic Marketplace for Enterprise Intelligence"
  description="Browse and install AI agents, skills, commands, hooks, and MCP integrations built for enterprise consulting. SAP BTP, Integration Suite, CAP, ABAP Cloud, AI Foundation and more."
>
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Consulting 2.0",
    "description": "The open-source agentic marketplace for enterprise intelligence.",
    "url": "https://consulting20.com/",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Windows, macOS, Linux",
    "author": { "@id": "https://consulting20.com/#organization" },
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "softwareRequirements": "Node.js 18+, Claude Code CLI",
    "license": "https://opensource.org/licenses/MIT"
  })} />

  <HomeHero />
  <PartnerBanner />
  <Journeys />
  <FeaturedSection client:load />
  <BrowseByType />
  <ComponentGrid client:load initialType="skills" />
  <SearchModal client:idle />
  <CartSidebar client:idle />
</DashboardLayout>
```

- [ ] **Step 2: Build + visual check**

Run: `cd dashboard && npx astro build` (Expected: PASS). On the dev server, confirm home renders top-to-bottom: hero → partner strip → journeys → featured rails → browse-by-type → component grid. (BrowseByType is created in Task 11; if building before that, comment its import/usage and restore after Task 11.)

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/pages/index.astro
git commit -m "feat(redesign): recompose home (hero + journeys + rails + browse)"
```

---

## Task 11: Browse-by-type section

Preserves type browsing as an on-page section (replacing the sidebar tabs) that links into the catalog.

**Files:**
- Create: `dashboard/src/components/BrowseByType.astro`
- Reference: `dashboard/src/lib/icons.ts` (`TYPE_CONFIG`, `ICONS`)

- [ ] **Step 1: Create `BrowseByType.astro`**

```astro
---
import { TYPE_CONFIG, ICONS } from '../lib/icons';
---

<section class="pt-10">
  <h2 class="text-[13px] font-medium uppercase tracking-widest text-text-tertiary mb-4" style="font-family: var(--font-ui);">Browse by type</h2>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
    {Object.entries(TYPE_CONFIG).map(([type, config]) => (
      <a href={`/${type}`}
        class="group flex items-center gap-2.5 bg-surface-1 border border-border rounded-lg px-3 py-2.5 hover:border-border-hover transition-colors">
        <span class="w-4 h-4 shrink-0 text-text-tertiary group-hover:text-primary-500 [&>svg]:w-4 [&>svg]:h-4" set:html={ICONS[type]} />
        <span class="text-[13px] text-text-secondary group-hover:text-text-primary truncate" data-count-type={type}>{config.label}</span>
      </a>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Build + visual check**

Run: `cd dashboard && npx astro build` (Expected: PASS). Confirm the six type chips render and each links to its catalog page (`/skills`, `/agents`, …).

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/BrowseByType.astro
git commit -m "feat(redesign): add Browse-by-type section"
```

---

## Task 12: Restyle ComponentGrid cards for light

**Files:**
- Modify: `dashboard/src/components/ComponentGrid.tsx`

- [ ] **Step 1: Read the file, then find hardcoded dark hex**

Run:
```bash
cd dashboard && grep -nE "#0D1117|#111827|#1C2433|#2A3550|#E4EBF8|#8A9BBE|#4D6080" src/components/ComponentGrid.tsx
```
Note every line.

- [ ] **Step 2: Replace per the Shared Reference map**

For each match, swap to the token class or light hex from the Dark→Light table at the top of this plan. Concretely: card container `bg-[#0D1117]` → `bg-surface-1`; `border-[#1C2433]` → `border-border`; `hover:border-[#2A3550]` → `hover:border-border-hover`; `hover:bg-[#111827]` → `hover:bg-surface-2`; title `text-[#E4EBF8]` → `text-text-primary`; description `text-[#4D6080]` → `text-text-tertiary`; any `text-[#8A9BBE]` → `text-text-secondary`. Keep download/success badges using `accent-*` (mint) and category badges on `surface-2`.

- [ ] **Step 3: Build + visual check**

Run: `cd dashboard && npx astro build` (Expected: PASS). On the dev server confirm grid cards are white-on-off-white with hairline borders, readable text, hover lift.

- [ ] **Step 4: Re-run the grep to confirm no dark hex remains**

Run the Step 1 grep again. Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/components/ComponentGrid.tsx
git commit -m "feat(redesign): restyle ComponentGrid cards for light theme"
```

---

## Task 13: Restyle SearchModal for light

**Files:**
- Modify: `dashboard/src/components/SearchModal.tsx`

- [ ] **Step 1: Grep for dark hex + dark overlay**

Run:
```bash
cd dashboard && grep -nE "#0D1117|#1C2433|#E4EBF8|#8A9BBE|#4D6080|bg-black/|bg-surface-2" src/components/SearchModal.tsx
```

- [ ] **Step 2: Apply light treatment**

Swap hardcoded hex per the map. Keep the backdrop as `bg-black/40` (works on light), modal panel `bg-surface-1` with `border border-border`, results hover `bg-surface-2`, selected result `bg-primary-50 text-text-primary`. Input text `text-text-primary`, placeholder `text-text-tertiary`.

- [ ] **Step 3: Build + visual check**

Run: `cd dashboard && npx astro build` (Expected: PASS). On the dev server press ⌘K, confirm the modal is a white panel on a dimmed backdrop, typing filters results, arrow keys highlight with the blue selection.

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/components/SearchModal.tsx
git commit -m "feat(redesign): restyle SearchModal for light theme"
```

---

## Task 14: Restyle CartSidebar for light

**Files:**
- Modify: `dashboard/src/components/CartSidebar.tsx`

- [ ] **Step 1: Grep for dark hex / inverted button**

Run:
```bash
cd dashboard && grep -nE "#0D1117|#1C2433|#E4EBF8|#8A9BBE|#4D6080|bg-white text-black|bg-surface-2" src/components/CartSidebar.tsx
```

- [ ] **Step 2: Apply light treatment**

The floating "Add to Stack" button is currently `bg-white text-black` (an inverted accent for the dark theme). On light, invert it to a solid accent: `bg-[#111111] text-white` (charcoal emphasis from the visual system). Side panel `bg-surface-1 border-l border-border`; item rows `border-border`; "Copy npx command" button `bg-primary-500 text-white hover:bg-primary-600`; secondary buttons `border border-border text-text-secondary hover:text-text-primary`.

- [ ] **Step 3: Build + visual check**

Run: `cd dashboard && npx astro build` (Expected: PASS). Add a component to the stack, confirm the floating charcoal button appears, the panel opens white, the npx command copies.

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/components/CartSidebar.tsx
git commit -m "feat(redesign): restyle CartSidebar for light theme"
```

---

## Task 15: Slim the PartnerBanner

**Files:**
- Modify: `dashboard/src/components/PartnerBanner.astro`

- [ ] **Step 1: Read the file and reduce it to a slim single-line strip**

Reduce vertical padding to a thin strip (`py-2`), use `bg-surface-2 border border-border rounded-lg` instead of a heavy gradient, single line of text + link. Replace any dark gradient background with the light treatment. Keep the link target unchanged.

- [ ] **Step 2: Build + visual check**

Run: `cd dashboard && npx astro build` (Expected: PASS). Confirm the banner is now a thin light strip under the hero, not a tall gradient block.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/PartnerBanner.astro
git commit -m "feat(redesign): slim PartnerBanner to a light strip"
```

---

## Task 16: Catalog page works without the sidebar

**Files:**
- Modify: `dashboard/src/pages/[...type].astro`

- [ ] **Step 1: Read the file; remove TopBar/Sidebar usage**

It currently renders `TopBar` (and relies on the sidebar from the layout). Remove the `TopBar` import + usage (now in `SiteHeader` via the layout). Add a page heading using the display font and ensure `ComponentGrid` receives the type from the route as before.

```astro
<!-- after frontmatter, inside DashboardLayout -->
<header class="pt-10 pb-4">
  <h1 class="text-[clamp(28px,4vw,44px)] text-text-primary" style="font-family: var(--font-display);">{pageTitle}</h1>
  <p class="text-[14px] text-text-secondary mt-1">Browse and install {pageTitle.toLowerCase()}.</p>
</header>
<ComponentGrid client:load initialType={type} />
<SearchModal client:idle />
<CartSidebar client:idle />
```
(Compute `pageTitle` from the route `type` via `TYPE_CONFIG[type].label` in the frontmatter.)

- [ ] **Step 2: Build + visual check**

Run: `cd dashboard && npx astro build` (Expected: PASS). Visit `/agents`, `/skills`, etc. — confirm each shows a serif page title, the filter bar, and the light grid, with no sidebar.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/pages/[...type].astro
git commit -m "feat(redesign): catalog page heading + drop sidebar dependency"
```

---

## Task 17: Light-theme pass on remaining pages

**Files (audit + fix each):**
- `dashboard/src/pages/component/[type]/[...slug].astro` + viewers (`MarkdownViewer.tsx`, `JsonViewer.tsx`, `FileTreeSidebar.tsx`, `SkillExplorer.tsx`)
- `dashboard/src/pages/trending.astro` + `TrendingView.tsx`
- `dashboard/src/pages/my-components.astro` + `MyComponentsView.tsx`
- `dashboard/src/pages/featured/[slug].astro`

- [ ] **Step 1: Grep the whole src tree for remaining dark hardcoded hex**

Run:
```bash
cd dashboard && grep -rnE "#040D20|#071535|#0D1F45|#162850|#0D1117|#111827|#1C2433|#2A3550|#E4EBF8|#8A9BBE|#4D6080" src/ --include=*.tsx --include=*.astro
```
This is the master list of everything still dark-hardcoded.

- [ ] **Step 2: Fix each match using the Dark→Light map**

Work file by file, swapping to token classes/light hex. After each file, run `cd dashboard && npx astro build` and visually check that page on the dev server (detail page, trending, my-components, a featured/journey page).

- [ ] **Step 3: Re-run the grep — expect zero matches**

Run the Step 1 grep. Expected: no matches across the tree.

- [ ] **Step 4: Commit (one commit per page is fine; or batch)**

```bash
git add dashboard/src
git commit -m "feat(redesign): light-theme pass on detail, trending, workspace, featured pages"
```

---

## Task 18: Admin & live-task light check (low priority, internal)

**Files:**
- `dashboard/src/components/admin/*`, `dashboard/src/pages/admin/index.astro`
- `dashboard/src/components/live-task/*`, `dashboard/src/pages/live-task.astro`

- [ ] **Step 1: Visual check only**

These are internal tools. On the dev server, open `/admin` and `/live-task`. If they inherit tokens they will already be light; only fix hardcoded dark hex that makes them unreadable (re-use the Step-1 grep from Task 17 scoped to these dirs).

- [ ] **Step 2: Build + commit if changed**

```bash
cd dashboard && npx astro build   # Expected: PASS
git add dashboard/src && git commit -m "fix(redesign): light-theme fixes for admin & live-task"
```

---

## Task 19: Accessibility & contrast audit

**Files:** any with contrast issues found

- [ ] **Step 1: Check contrast on key surfaces**

On the dev server, use the browser devtools accessibility/contrast checker on: body text (`#5C5A50` on `#FBFAF7`), muted text (`#8A867A` on `#FFFFFF`), primary buttons (`#FFFFFF` on `#0057FF`), and journey/grid cards. Target WCAG AA (4.5:1 for body text, 3:1 for large text/UI).

- [ ] **Step 2: Fix any failures**

If `--color-text-tertiary` (`#8A867A`) fails 4.5:1 where used for real content (not just decorative counts), darken it to `#736F63` in `global.css`. Re-build.

- [ ] **Step 3: Commit if changed**

```bash
git add dashboard/src/styles/global.css
git commit -m "fix(redesign): meet AA contrast on muted text"
```

---

## Task 20: Final regression check

**Files:** none (verification)

- [ ] **Step 1: Full production build**

Run: `cd dashboard && npx astro build`
Expected: PASS, no new errors vs. the Task 1 baseline.

- [ ] **Step 2: Functional smoke test on the dev server**

Confirm, with no console errors:
- Home: hero, journeys, rails, browse-by-type, grid all render light.
- ⌘K search opens and filters; selecting a result navigates.
- Add-to-stack works; npx command copies.
- A component detail page renders markdown + code readable.
- Trending, My Workspace (auth), a featured/journey page render light.
- Component **install command** on a detail page is unchanged (copy it and confirm it matches pre-redesign format — the data contract must be intact).

- [ ] **Step 3: Confirm no dark hex anywhere**

Run:
```bash
cd dashboard && grep -rnE "#040D20|#071535|#0D1F45|#162850|#0D1117|#111827|#1C2433|#2A3550" src/ --include=*.tsx --include=*.astro
```
Expected: no matches (any remaining must be intentional, e.g. the charcoal `#111111` emphasis or the logo SVG).

- [ ] **Step 4: Final commit / ready for review**

```bash
git add -A && git commit -m "chore(redesign): final regression pass" --allow-empty
```

The branch `redesign/dashboard-light-editorial` is now ready for a PR / deploy via the `deployer` agent.

---

## Notes for the implementer

- **Do not touch** `dashboard/src/pages/api/**`, the CLI, or `components.json`. The redesign is presentation-only.
- The `deployer` agent (`.claude/agents/deployer.md`) handles deployment — do not deploy manually.
- After the branch lands, regenerate nothing in `components.json` (data is unchanged).
- The visual companion mockups for reference live in `.superpowers/brainstorm/` (gitignored).
