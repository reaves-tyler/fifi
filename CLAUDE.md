# CLAUDE.md — Development Guide

Personal FIRE-planning dashboard for one household. Read
[docs/02-model.md](docs/02-model.md) before touching the engine — the financial
logic has more invariants than the code volume suggests.

## Commands

```bash
pnpm dev                  # dev server
pnpm test                 # vitest — REQUIRED green before any commit
pnpm exec nuxt typecheck  # vue-tsc, strict
pnpm build                # production build
```

## Hard rules

- **The engine stays pure.** `shared/utils/projection.ts` is a deterministic
  function of its inputs: no Date.now, no randomness, no I/O, no Vue imports.
  Monte Carlo passes randomness *in* (a seeded returns array). This purity is
  what lets the browser, server, Monte Carlo, and tests share one
  implementation — don't break it.
- **No Pinia, no state libraries.** Shared state is `useState` inside
  `app/composables/useFireModel.ts` (owner's explicit choice). No
  `@nuxtjs/tailwindcss` either — Tailwind v4 comes through `@nuxt/ui`.
- **Personal data stays out of git — everywhere.** `shared/utils/defaults.ts`
  holds GENERIC demo data only. The owner's real numbers live exclusively in
  gitignored `.data/` (saved scenarios + `personal-scenario.json` export) and
  travel via the scenario bar's Import/Export. Never commit personal figures
  to defaults, tests, docs, or fixtures — the site deploys publicly.
- **Tests are golden-number pins, not decorations.** With the demo defaults:
  the fresh-grad baseline FIREs at 46; the harsh-tax case never FIREs. If your change moves these, that's either
  a bug or an intentional model change — update the pins only with a stated
  reason, and update [docs/03-assumptions.md](docs/03-assumptions.md)'s
  fact-check log if defaults changed.

## Adding a new model input (the full checklist)

Every input flows through six places — miss one and users get `$NaN` or stale
scenarios break:

1. `shared/types/index.ts` — add to `ScenarioInputs` (and `YearRecord` if the
   engine emits per-year values).
2. `shared/utils/defaults.ts` — add the default **and** the
   `normalizeScenarioInputs` coercion (this is what keeps old saved scenarios
   loading cleanly).
3. `shared/utils/projection.ts` — use it in the engine; if it produces dollar
   record fields, add them to `deflateProjection` too (today's-dollars view).
4. `app/components/ControlPanel.vue` — the UI control (percent fields use
   get/set computed wrappers, currency fields use `UInputNumber` with
   `format-options`).
5. `tests/` — pin the new behavior.
6. `docs/04-reference.md` (control entry) and `docs/02-model.md`/`03-assumptions.md`
   if the math or an assumption changed.

## Known trap: stale Vite cache on `shared/` changes

HMR does not reliably propagate edits to `shared/` modules (imported by both
client and server bundles). Symptoms: `$NaN` in tables, "does not provide an
export" console errors, or 500s referencing fields that clearly exist. **Fix:
kill the dev server, `rm -rf .nuxt node_modules/.cache`, restart, hard-refresh
the browser.** Do this *before* debugging the math — it has burned three
sessions already.

## Architecture notes

- SSR bootstrap: `app/pages/index.vue` loads the scenario list and the
  requested (`?s=<id>`) or most recent scenario inside `useAsyncData`, so pages
  arrive hydrated. `useState` carries it to the client.
- Server routes normalize all incoming `inputs` (`normalizeScenarioInputs`)
  before storage — never trust request bodies.
- Storage is Nitro `useStorage('scenarios')` → filesystem driver at
  `.data/scenarios` (configured in `nuxt.config.ts` under both `storage` and
  `devStorage`).
- Scenario persistence has **two backends** behind the same composable API:
  Nitro routes (default) and localStorage (`pnpm generate` sets
  `NUXT_PUBLIC_STATIC_BUILD=true`). Any new persistence feature must implement
  both branches in `useFireModel` — components must never call `/api/*`
  directly (use `fetchScenario`/the composable actions).
- Charts are Chart.js via vue-chartjs, `<ClientOnly>`-wrapped, with computed
  data/options keyed to the color mode. Chart colors come from a
  colorblind-validated palette (green/blue/red = tax-adv/bridge/required;
  violet = college; blue/orange = compare) — if you add series colors, validate
  them with the dataviz palette validator rather than eyeballing.
- Monte Carlo must stay deterministic (mulberry32, seed 42) — a nondeterministic
  run would cause SSR/client hydration mismatches and flaky tests.

## Domain vocabulary

- **Bridge** — taxable brokerage that funds spending between FIRE and the
  penalty-free unlock age (modeled as 60).
- **FIRE test** — bridge ≥ NPV of grossed-up bridge-years spending AND
  tax-advantaged projects to 25× spending at 60. First passing age = FIRE age.
- **Ladder rung** — one year's traditional→Roth conversion; withdrawable
  tax-free 5 years later.
- **Sleeves** — the tax-advantaged bucket splits into traditional (taxed
  withdrawals) and Roth/HSA (tax-free).
- **Earmarked** — the college fund; grows and depletes on its own track and
  must never affect the FIRE math.
