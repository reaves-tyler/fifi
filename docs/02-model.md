# The Model: Phases, Buckets, and Calculations

Everything below is implemented in [`shared/utils/projection.ts`](../shared/utils/projection.ts)
(deterministic engine) and [`shared/utils/montecarlo.ts`](../shared/utils/montecarlo.ts)
(risk analysis). The engine is a pure function: `runProjection(inputs)` →
year-by-year records plus summary results.

## The four buckets

| Bucket | Contents | Access | Withdrawal tax |
|---|---|---|---|
| **Traditional** | Rollover IRA + company 401(k) + future 401(k) contributions | After the traditional retirement age | Effective traditional rate (ordinary income) |
| **Roth/HSA** | Both Roth IRAs + HSA + future Roth contributions + matured ladder conversions | After the traditional retirement age (ladder rungs earlier) | Tax-free |
| **Taxable bridge** | Brokerage account | Anytime | Effective bridge rate (capital gains) |
| **College fund** | 529 assets | Anytime (education) | Ignored — earmarked money, walled off from retirement math |

All buckets compound at the same annual investment return. In the deterministic
projection that return is constant; in Monte Carlo each year gets a randomized
draw (see below).

## Phase 1 — Accumulation (now → FIRE)

For each working year:

```
salary(t)        = salary(t-1) × (1 + salary_growth)      — or the coast salary if Coast FI is active
base_net         = salary × take_home_rate − fixed_deductions
                   (year one may use a known paystub override instead)
spouse_net       = spouse_gross × spouse_take_home_rate   — from the re-entry age, if returning
expenses(t)      = monthly_baseline × 12 × (1 + inflation)^years_elapsed
surplus          = base_net + spouse_net − expenses(t)
```

The surplus follows a savings waterfall:

1. **Roth IRA** up to the annual cap (default $7,500 — the
   [2026 IRS limit per person](https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500); double it for a couple).
2. **Everything else to the taxable bridge.** A negative surplus drains the
   bridge.

Separately, the 401(k) receives `salary × (employee % + employer match %)`
regardless of the waterfall.

**Coast FI**, when toggled, pivots the salary to a fixed lower number at the
coast age, freezes it (no growth), and stops the Roth/brokerage savings —
only the 401(k) contribution continues. Deficits still drain the bridge.

## The FIRE test (NPV bridge test)

At the start of each year the engine asks: *could this household retire right
now?* Two conditions must both hold:

**1. The bridge covers the gap years.** The taxable bridge must equal or exceed
the present value of all spending from this age until the traditional
retirement age, discounted at the expected return:

```
required_bridge(a) = Σ (t = a … unlock_age−1)
    [ gross_spend(t) + conversion_tax(t) ] ÷ (1 + r)^(t−a)

where gross_spend(t) = max(0, retirement_expenses(t) − social_security(t) − matured_rung(t))
                       ÷ (1 − bridge_tax_rate)
```

**2. The retirement bucket sustains a 4%-rule retirement at the unlock age.**
The tax-advantaged total, compounding untouched, must reach at least
`25 × grossed-up spending` at the traditional retirement age. This is the
[4% rule](https://www.investopedia.com/terms/f/four-percent-rule.asp) from the
[Trinity study](https://en.wikipedia.org/wiki/Trinity_study) / Bengen's
original work, applied as a one-shot adequacy screen.

The first age passing both tests is the **FIRE age**. If no age up to the
traditional retirement age passes, the household works until that age.

## Phase 2 — Bridge years (FIRE → unlock age)

Wages and all contributions stop. Each year, spending (times the retirement
multiplier, minus any Social Security) is withdrawn from the bridge, grossed up
by the bridge tax rate.

**Roth conversion ladder** (optional): each bridge year converts a fixed
(inflation-indexed) amount from the traditional sleeve to the Roth sleeve,
paying `conversion × traditional_tax_rate` from the bridge. Five years later
that rung becomes withdrawable tax-free and reduces the bridge draw. This is
the standard early-access strategy — see
[Mad Fientist's comparison of early-access methods](https://www.madfientist.com/how-to-access-retirement-funds-early/)
and the [IRS 5-year rule context](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-exceptions-to-tax-on-early-distributions).
The FIRE test's required-bridge formula accounts for both the conversion taxes
and the matured rungs.

## Phase 3 — Traditional retirement (unlock age → life expectancy)

All buckets are accessible. Spending draws in tax-efficiency order:

1. **Bridge first** (cheapest to empty, avoids future capital-gains drag),
2. **Traditional next** (grossed up by the traditional withdrawal rate),
3. **Roth/HSA last** (tax-free; preserved longest).

If Social Security is enabled, the benefit (inflation-indexed from today's
dollars) offsets spending from its start age. If all buckets run dry the
portfolio goes negative and the **depletion age** is reported — the plan
failed.

## The college fund (parallel track)

The 529 grows at the market return. From the draw-start age, an
inflation-indexed tuition target is withdrawn for the configured number of
years. The fund floors at zero; any uncovered tuition is reported as a
**shortfall** but never touches the retirement buckets. Leftover money keeps
compounding — realistically destined for a
[529→Roth rollover for the beneficiary (lifetime cap $35,000)](https://www.kitces.com/blog/529-to-roth-ira-rollover-retirement-saving-education-planning-secure-2-0-backdoor-roth/)
and continued education.

## Monte Carlo (the Risk tab)

The deterministic projection assumes the same return every year, which hides
[sequence-of-returns risk](https://earlyretirementnow.com/safe-withdrawal-rate-series/).
The Monte Carlo runs the full engine over N randomized histories:

- Annual returns are **lognormal**: `r_t = exp(μ + σ·z) − 1` with
  `μ = ln(1 + r) − σ²/2`, so the expected arithmetic return matches the
  deterministic assumption.
- σ is the volatility input (default 16%, the S&P 500's measured annual
  standard deviation over [1975–2024](https://tradethatswing.com/average-historical-stock-market-returns-for-sp-500-5-year-up-to-150-year-averages/)).
- **Each trial re-decides its own FIRE age** — the FIRE test inside a trial
  still uses expected returns (you decide with expectations), but balances
  evolve with realized returns (you live with reality).
- The RNG is seeded, so results are reproducible.

Reported: **success rate** (fraction of histories that never deplete),
FIRE-age percentiles, never-FIRE rate, final-portfolio percentiles, and
per-age percentile bands for the fan chart.

## Today's-dollars view

A display toggle divides every dollar figure for year *t* by
`(1 + inflation)^t`, converting nominal projections into constant purchasing
power. The engine always computes in nominal terms; deflation is presentation
only (`deflateProjection`).
