import type { MonteCarloResult, ScenarioInputs } from '../types'
import { runProjection } from './projection'

// Deterministic PRNG (mulberry32) — a fixed seed keeps SSR and client
// renders identical and makes results reproducible.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Standard normal via Box–Muller
function makeGaussian(rand: () => number) {
  return () => {
    const u = Math.max(rand(), 1e-12)
    const v = rand()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))))
  return sorted[idx]!
}

export interface MonteCarloOptions {
  trials?: number
  seed?: number
}

/**
 * Run the projection over many randomized return paths. Annual returns are
 * lognormal around the scenario's expected return with the scenario's
 * volatility, so the long-run arithmetic mean matches the deterministic
 * assumption. Planning decisions inside each trial (the FIRE test) still use
 * the expected return — you decide with expectations, you live with reality.
 */
export function runMonteCarlo(inputs: ScenarioInputs, options: MonteCarloOptions = {}): MonteCarloResult {
  const trials = Math.max(1, Math.min(options.trials ?? 500, 5000))
  const rand = mulberry32(options.seed ?? 42)
  const gaussian = makeGaussian(rand)

  const startAge = Math.round(inputs.user.current_age)
  const lifeEnd = Math.max(
    Math.round(inputs.simulation.traditional_retire_age),
    Math.round(inputs.simulation.life_expectancy),
  )
  const years = lifeEnd - startAge + 1
  const vol = Math.min(Math.max(inputs.simulation.return_volatility, 0), 1)
  // Lognormal parameters so that E[1 + r_t] = 1 + expected return
  const mu = Math.log(1 + inputs.simulation.investment_return) - (vol * vol) / 2

  let successes = 0
  const fireAges: number[] = []
  let neverFire = 0
  const finals: number[] = []
  const totalsByYear: number[][] = Array.from({ length: years }, () => [])

  for (let t = 0; t < trials; t++) {
    const returns = Array.from({ length: years }, () =>
      Math.max(Math.exp(mu + vol * gaussian()) - 1, -0.9),
    )
    const result = runProjection(inputs, returns)
    if (result.depletion_age === null) successes++
    if (result.fire_age === null) neverFire++
    else fireAges.push(result.fire_age)
    finals.push(result.final_portfolio)
    for (let i = 0; i < result.records.length && i < years; i++) {
      const rec = result.records[i]!
      totalsByYear[i]!.push(rec.bridge_balance + rec.tax_adv_balance)
    }
  }

  fireAges.sort((a, b) => a - b)
  finals.sort((a, b) => a - b)

  const bands = totalsByYear.map((totals, i) => {
    totals.sort((a, b) => a - b)
    return {
      age: startAge + i,
      p10: percentile(totals, 10),
      p25: percentile(totals, 25),
      p50: percentile(totals, 50),
      p75: percentile(totals, 75),
      p90: percentile(totals, 90),
    }
  })

  return {
    trials,
    success_rate: successes / trials,
    never_fire_rate: neverFire / trials,
    fire_age: {
      p10: fireAges.length ? percentile(fireAges, 10) : null,
      p50: fireAges.length ? percentile(fireAges, 50) : null,
      p90: fireAges.length ? percentile(fireAges, 90) : null,
    },
    final_portfolio: {
      p10: percentile(finals, 10),
      p50: percentile(finals, 50),
      p90: percentile(finals, 90),
    },
    bands,
  }
}
