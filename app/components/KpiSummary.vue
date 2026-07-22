<script setup lang="ts">
const { totalInvested, fireAge, yearsToFire, age60TaxAdv, projection, inputs, realDollars } = useFireModel()

const bridgeToday = computed(() => inputs.value.assets.taxable_bridge)
const requiredBridgeToday = computed(() => projection.value.records[0]?.required_bridge ?? 0)
const bridgeCoverage = computed(() =>
  requiredBridgeToday.value > 0 ? bridgeToday.value / requiredBridgeToday.value : 0,
)

const kpis = computed(() => [
  {
    label: 'Total Invested Assets',
    value: formatCurrency(totalInvested.value),
    hint: 'Tax-advantaged + taxable bridge + college funds',
  },
  {
    label: 'Projected Full FIRE Age',
    value: fireAge.value === null ? 'Not by 60' : String(fireAge.value),
    hint:
      fireAge.value === null
        ? 'Bridge never clears the NPV test before traditional retirement'
        : `${yearsToFire.value} year${yearsToFire.value === 1 ? '' : 's'} away`,
  },
  {
    label: `Age ${inputs.value.simulation.traditional_retire_age} Tax-Advantaged Balance`,
    value: formatCurrency(age60TaxAdv.value),
    hint: realDollars.value
      ? "Traditional + Roth + HSA + 401(k), in today's dollars"
      : 'Traditional + Roth + HSA + 401(k), compounded (nominal)',
  },
  {
    label: 'Bridge Coverage Today',
    value: formatPercent(bridgeCoverage.value, 0),
    hint: `${formatCurrencyCompact(bridgeToday.value)} of ${formatCurrencyCompact(requiredBridgeToday.value)} needed to retire now`,
  },
])
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    <UCard v-for="kpi in kpis" :key="kpi.label">
      <div class="text-sm text-muted">{{ kpi.label }}</div>
      <div class="mt-1 text-3xl font-semibold text-highlighted">{{ kpi.value }}</div>
      <div class="mt-1 text-xs text-dimmed">{{ kpi.hint }}</div>
    </UCard>
  </div>
</template>
