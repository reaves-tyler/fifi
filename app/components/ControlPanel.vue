<script setup lang="ts">
const { inputs, realDollars } = useFireModel()

const returnPct = computed({
  get: () => Math.round(inputs.value.simulation.investment_return * 1000) / 10,
  set: (v: number) => (inputs.value.simulation.investment_return = v / 100),
})
const inflationPct = computed({
  get: () => Math.round(inputs.value.simulation.inflation_rate * 1000) / 10,
  set: (v: number) => (inputs.value.simulation.inflation_rate = v / 100),
})
const salaryGrowthPct = computed({
  get: () => Math.round(inputs.value.user.annual_salary_growth * 1000) / 10,
  set: (v: number) => (inputs.value.user.annual_salary_growth = v / 100),
})
const takeHomePct = computed({
  get: () => Math.round(inputs.value.user.take_home_rate * 1000) / 10,
  set: (v: number) => (inputs.value.user.take_home_rate = v / 100),
})
const spouseTakeHomePct = computed({
  get: () => Math.round(inputs.value.spouse.take_home_rate * 1000) / 10,
  set: (v: number) => (inputs.value.spouse.take_home_rate = v / 100),
})
const spouseNet = computed(
  () => inputs.value.spouse.gross_salary * inputs.value.spouse.take_home_rate,
)
const tradTaxPct = computed({
  get: () => Math.round(inputs.value.taxes.traditional_withdrawal_rate * 1000) / 10,
  set: (v: number) => (inputs.value.taxes.traditional_withdrawal_rate = v / 100),
})
const bridgeTaxPct = computed({
  get: () => Math.round(inputs.value.taxes.bridge_withdrawal_rate * 1000) / 10,
  set: (v: number) => (inputs.value.taxes.bridge_withdrawal_rate = v / 100),
})
const retireSpendPct = computed({
  get: () => Math.round(inputs.value.expenses.retirement_multiplier * 100),
  set: (v: number) => (inputs.value.expenses.retirement_multiplier = v / 100),
})
</script>

<template>
  <div class="space-y-6">
    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">Simulation</h3>

      <UFormField label="Show in Today's Dollars" help="Deflate every chart and table by inflation">
        <USwitch v-model="realDollars" />
      </UFormField>

      <UFormField :label="`Market Return — ${returnPct.toFixed(1)}%`">
        <USlider v-model="returnPct" :min="0" :max="12" :step="0.1" />
      </UFormField>

      <UFormField :label="`Inflation Rate — ${inflationPct.toFixed(1)}%`">
        <USlider v-model="inflationPct" :min="0" :max="8" :step="0.1" />
      </UFormField>

      <UFormField label="Spouse Returns to Work">
        <USwitch v-model="inputs.spouse.is_returning_to_work" />
      </UFormField>

      <UFormField label="Coast FI Pivot" help="Drop to the coast salary and stop heavy saving">
        <USwitch v-model="inputs.simulation.coast_fi_toggled" />
      </UFormField>

      <UFormField label="Life Expectancy" help="Retirement drawdown is projected to this age">
        <UInputNumber
          v-model="inputs.simulation.life_expectancy"
          :min="inputs.simulation.traditional_retire_age"
          :max="110"
        />
      </UFormField>

      <div v-if="inputs.simulation.coast_fi_toggled" class="grid grid-cols-2 gap-3">
        <UFormField label="Coast Salary">
          <UInputNumber
            v-model="inputs.simulation.coast_salary"
            :step="1000"
            :min="0"
            :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
          />
        </UFormField>
        <UFormField label="Coast Start Age">
          <UInputNumber v-model="inputs.simulation.coast_start_age" :min="inputs.user.current_age" :max="60" />
        </UFormField>
      </div>
    </section>

    <USeparator />

    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">Retirement Realism</h3>

      <UFormField
        :label="`Traditional Withdrawal Tax — ${tradTaxPct.toFixed(1)}%`"
        help="Blended effective rate on tax-advantaged withdrawals (traditional is ordinary income; Roth/HSA are free)"
      >
        <USlider v-model="tradTaxPct" :min="0" :max="40" :step="0.5" />
      </UFormField>

      <UFormField
        :label="`Bridge Withdrawal Tax — ${bridgeTaxPct.toFixed(1)}%`"
        help="Effective rate on brokerage sales — often 0% if you stay inside the LTCG bracket"
      >
        <USlider v-model="bridgeTaxPct" :min="0" :max="30" :step="0.5" />
      </UFormField>

      <UFormField
        :label="`Retirement Spending — ${retireSpendPct}% of baseline`"
        help="Scale spending in retired years (healthcare before Medicare, travel, …)"
      >
        <USlider v-model="retireSpendPct" :min="60" :max="160" :step="5" />
      </UFormField>

      <UFormField label="Social Security" help="Offsets retirement spending from the start age">
        <USwitch v-model="inputs.social_security.enabled" />
      </UFormField>

      <div v-if="inputs.social_security.enabled" class="grid grid-cols-2 gap-3">
        <UFormField label="Start Age">
          <UInputNumber v-model="inputs.social_security.start_age" :min="62" :max="70" />
        </UFormField>
        <UFormField label="Monthly (today's $)">
          <UInputNumber
            v-model="inputs.social_security.monthly_benefit"
            :step="100"
            :min="0"
            :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
          />
        </UFormField>
      </div>

      <UFormField
        label="Roth Conversion Ladder"
        help="Convert traditional→Roth during bridge years; rungs withdraw tax-free after 5 years"
      >
        <USwitch v-model="inputs.roth_ladder.enabled" />
      </UFormField>

      <UFormField v-if="inputs.roth_ladder.enabled" label="Annual Conversion (today's $)">
        <UInputNumber
          v-model="inputs.roth_ladder.annual_conversion"
          :step="5000"
          :min="0"
          :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
        />
      </UFormField>
    </section>

    <USeparator />

    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">Income</h3>

      <UFormField label="Current Age">
        <UInputNumber v-model="inputs.user.current_age" :min="18" :max="59" />
      </UFormField>

      <UFormField label="Gross Salary">
        <UInputNumber
          v-model="inputs.user.gross_salary"
          :step="1000"
          :min="0"
          :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
        />
      </UFormField>

      <UFormField :label="`Salary Growth — ${salaryGrowthPct.toFixed(1)}%`">
        <USlider v-model="salaryGrowthPct" :min="0" :max="8" :step="0.1" />
      </UFormField>

      <UFormField :label="`Take-Home Rate — ${takeHomePct.toFixed(1)}%`" help="Share of gross that survives taxes">
        <USlider v-model="takeHomePct" :min="40" :max="100" :step="0.5" />
      </UFormField>

      <UFormField label="Fixed Annual Deductions" help="Medical premiums and other paycheck fixed costs">
        <UInputNumber
          v-model="inputs.user.fixed_deductions"
          :step="500"
          :min="0"
          :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
        />
      </UFormField>

      <UFormField label="First-Year Net Override" help="Known net income for year one (0 disables)">
        <UInputNumber
          :model-value="inputs.user.first_year_net_override ?? 0"
          :step="500"
          :min="0"
          :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
          @update:model-value="inputs.user.first_year_net_override = $event || null"
        />
      </UFormField>

      <template v-if="inputs.spouse.is_returning_to_work">
        <UFormField label="Spouse Re-Entry Age">
          <UInputNumber v-model="inputs.spouse.re_entry_age" :min="inputs.user.current_age" :max="60" />
        </UFormField>
        <UFormField label="Spouse Gross Salary" :help="`≈ ${formatCurrency(spouseNet)} net/yr`">
          <UInputNumber
            v-model="inputs.spouse.gross_salary"
            :step="1000"
            :min="0"
            :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
          />
        </UFormField>
        <UFormField :label="`Spouse Take-Home Rate — ${spouseTakeHomePct.toFixed(1)}%`">
          <USlider v-model="spouseTakeHomePct" :min="40" :max="100" :step="0.5" />
        </UFormField>
      </template>
    </section>

    <USeparator />

    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">Savings</h3>

      <UFormField label="Joint Roth IRA / yr">
        <UInputNumber
          v-model="inputs.simulation.joint_roth_ira_annual"
          :step="500"
          :min="0"
          :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
        />
      </UFormField>

      <div class="grid grid-cols-2 gap-3">
        <UFormField label="401(k) Employee %">
          <UInputNumber
            :model-value="Math.round(inputs.user.employee_401k_rate * 1000) / 10"
            :min="0"
            :max="50"
            :step="0.5"
            @update:model-value="inputs.user.employee_401k_rate = ($event ?? 0) / 100"
          />
        </UFormField>
        <UFormField label="Employer Match %">
          <UInputNumber
            :model-value="Math.round(inputs.user.employer_match_rate * 1000) / 10"
            :min="0"
            :max="25"
            :step="0.5"
            @update:model-value="inputs.user.employer_match_rate = ($event ?? 0) / 100"
          />
        </UFormField>
      </div>

      <UFormField label="Monthly Baseline Expenses">
        <UInputNumber
          v-model="inputs.expenses.monthly_baseline"
          :step="100"
          :min="0"
          :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
        />
      </UFormField>
    </section>

    <USeparator />

    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">Starting Balances</h3>

      <UFormField
        v-for="field in ([
          { label: 'Rollover IRA', key: 'rollover_ira' },
          { label: 'Roth IRA (primary)', key: 'roth_ira_primary' },
          { label: 'Roth IRA (spouse)', key: 'roth_ira_spouse' },
          { label: 'HSA', key: 'hsa' },
          { label: 'Company 401(k)', key: 'company_401k' },
        ] as const)"
        :key="field.key"
        :label="field.label"
      >
        <UInputNumber
          v-model="inputs.assets.tax_advantaged[field.key]"
          :step="1000"
          :min="0"
          :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
        />
      </UFormField>

      <UFormField label="Taxable Bridge (brokerage)">
        <UInputNumber
          v-model="inputs.assets.taxable_bridge"
          :step="1000"
          :min="0"
          :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
        />
      </UFormField>

      <UFormField label="College Funds">
        <UInputNumber
          v-model="inputs.assets.college_funds"
          :step="1000"
          :min="0"
          :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
        />
      </UFormField>
    </section>

    <USeparator />

    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">College Draws</h3>

      <div class="grid grid-cols-2 gap-3">
        <UFormField label="Draws Start (your age)">
          <UInputNumber v-model="inputs.college.draw_start_age" :min="inputs.user.current_age" :max="80" />
        </UFormField>
        <UFormField label="Draw Years">
          <UInputNumber v-model="inputs.college.draw_years" :min="0" :max="20" />
        </UFormField>
      </div>

      <UFormField label="Annual Tuition (today's $)" help="Inflated by the inflation rate each year">
        <UInputNumber
          v-model="inputs.college.annual_draw"
          :step="1000"
          :min="0"
          :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
        />
      </UFormField>
    </section>
  </div>
</template>
