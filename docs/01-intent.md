# Intent: What This Planner Is For

## Purpose

This planner answers one household's central financial question:

> **At what age can we stop working, and how confident should we be in that answer?**

It simulates a household's full financial life year by year — working years, an
early-retirement "bridge" period, and traditional retirement through end of
life — and recalculates instantly as assumptions change. It is built around the
[FIRE (Financial Independence, Retire Early)](https://www.investopedia.com/terms/f/financial-independence-retire-early-fire.asp)
framework, with specific support for:

- **Full FIRE** — retiring completely once a taxable "bridge" account can carry
  spending until tax-advantaged accounts unlock.
- **[Coast FI](https://www.investopedia.com/coast-fire-definition-11726767)** —
  downshifting to a lower-paying job once existing savings will compound to a
  sufficient retirement on their own, without further heavy saving.
- **The bridge problem** — the defining constraint of early retirement: most
  wealth sits in retirement accounts that carry a
  [10% penalty before age 59½](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-exceptions-to-tax-on-early-distributions),
  so the years between FIRE and penalty-free access must be funded from taxable
  money (or clever strategies like the Roth conversion ladder).

## Design philosophy

1. **One pure calculation engine.** Every number on screen comes from a single
   deterministic function of the inputs (`shared/utils/projection.ts`). No
   hidden state, no side effects — the same inputs always produce the same
   plan, whether computed in the browser, on the server, or a thousand times
   inside a Monte Carlo run.

2. **Show uncertainty, don't hide it.** A single projected line at an average
   return is a story, not a plan. The Risk tab runs the same engine over
   randomized market histories to expose
   [sequence-of-returns risk](https://earlyretirementnow.com/safe-withdrawal-rate-series/) —
   the fact that *when* bad returns arrive matters as much as whether they do.

3. **Deliberate conservatism over false precision.** Where the model
   simplifies, it simplifies in the pessimistic direction (see
   [Assumptions](./03-assumptions.md)). Where precision would require
   simulating the full tax code, it uses effective rates the user controls
   instead.

4. **Earmarked money stays earmarked.** The college fund grows and depletes on
   its own track and never props up the retirement math. A plan that works only
   by spending the kid's tuition is not a plan.

## Non-goals

- **Not financial advice.** This is a modeling tool for exploring scenarios;
  the built-in defaults are generic demo data — import your own numbers
  (Export/Import in the scenario bar) to make it yours.
- **Not a tax calculator.** Taxes are effective rates, not bracket simulations.
- **Not a budgeting app.** Spending is one number (plus a retirement
  multiplier), not a category breakdown.
- **Not multi-user SaaS.** Scenarios are stored server-side with no
  authentication; deploy only somewhere private.

## Further reading

- [Investopedia — FIRE overview](https://www.investopedia.com/terms/f/financial-independence-retire-early-fire.asp)
- [Mad Fientist — How to access retirement funds early](https://www.madfientist.com/how-to-access-retirement-funds-early/) (the bridge problem and its solutions)
- [Early Retirement Now — Safe Withdrawal Rate series](https://earlyretirementnow.com/safe-withdrawal-rate-series/) (the deepest public treatment of withdrawal risk)
- [Bogleheads wiki — Safe withdrawal rates](https://www.bogleheads.org/wiki/Safe_withdrawal_rates)
