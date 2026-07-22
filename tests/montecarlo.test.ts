import { describe, expect, it } from 'vitest'
import { defaultScenarioInputs } from '../shared/utils/defaults'
import { runMonteCarlo } from '../shared/utils/montecarlo'

describe('monte carlo', () => {
  it('is deterministic for a fixed seed', () => {
    const a = runMonteCarlo(defaultScenarioInputs(), { trials: 200, seed: 42 })
    const b = runMonteCarlo(defaultScenarioInputs(), { trials: 200, seed: 42 })
    expect(a.success_rate).toBe(b.success_rate)
    expect(a.final_portfolio.p50).toBe(b.final_portfolio.p50)
    expect(a.bands[10]).toEqual(b.bands[10])
  })

  it('collapses to the deterministic path at zero volatility', () => {
    const inputs = defaultScenarioInputs()
    inputs.simulation.return_volatility = 0
    const mc = runMonteCarlo(inputs, { trials: 10 })
    expect(mc.fire_age.p50).toBe(46)
    expect(mc.success_rate).toBe(1)
    expect(mc.final_portfolio.p10).toBeCloseTo(mc.final_portfolio.p90, 6)
  })

  it('produces ordered percentile bands', () => {
    const mc = runMonteCarlo(defaultScenarioInputs(), { trials: 200, seed: 7 })
    for (const band of mc.bands) {
      expect(band.p10).toBeLessThanOrEqual(band.p25)
      expect(band.p25).toBeLessThanOrEqual(band.p50)
      expect(band.p50).toBeLessThanOrEqual(band.p75)
      expect(band.p75).toBeLessThanOrEqual(band.p90)
    }
  })

  it('reports plausible baseline risk numbers', () => {
    const mc = runMonteCarlo(defaultScenarioInputs(), { trials: 500, seed: 42 })
    expect(mc.success_rate).toBeGreaterThan(0.6)
    expect(mc.fire_age.p50).toBeGreaterThanOrEqual(42)
    expect(mc.fire_age.p50).toBeLessThanOrEqual(50)
    expect(mc.never_fire_rate).toBeLessThan(0.4)
  })
})
