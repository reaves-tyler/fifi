import type { ProjectionResult, ScenarioInputs, YearRecord } from '../types'

/**
 * FIRE projection engine. Pure function of the inputs so it can run in the
 * browser (reactive recalculation), inside Nitro server routes, or thousands
 * of times per Monte Carlo run (pass `yearlyReturns` for a realized path;
 * planning decisions still use the expected return).
 *
 * Phases:
 * 1. Accumulation — wages, 401(k)/Roth contributions, surplus to the bridge.
 * 2. Bridge (FIRE age → traditional retirement age) — no wages; expenses draw
 *    down the taxable bridge while tax-advantaged accounts compound. With the
 *    Roth ladder enabled, traditional money converts to Roth each bridge year
 *    (tax paid from the bridge) and each rung becomes withdrawable tax-free
 *    five years later, reducing the bridge draw.
 * 3. Traditional retirement (60+) — everything accessible; spending draws the
 *    bridge first, then traditional (taxed), then Roth (tax-free), through the
 *    configured life expectancy. Social Security (if enabled) offsets spending
 *    from its start age.
 *
 * The tax-advantaged bucket is tracked as two sleeves: traditional (rollover
 * IRA + 401(k), taxed on withdrawal) and Roth/HSA (tax-free).
 *
 * FIRE age uses an NPV bridge test: retirement triggers at the first age
 * where the taxable bridge covers the present value (discounted at the
 * expected return) of the grossed-up, inflation-adjusted spending — net of
 * ladder rungs and Social Security — from that age until penalty-free
 * access, AND the tax-advantaged bucket is projected to satisfy the 4% rule
 * at the traditional retirement age.
 */
export function runProjection(inputs: ScenarioInputs, yearlyReturns?: number[]): ProjectionResult {
  const { assets, user, spouse, expenses, taxes, college: collegeCfg, social_security: ss, roth_ladder: ladder, simulation } = inputs
  const r = simulation.investment_return
  const startAge = Math.round(user.current_age)
  const endAge = Math.round(simulation.traditional_retire_age)
  const lifeEnd = Math.max(endAge, Math.round(simulation.life_expectancy))
  const annualBaseline = expenses.monthly_baseline * 12

  // Realized return for a given year (Monte Carlo); planning math uses `r`.
  const returnAt = (age: number) => yearlyReturns?.[age - startAge] ?? r

  const bridgeTax = Math.min(Math.max(taxes.bridge_withdrawal_rate, 0), 0.9)
  const tradTax = Math.min(Math.max(taxes.traditional_withdrawal_rate, 0), 0.9)
  const grossFromBridge = (net: number) => net / (1 - bridgeTax)
  const grossFromTrad = (net: number) => net / (1 - tradTax)

  const inflator = (age: number) => Math.pow(1 + simulation.inflation_rate, age - startAge)
  const expensesAt = (age: number) => annualBaseline * inflator(age)
  const retirementExpensesAt = (age: number) => expensesAt(age) * expenses.retirement_multiplier

  const ssAt = (age: number) =>
    ss.enabled && age >= ss.start_age ? ss.monthly_benefit * 12 * inflator(age) : 0
  const conversionAt = (age: number) =>
    ladder.enabled ? ladder.annual_conversion * inflator(age) : 0

  // Tuition target for a given age, inflated from today's dollars. The
  // college fund is earmarked money: draws and shortfalls are tracked but
  // never touch the retirement buckets or the FIRE test.
  const collegeDrawAt = (age: number) =>
    age >= collegeCfg.draw_start_age && age < collegeCfg.draw_start_age + collegeCfg.draw_years
      ? collegeCfg.annual_draw * inflator(age)
      : 0

  // NPV of grossed-up bridge-phase spending from `age` (inclusive) until
  // `endAge` (exclusive) — net of matured ladder rungs and Social Security,
  // plus the annual conversion tax while the ladder runs.
  const requiredBridgeAt = (age: number) => {
    let npv = 0
    for (let t = age; t < endAge; t++) {
      let need = Math.max(0, retirementExpensesAt(t) - ssAt(t))
      if (ladder.enabled && t - age >= 5) {
        need = Math.max(0, need - conversionAt(t - 5))
      }
      let gross = grossFromBridge(need)
      if (ladder.enabled) gross += conversionAt(t) * tradTax
      npv += gross / Math.pow(1 + r, t - age)
    }
    return npv
  }

  // Would the tax-advantaged bucket, compounding with no further
  // contributions, satisfy a 4%-rule retirement at endAge? (Deliberately
  // conservative: ignores Social Security starting later.)
  const taxAdvSustains = (taxAdvNow: number, age: number) =>
    taxAdvNow * Math.pow(1 + r, endAge - age) >= 25 * grossFromTrad(retirementExpensesAt(endAge))

  // Tax-advantaged sleeves: traditional (taxed on withdrawal) vs Roth/HSA.
  let trad = assets.tax_advantaged.rollover_ira + assets.tax_advantaged.company_401k
  let roth =
    assets.tax_advantaged.roth_ira_primary +
    assets.tax_advantaged.roth_ira_spouse +
    assets.tax_advantaged.hsa
  let bridge = assets.taxable_bridge
  let college = assets.college_funds
  let salary = user.gross_salary

  const totalInvestedToday = trad + roth + bridge + college
  const records: YearRecord[] = []
  const rungs = new Map<number, number>() // conversion amount by year executed
  let fireAge: number | null = null
  let age60TaxAdv = trad + roth
  let depletionAge: number | null = null

  for (let age = startAge; age <= lifeEnd; age++) {
    const coasting = simulation.coast_fi_toggled && age >= simulation.coast_start_age
    const g = returnAt(age)

    // 1. Salary track (Coast FI pivots to a fixed lower salary)
    if (coasting) {
      salary = simulation.coast_salary
    } else if (age > startAge) {
      salary *= 1 + user.annual_salary_growth
    }

    // 2. FIRE test against balances carried in from the prior year
    if (fireAge === null && age <= endAge && bridge >= requiredBridgeAt(age) && taxAdvSustains(trad + roth, age)) {
      fireAge = age
    }
    // Without FIRE, work continues through the traditional retirement age
    const isRetired = fireAge !== null ? age >= fireAge : age > endAge

    const currentExpenses = isRetired ? retirementExpensesAt(age) : expensesAt(age)
    const ssIncome = isRetired ? ssAt(age) : 0
    let spouseNet = 0
    let baseNet = 0
    let rothContrib = 0
    let k401Contrib = 0
    let bridgeFlow = 0
    let taxAdvFlow = 0
    let conversion = 0
    let ladderWithdrawal = 0

    // Grow balances at the realized return, then apply the year's flows.
    const grownTrad = trad * (1 + g)
    const grownRoth = roth * (1 + g)
    const grownBridge = bridge * (1 + g)

    if (isRetired) {
      const need = Math.max(0, currentExpenses - ssIncome)
      if (age < endAge) {
        // Bridge years: penalty-free money only. Matured ladder rungs
        // (converted 5+ years ago) come out of Roth tax-free first.
        const rung = rungs.get(age - 5) ?? 0
        ladderWithdrawal = Math.min(rung, Math.max(grownRoth, 0), need)
        conversion = Math.min(conversionAt(age), Math.max(grownTrad, 0))
        const conversionTax = conversion * tradTax
        bridgeFlow = -(grossFromBridge(need - ladderWithdrawal) + conversionTax)
        trad = grownTrad - conversion
        roth = grownRoth + conversion - ladderWithdrawal
        bridge = grownBridge + bridgeFlow
        taxAdvFlow = -ladderWithdrawal
      } else {
        // Everything accessible: bridge first, then traditional (taxed),
        // then Roth (tax-free). Any uncovered remainder drives Roth
        // negative, which is the depletion signal.
        const bridgeGross = Math.min(Math.max(grownBridge, 0), grossFromBridge(need))
        const afterBridge = need - bridgeGross * (1 - bridgeTax)
        const tradGross = Math.min(Math.max(grownTrad, 0), grossFromTrad(afterBridge))
        const rothDraw = afterBridge - tradGross * (1 - tradTax)
        bridgeFlow = -bridgeGross
        taxAdvFlow = -(tradGross + rothDraw)
        trad = grownTrad - tradGross
        roth = grownRoth - rothDraw
        bridge = grownBridge + bridgeFlow
      }
    } else {
      spouseNet =
        spouse.is_returning_to_work && age >= spouse.re_entry_age
          ? spouse.gross_salary * spouse.take_home_rate
          : 0
      baseNet =
        age === startAge && user.first_year_net_override !== null
          ? user.first_year_net_override
          : salary * user.take_home_rate - user.fixed_deductions
      const surplus = baseNet + spouseNet - currentExpenses

      if (coasting) {
        // Coast FI: heavy savings stop; only a deficit touches the bridge.
        bridgeFlow = Math.min(0, surplus)
      } else {
        rothContrib = Math.max(0, Math.min(surplus, simulation.joint_roth_ira_annual))
        bridgeFlow = surplus - rothContrib
      }
      k401Contrib = salary * (user.employee_401k_rate + user.employer_match_rate)
      trad = grownTrad + k401Contrib
      roth = grownRoth + rothContrib
      bridge = grownBridge + bridgeFlow
    }

    if (conversion > 0) rungs.set(age, conversion)

    college = college * (1 + g)
    const tuitionTarget = collegeDrawAt(age)
    const collegeFlow = -Math.min(Math.max(college, 0), tuitionTarget)
    college += collegeFlow
    const collegeShortfall = tuitionTarget + collegeFlow

    if (age === endAge) age60TaxAdv = trad + roth
    if (depletionAge === null && bridge + trad + roth < 0) depletionAge = age

    const totalNet = isRetired ? 0 : baseNet + spouseNet
    records.push({
      age,
      salary: isRetired ? 0 : salary,
      spouse_income: spouseNet,
      total_net: totalNet,
      expenses: currentExpenses,
      surplus: totalNet - currentExpenses,
      roth_contrib: rothContrib,
      k401_contrib: k401Contrib,
      bridge_flow: bridgeFlow,
      tax_adv_flow: taxAdvFlow,
      bridge_balance: bridge,
      tax_adv_balance: trad + roth,
      tax_adv_trad: trad,
      tax_adv_roth: roth,
      ss_income: ssIncome,
      roth_conversion: conversion,
      ladder_withdrawal: ladderWithdrawal,
      college_balance: college,
      college_flow: collegeFlow,
      college_shortfall: collegeShortfall,
      required_bridge: requiredBridgeAt(age),
      is_retired: isRetired,
    })
  }

  return {
    records,
    fire_age: fireAge,
    retirement_age: fireAge ?? endAge,
    age_60_tax_adv: age60TaxAdv,
    total_invested_today: totalInvestedToday,
    final_portfolio: bridge + trad + roth,
    depletion_age: depletionAge,
  }
}

/**
 * Convert a nominal projection into today's purchasing power by dividing
 * every dollar figure by the inflation deflator for its year. FIRE age and
 * other non-dollar fields pass through unchanged.
 */
export function deflateProjection(result: ProjectionResult, inputs: ScenarioInputs): ProjectionResult {
  const startAge = Math.round(inputs.user.current_age)
  const endAge = Math.round(inputs.simulation.traditional_retire_age)
  const infl = inputs.simulation.inflation_rate
  const deflatorAt = (age: number) => Math.pow(1 + infl, age - startAge)

  const records: YearRecord[] = result.records.map((rec) => {
    const d = deflatorAt(rec.age)
    return {
      ...rec,
      salary: rec.salary / d,
      spouse_income: rec.spouse_income / d,
      total_net: rec.total_net / d,
      expenses: rec.expenses / d,
      surplus: rec.surplus / d,
      roth_contrib: rec.roth_contrib / d,
      k401_contrib: rec.k401_contrib / d,
      bridge_flow: rec.bridge_flow / d,
      tax_adv_flow: rec.tax_adv_flow / d,
      bridge_balance: rec.bridge_balance / d,
      tax_adv_balance: rec.tax_adv_balance / d,
      tax_adv_trad: rec.tax_adv_trad / d,
      tax_adv_roth: rec.tax_adv_roth / d,
      ss_income: rec.ss_income / d,
      roth_conversion: rec.roth_conversion / d,
      ladder_withdrawal: rec.ladder_withdrawal / d,
      college_balance: rec.college_balance / d,
      college_flow: rec.college_flow / d,
      college_shortfall: rec.college_shortfall / d,
      required_bridge: rec.required_bridge / d,
    }
  })

  const lastAge = result.records.length ? result.records[result.records.length - 1]!.age : startAge
  return {
    ...result,
    records,
    age_60_tax_adv: result.age_60_tax_adv / deflatorAt(endAge),
    final_portfolio: result.final_portfolio / deflatorAt(lastAge),
  }
}
