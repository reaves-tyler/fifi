# Assumptions and Simplifications

Every model simplifies. This file lists what this one assumes, which direction
each simplification leans (conservative = understates your outcome), and the
facts the defaults were checked against.

## Market assumptions

| Assumption | Default | Reality check | Lean |
|---|---|---|---|
| Expected nominal return | 7%/yr | S&P 500 has returned [~10.3% nominal annualized since 1957](https://www.fidelity.com/learning-center/trading-investing/sp-500-average-return); 7% nominal ≈ a diversified or deliberately conservative equity assumption | Conservative |
| Return volatility (Monte Carlo) | 16% | S&P 500 annual stdev measured [16% over 1975–2024, ~18–20% over longer windows](https://tradethatswing.com/average-historical-stock-market-returns-for-sp-500-5-year-up-to-150-year-averages/) | Slightly optimistic for 100% equities; about right for a lightly diversified portfolio |
| Inflation | 2.5%/yr | Fed target is 2%; long-run US CPI average is ~3% | Middle of the road |
| Returns are i.i.d. lognormal | — | Real markets mean-revert somewhat and have fatter tails; i.i.d. is the standard first-order treatment | Slightly pessimistic on long horizons (no mean reversion), optimistic on crashes (thin tails) |
| Every account earns the identical return | — | Real allocations differ per account | Neutral simplification |

## Tax assumptions

| Assumption | Default | Reality check | Lean |
|---|---|---|---|
| Traditional withdrawals taxed at a flat effective rate | 10% | A married couple spending ~$150k with a standard deduction lands near a ~10–12% *effective* federal rate; the model does not simulate brackets | User-controlled |
| Bridge (brokerage) withdrawals taxed at a flat effective rate | 0% | The [2026 0% long-term capital-gains bracket covers taxable income up to $98,900 (MFJ)](https://www.kiplinger.com/taxes/irs-updates-capital-gains-tax-thresholds), and only the *gain* portion of a sale is income — at this household's spending level, 0% effective is realistic. Raise it if spending or gains grow | User-controlled |
| Roth/HSA withdrawals are tax-free | — | True for qualified Roth withdrawals; HSA is tax-free **only for qualified medical expenses** (after 65, non-medical withdrawals are taxed as income). Lumping HSA into the tax-free sleeve slightly flatters | Slightly optimistic (HSA is ~1% of assets) |
| Conversion tax = traditional effective rate | — | Conversions are ordinary income; during no-wage bridge years the effective rate on a modest conversion is genuinely low | Reasonable |
| No state income tax modeling | — | Fold state tax into the effective rates | User-controlled |
| Contribution limits are static | $7,500/yr Roth (single filer) | Matches [the 2026 IRS limit](https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500); real limits rise with inflation, so a static cap understates future tax-advantaged space | Conservative |

## Retirement-access assumptions

| Assumption | Default | Reality check | Lean |
|---|---|---|---|
| Tax-advantaged unlocks at the "traditional retirement age" | 60 | The actual penalty-free age is [59½](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-exceptions-to-tax-on-early-distributions); the model runs on whole years, so 60 is the honest rounding | Conservative by half a year |
| No Rule of 55, no 72(t)/SEPP | — | [Substantially Equal Periodic Payments](https://www.irs.gov/retirement-plans/retirement-plans-faqs-regarding-substantially-equal-periodic-payments) and the Rule of 55 are real alternatives to the bridge/ladder; not modeled | Conservative |
| Ladder rungs mature in exactly 5 years | — | Matches the Roth conversion 5-year rule (each conversion has its own clock) | Accurate |
| The 4%-rule check ignores Social Security | — | The adequacy screen at the unlock age doesn't credit benefits that start later | Conservative |
| No RMDs | — | Required minimum distributions (age 73/75) force taxable withdrawals but don't destroy wealth — the money just moves to taxable | Mildly optimistic on late-life taxes |

## Income and spending assumptions

| Assumption | Default | Reality check | Lean |
|---|---|---|---|
| Take-home = gross × rate − fixed deductions | 75%, −$0 | A ballpark; year one can use an exact paystub override | User-controlled |
| Spouse income is flat (no raises) and has no 401(k) | — | Understates a real career's trajectory and benefits | Conservative |
| Spending = one inflating baseline × retirement multiplier | $2,800/mo | No lumpy events (roof, car, wedding), no late-life long-term-care spike | Optimistic on smoothness |
| Social Security benefit is user-entered, inflation-indexed | off; $1,500/mo at 67 | Estimate yours at [ssa.gov's calculator](https://www.ssa.gov/OACT/quickcalc/); entering a haircut (e.g. 75% of the statement value) hedges program risk | User-controlled |
| Wages and spouse income stop entirely at FIRE | — | Many early retirees earn *something*; any side income would improve every number | Conservative |

## College-fund assumptions

| Assumption | Default | Reality check | Lean |
|---|---|---|---|
| Tuition inflates at general CPI | — | College inflation has historically run 1–2 points above CPI | Optimistic — consider setting a higher tuition figure to compensate |
| Shortfalls never touch retirement money | — | In reality parents would probably cover a gap; keeping the walls up makes the FIRE age honest | Conservative for retirement, honest for planning |
| Leftover stays in the 529 | — | Realistically becomes a [529→Roth rollover (lifetime $35k, 15-year account age, annual Roth-limit throttle, beneficiary needs earned income)](https://www.kitces.com/blog/529-to-roth-ira-rollover-retirement-saving-education-planning-secure-2-0-backdoor-roth/) plus continued-education money | Neutral |

## Known blind spots (not modeled at all)

- Healthcare insurance pricing (ACA subsidies, Medicare premiums/IRMAA) beyond
  the blunt retirement-spending multiplier.
- Home equity, mortgages, and housing transitions.
- Divorce, disability, death — insurance questions, not investment questions.
- Behavioral risk (panic selling in a crash) — the Monte Carlo assumes you
  stay invested through every history it generates.

## Fact-check log

Defaults were last verified against primary sources in **July 2026**:
- Roth IRA limit $7,500/person (2026) — [IRS](https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500) ✓ (model default $15,000 joint)
- 0% LTCG bracket $98,900 taxable MFJ (2026) — [Kiplinger](https://www.kiplinger.com/taxes/irs-updates-capital-gains-tax-thresholds) ✓ (supports 0% bridge-tax default)
- S&P 500 stdev 16% (1975–2024) — [TradeThatSwing](https://tradethatswing.com/average-historical-stock-market-returns-for-sp-500-5-year-up-to-150-year-averages/) ✓ (volatility default revised 15% → 16%)
- 529→Roth: $35k lifetime, 15-year account, annual Roth-limit throttle, earned-income requirement — [Kitces](https://www.kitces.com/blog/529-to-roth-ira-rollover-retirement-saving-education-planning-secure-2-0-backdoor-roth/) ✓ (documented; not modeled)
