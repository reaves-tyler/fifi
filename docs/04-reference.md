# Reference Manual: Every Control, Explained

The sidebar drives everything: change any input and the entire projection —
KPIs, charts, tables, Monte Carlo — recalculates instantly. This file documents
each control, its default, and exactly what it does in the engine.

> The built-in defaults are **fictional demo data**: a 22-year-old grad starting
> a $65k job with nothing invested — demonstrating that steady saving from an
> ordinary salary still reaches FIRE in the mid-40s. Use **Import** to load your
> own exported scenario JSON — personal numbers never need to live in the code.

## Scenario bar (header)

| Control | What it does |
|---|---|
| **Scenario picker** | Loads a saved scenario from the server, replacing all current inputs. |
| **Name field** | The name used by Save / Save as new. |
| **Save** | Updates the current scenario in place (creates one if none is loaded). |
| **Save as new** | Creates a new scenario from the current inputs — use before experimenting. |
| **New** | Resets all inputs to the built-in defaults (nothing is saved until you Save). |
| **Trash** | Deletes the loaded scenario (server-side, permanent). |
| **Export (↓)** | Downloads the current working scenario as a JSON file — the way to keep personal numbers out of the app entirely. |
| **Import (↑)** | Loads a scenario JSON as unsaved working state; hit Save to persist it. |

## KPI cards (top row)

| Card | Meaning |
|---|---|
| **Total Invested Assets** | Today's tax-advantaged + taxable bridge + college fund. Cash is excluded (it's a safety net, not an investment). |
| **Projected Full FIRE Age** | First age passing the NPV bridge test *and* the 4%-rule check ("Not by 60" if never). |
| **Age-60 Tax-Advantaged Balance** | Traditional + Roth/HSA at the traditional retirement age. Dominated by compounding of today's principal — see [the model doc](./02-model.md). |
| **Bridge Coverage Today** | Taxable bridge ÷ the bridge required to retire *right now*. 100% means FIRE today. |

## Sidebar — Simulation

| Control | Default | Effect |
|---|---|---|
| **Show in Today's Dollars** | off | Display-only: deflates every dollar by inflation so all years read in current purchasing power. Doesn't change any calculation. |
| **Market Return** | 7.0% | Nominal annual growth applied to every bucket, the NPV discount rate, and the Monte Carlo mean. The single most sensitive input in the model. |
| **Inflation Rate** | 2.5% | Inflates spending, tuition, Social Security, ladder conversions; deflates the today's-dollars view. |
| **Spouse Returns to Work** | off | Adds spouse net income from the re-entry age until FIRE. |
| **Coast FI Pivot** | off | At the coast age: salary drops to the coast salary and freezes; Roth/brokerage saving stops (401(k) continues); deficits drain the bridge. |
| **Coast Salary / Coast Start Age** | $45,000 / 30 | The pivot parameters (visible when Coast FI is on). |
| **Life Expectancy** | 95 | Horizon for the drawdown phase, the Monte Carlo success test, and the final-portfolio figure. |

## Sidebar — Retirement Realism

| Control | Default | Effect |
|---|---|---|
| **Traditional Withdrawal Tax** | 10% | Effective rate on traditional-sleeve withdrawals and Roth-ladder conversions. Netting $X withdraws $X ÷ (1 − rate). A blend: traditional money is [ordinary income](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-exceptions-to-tax-on-early-distributions), Roth/HSA is free. |
| **Bridge Withdrawal Tax** | 0% | Effective rate on brokerage sales. 0% is realistic while taxable income stays inside the [0% long-term capital-gains bracket ($98,900 MFJ, 2026)](https://www.kiplinger.com/taxes/irs-updates-capital-gains-tax-thresholds) — only gains are income. |
| **Retirement Spending** | 100% | Multiplies baseline expenses in retired years (pre-Medicare health insurance, travel). Feeds the FIRE test too. |
| **Social Security** (+ start age, monthly) | off / 67 / $1,500 | Inflation-indexed benefit offsets retirement spending from the start age. Enter a net-of-tax figure; estimate at [ssa.gov](https://www.ssa.gov/OACT/quickcalc/). The 4%-rule check deliberately ignores it (conservative). |
| **Roth Conversion Ladder** (+ annual conversion) | off / $20,000 | Converts traditional→Roth each bridge year (tax paid from the bridge); each rung withdraws tax-free 5 years later. Reduces the required bridge — typically pulls FIRE earlier. See [Mad Fientist](https://www.madfientist.com/how-to-access-retirement-funds-early/). |

## Sidebar — Income

| Control | Default | Effect |
|---|---|---|
| **Current Age** | 22 | Simulation start; everything indexes off this. |
| **Gross Salary** | $65,000 | Primary earner's salary, grows annually until FIRE (or Coast). |
| **Salary Growth** | 3.0% | Annual raises. |
| **Take-Home Rate** | 75% | Fraction of gross surviving taxes and payroll deductions. |
| **Fixed Annual Deductions** | $0 | Off-the-top annual costs (medical premiums etc.) subtracted from net. |
| **First-Year Net Override** | 0 (disabled) | Known year-one net income from an actual paystub; overrides the formula for year one only. |
| **Spouse Re-Entry Age** | 30 | Your age when spouse income starts. |
| **Spouse Gross Salary** | $40,000 | Spouse salary; flat (no growth) — a conservative simplification. |
| **Spouse Take-Home Rate** | 75% | Spouse's net fraction; derived net shows below the salary field. |

## Sidebar — Savings

| Control | Default | Effect |
|---|---|---|
| **Joint Roth IRA / yr** | $7,500 | First stop in the savings waterfall; matches [the $7,500 2026 IRS limit](https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500) for a single filer — double it for a couple. |
| **401(k) Employee % / Employer Match %** | 6% / 4% | Combined percentage of salary flowing into the traditional sleeve every working year, on top of the waterfall. |
| **Monthly Baseline Expenses** | $2,800 | The household's spending, inflated annually forever; the foundation of every test in the model. |

## Sidebar — Starting Balances

Rollover IRA, Roth IRA ×2, HSA, Company 401(k) (the tax-advantaged sleeves);
Taxable Bridge (brokerage); College Funds (529). These are today's balances —
the initial conditions for everything.

## Sidebar — College Draws

| Control | Default | Effect |
|---|---|---|
| **Draws Start (your age)** | 50 | Your age at the child's freshman year. |
| **Draw Years** | 0 (disabled) | Consecutive tuition years. |
| **Annual Tuition (today's $)** | $10,000 | Inflated each year at the inflation rate. Consider padding it — college costs historically outrun CPI. |

## Tabs

| Tab | Contents |
|---|---|
| **Wealth Trajectory** | Stacked accumulation chart (green = tax-advantaged, blue = bridge, red dash = required bridge) + working-years table. FIRE happens where blue crosses red. |
| **Retirement Drawdown** | From the FIRE age through life expectancy: bridge depletion, the age-60 unlock, tax-advantaged drawdown. Badges show final portfolio and depletion. Columns for Social Security and ladder activity appear when those features are on. |
| **College** | Fund trajectory chart (violet) with the tuition window, plus the year-by-year table with shortfall flags. |
| **Risk** | Monte Carlo. **Volatility** (default 16% — the S&P 500's [1975–2024 annual stdev](https://tradethatswing.com/average-historical-stock-market-returns-for-sp-500-5-year-up-to-150-year-averages/)) and **Trials** (default 500) controls; success rate, FIRE-age percentiles, and the portfolio fan chart (10–90% and 25–75% bands around the median). |
| **Compare** | Diffs the current working inputs (blue) against any saved scenario (orange dash): KPI table with deltas + total-portfolio overlay. |

## Reading the results honestly

- The **deterministic** FIRE age answers "when, if markets average out."
  The **Risk tab** answers "how often does that actually work." Both matter.
- Toggle **Today's Dollars** before reacting to any large future number —
  nominal figures at 2070 horizons are roughly 3–4× today's purchasing power.
- If a change doesn't move a KPI you expected it to move, check the
  [model doc](./02-model.md) — several inputs deliberately affect only one
  phase or bucket.
