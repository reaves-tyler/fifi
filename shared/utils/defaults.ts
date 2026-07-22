import type { ScenarioInputs } from '../types'

/**
 * Default model inputs — generic demo data. These seed the "Baseline"
 * scenario on first run and act as the fallback shape when normalizing
 * user-submitted inputs. Real household data should live in an exported
 * scenario JSON (Import/Export in the scenario bar), never in this file.
 */
// The demo story: a fresh college grad, age 22, $65k starting salary with
// regular 3% raises and NOTHING invested yet — proving that ordinary income
// plus consistent saving still retires well before the traditional age.
export function defaultScenarioInputs(): ScenarioInputs {
  return {
    assets: {
      cash: 2000,
      target_safety_net: 10000,
      tax_advantaged: {
        rollover_ira: 0,
        roth_ira_primary: 0,
        roth_ira_spouse: 0,
        hsa: 0,
        company_401k: 0,
      },
      taxable_bridge: 0,
      college_funds: 0,
    },
    user: {
      current_age: 22,
      gross_salary: 65000,
      annual_salary_growth: 0.03,
      employer_match_rate: 0.04,
      employee_401k_rate: 0.06,
      take_home_rate: 0.75,
      fixed_deductions: 0,
      first_year_net_override: null,
    },
    spouse: {
      is_returning_to_work: false,
      re_entry_age: 30,
      gross_salary: 40000,
      take_home_rate: 0.75,
    },
    expenses: {
      monthly_baseline: 2800,
      retirement_multiplier: 1.0,
    },
    taxes: {
      traditional_withdrawal_rate: 0.1,
      bridge_withdrawal_rate: 0,
    },
    college: {
      draw_start_age: 50,
      draw_years: 0,
      annual_draw: 10000,
    },
    social_security: {
      enabled: false,
      start_age: 67,
      monthly_benefit: 1500,
    },
    roth_ladder: {
      enabled: false,
      annual_conversion: 20000,
    },
    simulation: {
      investment_return: 0.07,
      inflation_rate: 0.025,
      traditional_retire_age: 60,
      coast_fi_toggled: false,
      coast_salary: 45000,
      coast_start_age: 30,
      joint_roth_ira_annual: 7500,
      life_expectancy: 95,
      // S&P 500 annual return stdev measured 16% over 1975–2024
      return_volatility: 0.16,
    },
  }
}

function num(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/**
 * Coerce arbitrary JSON into a well-formed ScenarioInputs, field by field.
 * Unknown or invalid fields fall back to defaults so the engine never
 * receives NaN/undefined.
 */
export function normalizeScenarioInputs(raw: unknown): ScenarioInputs {
  const d = defaultScenarioInputs()
  const r = (raw ?? {}) as Record<string, any>
  const assets = r.assets ?? {}
  const ta = assets.tax_advantaged ?? {}
  const user = r.user ?? {}
  const spouse = r.spouse ?? {}
  const expenses = r.expenses ?? {}
  const taxes = r.taxes ?? {}
  const college = r.college ?? {}
  const ss = r.social_security ?? {}
  const ladder = r.roth_ladder ?? {}
  const sim = r.simulation ?? {}

  const firstYearNet = user.first_year_net_override
  return {
    assets: {
      cash: num(assets.cash, d.assets.cash),
      target_safety_net: num(assets.target_safety_net, d.assets.target_safety_net),
      tax_advantaged: {
        rollover_ira: num(ta.rollover_ira, d.assets.tax_advantaged.rollover_ira),
        roth_ira_primary: num(ta.roth_ira_primary, d.assets.tax_advantaged.roth_ira_primary),
        roth_ira_spouse: num(ta.roth_ira_spouse, d.assets.tax_advantaged.roth_ira_spouse),
        hsa: num(ta.hsa, d.assets.tax_advantaged.hsa),
        company_401k: num(ta.company_401k, d.assets.tax_advantaged.company_401k),
      },
      taxable_bridge: num(assets.taxable_bridge, d.assets.taxable_bridge),
      college_funds: num(assets.college_funds, d.assets.college_funds),
    },
    user: {
      current_age: num(user.current_age, d.user.current_age),
      gross_salary: num(user.gross_salary, d.user.gross_salary),
      annual_salary_growth: num(user.annual_salary_growth, d.user.annual_salary_growth),
      employer_match_rate: num(user.employer_match_rate, d.user.employer_match_rate),
      employee_401k_rate: num(user.employee_401k_rate, d.user.employee_401k_rate),
      take_home_rate: num(user.take_home_rate, d.user.take_home_rate),
      fixed_deductions: num(user.fixed_deductions, d.user.fixed_deductions),
      first_year_net_override:
        firstYearNet === null ? null : num(firstYearNet, d.user.first_year_net_override ?? 0),
    },
    spouse: {
      is_returning_to_work: bool(spouse.is_returning_to_work, d.spouse.is_returning_to_work),
      re_entry_age: num(spouse.re_entry_age, d.spouse.re_entry_age),
      gross_salary: num(spouse.gross_salary, d.spouse.gross_salary),
      take_home_rate: num(spouse.take_home_rate, d.spouse.take_home_rate),
    },
    expenses: {
      monthly_baseline: num(expenses.monthly_baseline, d.expenses.monthly_baseline),
      retirement_multiplier: num(expenses.retirement_multiplier, d.expenses.retirement_multiplier),
    },
    taxes: {
      traditional_withdrawal_rate: num(taxes.traditional_withdrawal_rate, d.taxes.traditional_withdrawal_rate),
      bridge_withdrawal_rate: num(taxes.bridge_withdrawal_rate, d.taxes.bridge_withdrawal_rate),
    },
    college: {
      draw_start_age: num(college.draw_start_age, d.college.draw_start_age),
      draw_years: num(college.draw_years, d.college.draw_years),
      annual_draw: num(college.annual_draw, d.college.annual_draw),
    },
    social_security: {
      enabled: bool(ss.enabled, d.social_security.enabled),
      start_age: num(ss.start_age, d.social_security.start_age),
      monthly_benefit: num(ss.monthly_benefit, d.social_security.monthly_benefit),
    },
    roth_ladder: {
      enabled: bool(ladder.enabled, d.roth_ladder.enabled),
      annual_conversion: num(ladder.annual_conversion, d.roth_ladder.annual_conversion),
    },
    simulation: {
      investment_return: num(sim.investment_return, d.simulation.investment_return),
      inflation_rate: num(sim.inflation_rate, d.simulation.inflation_rate),
      traditional_retire_age: num(sim.traditional_retire_age, d.simulation.traditional_retire_age),
      coast_fi_toggled: bool(sim.coast_fi_toggled, d.simulation.coast_fi_toggled),
      coast_salary: num(sim.coast_salary, d.simulation.coast_salary),
      coast_start_age: num(sim.coast_start_age, d.simulation.coast_start_age),
      joint_roth_ira_annual: num(sim.joint_roth_ira_annual, d.simulation.joint_roth_ira_annual),
      life_expectancy: num(sim.life_expectancy, d.simulation.life_expectancy),
      return_volatility: num(sim.return_volatility, d.simulation.return_volatility),
    },
  }
}
