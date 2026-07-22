import { describe, expect, it } from 'vitest'
import { defaultScenarioInputs } from '../shared/utils/defaults'
import { deflateProjection, runProjection } from '../shared/utils/projection'

describe('baseline projection', () => {
  const result = runProjection(defaultScenarioInputs())

  it('reaches FIRE at 46 — from zero invested at 22', () => {
    expect(result.fire_age).toBe(46)
    expect(result.retirement_age).toBe(46)
  })

  it('projects the expected age-60 tax-advantaged balance', () => {
    expect(result.age_60_tax_adv).toBeGreaterThan(2_500_000)
    expect(result.age_60_tax_adv).toBeLessThan(2_650_000)
  })

  it('never depletes and runs through life expectancy', () => {
    expect(result.depletion_age).toBeNull()
    expect(result.records.at(-1)!.age).toBe(95)
  })

  it('keeps the bridge non-negative after the unlock age', () => {
    for (const rec of result.records.filter(r => r.age >= 60)) {
      expect(rec.bridge_balance).toBeGreaterThanOrEqual(0)
    }
  })

  it('stops wages and contributions once retired', () => {
    for (const rec of result.records.filter(r => r.is_retired)) {
      expect(rec.salary).toBe(0)
      expect(rec.k401_contrib).toBe(0)
      expect(rec.roth_contrib).toBe(0)
    }
  })

  it('splits the tax-advantaged bucket consistently', () => {
    for (const rec of result.records) {
      expect(rec.tax_adv_trad + rec.tax_adv_roth).toBeCloseTo(rec.tax_adv_balance, 6)
    }
  })
})

describe('scenario toggles', () => {
  it('spouse income never delays FIRE', () => {
    const inputs = defaultScenarioInputs()
    inputs.spouse.is_returning_to_work = true
    const result = runProjection(inputs)
    expect(result.fire_age!).toBeLessThanOrEqual(46)
    expect(result.records.some(r => r.spouse_income > 0)).toBe(true)
  })

  it('harsh taxes and spending push FIRE past the traditional age', () => {
    const inputs = defaultScenarioInputs()
    inputs.taxes.traditional_withdrawal_rate = 0.22
    inputs.taxes.bridge_withdrawal_rate = 0.15
    inputs.expenses.retirement_multiplier = 1.3
    const result = runProjection(inputs)
    expect(result.fire_age).toBeNull()
    expect(result.retirement_age).toBe(60)
  })

  it('grosses up retirement withdrawals by the tax rate', () => {
    const inputs = defaultScenarioInputs()
    inputs.taxes.bridge_withdrawal_rate = 0.15
    const result = runProjection(inputs)
    const rec = result.records.find(r => r.is_retired && r.age < 60)!
    expect(-rec.bridge_flow).toBeCloseTo(rec.expenses / 0.85, 0)
  })

  it('coast FI freezes salary and stops heavy saving', () => {
    const inputs = defaultScenarioInputs()
    inputs.simulation.coast_fi_toggled = true
    const result = runProjection(inputs)
    const rec = result.records.find(r => r.age === 42 && !r.is_retired)
    if (rec) {
      expect(rec.salary).toBe(45000)
      expect(rec.roth_contrib).toBe(0)
    }
    expect(result.fire_age).toBeNull()
  })

  it('depletes under stress and reports the age', () => {
    const inputs = defaultScenarioInputs()
    inputs.simulation.investment_return = 0.03
    inputs.expenses.monthly_baseline = 12000
    const result = runProjection(inputs)
    expect(result.fire_age).toBeNull()
    expect(result.retirement_age).toBe(60)
    expect(result.depletion_age).not.toBeNull()
  })
})

describe('social security', () => {
  it('offsets retirement spending from the start age', () => {
    const inputs = defaultScenarioInputs()
    inputs.social_security.enabled = true
    const result = runProjection(inputs)
    const before = result.records.find(r => r.age === 66)!
    const after = result.records.find(r => r.age === 67)!
    expect(before.ss_income).toBe(0)
    expect(after.ss_income).toBeGreaterThan(0)
    // benefit is inflation-indexed from today's dollars
    expect(after.ss_income).toBeCloseTo(1500 * 12 * Math.pow(1.025, 67 - 22), 0)
  })

  it('improves the final portfolio', () => {
    const off = runProjection(defaultScenarioInputs())
    const inputs = defaultScenarioInputs()
    inputs.social_security.enabled = true
    const on = runProjection(inputs)
    expect(on.final_portfolio).toBeGreaterThan(off.final_portfolio)
  })
})

describe('roth conversion ladder', () => {
  const inputs = defaultScenarioInputs()
  inputs.roth_ladder.enabled = true
  const result = runProjection(inputs)
  const base = runProjection(defaultScenarioInputs())

  it('never delays FIRE relative to no ladder', () => {
    expect(result.fire_age).toBeLessThanOrEqual(base.fire_age!)
  })

  it('converts during bridge years and pays tax from the bridge', () => {
    const bridgeYears = result.records.filter(r => r.is_retired && r.age < 60)
    expect(bridgeYears.some(r => r.roth_conversion > 0)).toBe(true)
    // traditional sleeve shrinks vs baseline at age 59
    const trad59 = result.records.find(r => r.age === 59)!.tax_adv_trad
    const baseTrad59 = base.records.find(r => r.age === 59)!.tax_adv_trad
    expect(trad59).toBeLessThan(baseTrad59)
  })

  it('withdraws matured rungs tax-free after 5 years', () => {
    const fire = result.fire_age!
    const early = result.records.find(r => r.age === fire + 2)!
    const late = result.records.find(r => r.age === fire + 6)!
    expect(early.ladder_withdrawal).toBe(0)
    expect(late.ladder_withdrawal).toBeGreaterThan(0)
    // the bridge drains slower once rungs mature
    expect(-late.bridge_flow).toBeLessThan(late.expenses / (1 - 0))
  })
})

describe('college fund', () => {
  it('has no college activity by default (zero draw years)', () => {
    const result = runProjection(defaultScenarioInputs())
    const shortfall = result.records.reduce((s, r) => s + r.college_shortfall, 0)
    expect(shortfall).toBe(0)
    expect(result.records.every(r => r.college_balance === 0)).toBe(true)
  })

  it('floors at zero and reports shortfall when tuition is too big', () => {
    const inputs = defaultScenarioInputs()
    inputs.college.draw_years = 4
    inputs.college.annual_draw = 80000
    const result = runProjection(inputs)
    const shortfall = result.records.reduce((s, r) => s + r.college_shortfall, 0)
    expect(shortfall).toBeGreaterThan(0)
    for (const rec of result.records) {
      expect(rec.college_balance).toBeGreaterThanOrEqual(0)
    }
  })

  it('never affects the FIRE age', () => {
    const inputs = defaultScenarioInputs()
    inputs.college.draw_years = 4
    inputs.college.annual_draw = 100000
    expect(runProjection(inputs).fire_age).toBe(runProjection(defaultScenarioInputs()).fire_age)
  })
})

describe('deflation to today\'s dollars', () => {
  it('returns retirement spending to the baseline lifestyle', () => {
    const inputs = defaultScenarioInputs()
    const real = deflateProjection(runProjection(inputs), inputs)
    const rec = real.records.find(r => r.age === 90)!
    expect(rec.expenses).toBeCloseTo(33600, 0)
  })

  it('leaves year-one figures untouched', () => {
    const inputs = defaultScenarioInputs()
    const nominal = runProjection(inputs)
    const real = deflateProjection(nominal, inputs)
    expect(real.records[0]!.bridge_balance).toBeCloseTo(nominal.records[0]!.bridge_balance, 6)
  })
})
