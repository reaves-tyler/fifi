# fifi — FIRE & Coast FI Planning Dashboard

An interactive Nuxt 4 dashboard that simulates a household's full financial
life — accumulation, early-retirement bridge years, and drawdown through life
expectancy — and recalculates every chart, table, and KPI instantly as
assumptions change. Includes Roth conversion ladder modeling, Social Security,
withdrawal taxes, an earmarked college fund, seeded Monte Carlo risk analysis,
and server-saved shareable scenarios.

## Documentation

| Doc | What it covers |
|---|---|
| [docs/01-intent.md](docs/01-intent.md) | What this planner is for, design philosophy, non-goals |
| [docs/02-model.md](docs/02-model.md) | The buckets, phases, and every calculation (FIRE test, ladder, Monte Carlo) |
| [docs/03-assumptions.md](docs/03-assumptions.md) | Every simplification, which way it leans, and the fact-check log |
| [docs/04-reference.md](docs/04-reference.md) | Manual for every slider, toggle, and number in the UI |

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # engine test suite (vitest)
pnpm exec nuxt typecheck
pnpm build && node .output/server/index.mjs   # production
```

A `Baseline` scenario is seeded on first boot. Saved scenarios live in
`.data/scenarios/` — **gitignored, they contain personal financial data**.

## Offline / static build

```bash
pnpm generate                 # emits a fully static site to .output/public
pnpm serve:static             # preview it locally (any static file server works)
```

The static build needs no backend: the entire calculation engine runs in the
browser, and scenario persistence switches to the recipient's browser
localStorage (seeded with the Baseline on first open). To share offline, zip
`.output/public` and have the recipient serve it with any one-liner:

```bash
npx serve .          # or: python3 -m http.server 8080
```

Notes: it must be *served* (opening `index.html` via `file://` won't work —
asset paths are absolute), and scenarios stay in each viewer's own browser.

## Privacy model

The built-in defaults are **generic demo data**. Personal numbers live in an
exported scenario JSON (**Export/Import** buttons in the scenario bar) or in
the gitignored `.data/` directory — never in the code, so builds of this repo
are safe to publish. Keep exported JSONs somewhere private; anyone who has one
can Import it into any copy of the app.

## GitHub Pages

`.github/workflows/deploy-pages.yml` builds the static version (tests must
pass) and deploys it on every push to `main`. One-time setup: repo **Settings →
Pages → Source: GitHub Actions**. The site serves at
`https://<user>.github.io/fifi/` (the workflow sets `NUXT_APP_BASE_URL`
accordingly).

> ⚠️ There is no authentication. Anyone who can reach the server can read,
> edit, and delete scenarios. Run locally or behind a private network only.

## Stack

- **[Nuxt 4](https://nuxt.com)** — `app/` directory, SSR, auto-imports
- **[Nuxt UI v4](https://ui.nuxt.com)** (Tailwind CSS v4 under the hood)
- **Chart.js + vue-chartjs** for all visualizations
- **Nitro server routes** + filesystem storage for scenario persistence
- **TypeScript strict**, no external state library — shared reactive state via
  a `useState` composable
- **Vitest** over the pure calculation engine

## Architecture

```
shared/            Pure, framework-free core (runs in browser, server, and tests)
  types/index.ts       All domain types
  utils/defaults.ts    Default inputs + field-by-field normalization
  utils/projection.ts  The deterministic engine (single pure function)
  utils/montecarlo.ts  Seeded Monte Carlo over the engine
app/
  composables/useFireModel.ts   App-wide state + reactive projection
  components/                   ControlPanel, charts, tables, Risk & Compare panels
  pages/index.vue               Tabbed dashboard, SSR scenario bootstrap
server/
  api/scenarios/                CRUD (GET/POST/PUT/DELETE), inputs normalized server-side
  plugins/seed.ts               Seeds the Baseline scenario on first boot
tests/               Vitest suite pinning golden numbers and invariants
docs/                Human documentation (see table above)
```

The design rule that holds it together: **every number on screen derives from
`runProjection(inputs)`** — a pure function in `shared/`, reused identically by
the browser (reactive recalculation), the server (validation/seeding), the
Monte Carlo (1,000 calls per run), and the tests.

## Scenario API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/scenarios` | List scenario summaries |
| POST | `/api/scenarios` | Create (body: `{ name, inputs }`) |
| GET | `/api/scenarios/:id` | Fetch one |
| PUT | `/api/scenarios/:id` | Update name and/or inputs |
| DELETE | `/api/scenarios/:id` | Delete |

Malformed or partial `inputs` are normalized field-by-field against defaults,
so the engine never receives `NaN`.
