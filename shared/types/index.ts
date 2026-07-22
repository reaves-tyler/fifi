export interface TaxAdvantagedAccounts {
  rollover_ira: number
  roth_ira_primary: number
  roth_ira_spouse: number
  hsa: number
  company_401k: number
}

export interface ScenarioInputs {
  assets: {
    cash: number
    target_safety_net: number
    tax_advantaged: TaxAdvantagedAccounts
    taxable_bridge: number
    college_funds: number
  }
  user: {
    current_age: number
    gross_salary: number
    annual_salary_growth: number
    employer_match_rate: number
    employee_401k_rate: number
    /** Fraction of gross salary that becomes take-home pay (e.g. 0.70) */
    take_home_rate: number
    /** Fixed annual deductions off net pay (medical premiums, etc.) */
    fixed_deductions: number
    /** Known first-year net income from paystubs; overrides the formula for year one */
    first_year_net_override: number | null
  }
  spouse: {
    is_returning_to_work: boolean
    re_entry_age: number
    gross_salary: number
    /** Fraction of spouse gross that becomes take-home pay (e.g. 0.68) */
    take_home_rate: number
  }
  expenses: {
    monthly_baseline: number
    /** Scales baseline expenses during retirement (healthcare, travel, …) */
    retirement_multiplier: number
  }
  taxes: {
    /** Effective tax rate on traditional/pre-tax retirement withdrawals */
    traditional_withdrawal_rate: number
    /** Effective tax rate on taxable-bridge withdrawals (LTCG on gains) */
    bridge_withdrawal_rate: number
  }
  college: {
    /** Your age when tuition draws begin */
    draw_start_age: number
    /** Number of consecutive draw years (e.g. 8 for two kids back-to-back) */
    draw_years: number
    /** Annual tuition draw in today's dollars (inflated by the inflation rate) */
    annual_draw: number
  }
  social_security: {
    enabled: boolean
    /** Age benefits begin (62–70) */
    start_age: number
    /** Expected monthly benefit in today's dollars, net of tax */
    monthly_benefit: number
  }
  roth_ladder: {
    enabled: boolean
    /** Annual traditional→Roth conversion during bridge years, today's dollars */
    annual_conversion: number
  }
  simulation: {
    investment_return: number
    inflation_rate: number
    traditional_retire_age: number
    coast_fi_toggled: boolean
    coast_salary: number
    coast_start_age: number
    joint_roth_ira_annual: number
    life_expectancy: number
    /** Annual return volatility (stdev) used by the Monte Carlo simulation */
    return_volatility: number
  }
}

export interface YearRecord {
  age: number
  salary: number
  spouse_income: number
  total_net: number
  expenses: number
  surplus: number
  roth_contrib: number
  k401_contrib: number
  /** Net flow into (positive) or out of (negative) the taxable bridge */
  bridge_flow: number
  /** Retirement withdrawals from the tax-advantaged bucket (negative) */
  tax_adv_flow: number
  bridge_balance: number
  tax_adv_balance: number
  /** Traditional (pre-tax) share of the tax-advantaged bucket */
  tax_adv_trad: number
  /** Roth/HSA (tax-free) share of the tax-advantaged bucket */
  tax_adv_roth: number
  /** Social Security received this year (net) */
  ss_income: number
  /** Traditional→Roth conversion executed this year */
  roth_conversion: number
  /** Matured ladder rung withdrawn tax-free this year */
  ladder_withdrawal: number
  college_balance: number
  /** Tuition paid from the college fund this year (negative) */
  college_flow: number
  /** Tuition the college fund could NOT cover this year */
  college_shortfall: number
  /** NPV of expenses from this age until penalty-free access */
  required_bridge: number
  is_retired: boolean
}

export interface ProjectionResult {
  records: YearRecord[]
  fire_age: number | null
  /** FIRE age if achieved, otherwise the traditional retirement age */
  retirement_age: number
  age_60_tax_adv: number
  total_invested_today: number
  /** Bridge + tax-advantaged at life expectancy */
  final_portfolio: number
  /** First age the portfolio goes negative, if it ever does */
  depletion_age: number | null
}

export interface MonteCarloResult {
  trials: number
  /** Fraction of trials whose portfolio never depletes */
  success_rate: number
  /** Fraction of trials that never reach FIRE before the traditional age */
  never_fire_rate: number
  fire_age: { p10: number | null, p50: number | null, p90: number | null }
  final_portfolio: { p10: number, p50: number, p90: number }
  /** Per-age percentile bands of total portfolio (bridge + tax-advantaged) */
  bands: Array<{ age: number, p10: number, p25: number, p50: number, p75: number, p90: number }>
}

export interface Scenario {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  inputs: ScenarioInputs
}

export interface ScenarioSummary {
  id: string
  name: string
  updatedAt: string
}
